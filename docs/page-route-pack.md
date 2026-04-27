# Page Route Function Package Investigation

This document summarizes the investigation of unusually similar Vercel Serverless Function sizes for App Router page routes in `apps/ddaas`.

## Background

The site has these runtime requirements:

- Internationalized routes through `next-intl`.
- Clerk login and user UI.
- Fumadocs UI components for navigation, docs pages, TOC, and MDX UI.
- A custom `local-md` layer based on `fumadocs-core` for MDX docs/blog/legal content.
- Home/pricing pages use the common navbar/banner, but do not need docs page layout or MDX content runtime.
- Only `docs`, `blog`, and `legal` routes need Fumadocs docs page layout and local-md content source.

The problem seen on Vercel was that many normal Page Route functions were around the same size, initially near `6.32 MiB`, suggesting shared dependencies were being pulled into every page function.

## How It Was Investigated

The main source of truth was the Next.js output file tracing files:

```bash
apps/ddaas/.next/server/app/**/page.js.nft.json
apps/ddaas/.next/server/app/**/route.js.nft.json
```

For each route, the traced files were summed by reading the `.nft.json` file and adding file sizes. This showed which files Vercel would copy into each function.

Useful checks:

```bash
pnpm --filter @windrun-huaiin/ddaas-website build
```

Then inspect route traces:

```bash
node -e "/* read .nft.json and sum traced files */"
```

The important distinction:

- `page.js` size is not the full function size.
- The function size is mostly the set of files listed in `.nft.json`.
- Dynamic filesystem reads, broad barrels, and provider defaults can make output tracing conservative.

## Findings

### 1. Build-Time Files Were Traced Into Page Functions

Several files under `apps/ddaas` were being copied into many route functions even though they are not runtime files:

```ts
./tsconfig.tsbuildinfo
./tsconfig.json
./tsconfig.node.json
./dev-scripts.config.json
./components.json
./eslint.config.js
./postcss.config.mjs
./next.config.ts
./CHANGELOG.md
./LICENSE
./logs/**/*
./database/**/*
```

Examples:

- `tsconfig.tsbuildinfo` was about `588 KiB` and appeared in many functions.
- `dev-scripts.config.json` was build-time only and appeared in 22 route traces.
- logs and database SQL files were traced due to conservative filesystem tracing.

Why it happened:

- Some server-side code used `process.cwd()`, `fs`, `readdir`, or glob-style runtime reads.
- Next output tracing cannot always prove which files are safe to omit.
- It conservatively included files near the app root.

Fix:

These files were added to `outputFileTracingExcludes` in `apps/ddaas/next.config.ts`.

Files intentionally not excluded:

- `package.json`: small and sometimes read by framework/package runtime.
- `prisma/schema.prisma`: Prisma-related runtime behavior can depend on schema/generated metadata, so it was left untouched.

### 2. `@third-ui/fuma/server` Barrel Pulled Unrelated Server Code Together

Original barrel:

```ts
export * from './fuma-page-genarator';
export * from './fuma-translate-util';
export * from './llm-copy-handler';
export * from './fuma-banner-suit';
export * from './site-x';
```

Problem:

- Root layout only needed `getFumaTranslations`, but importing from `@third-ui/fuma/server` also exposed page generator and LLM copy code.
- `LLMCopyHandler` uses `fs` and reads MDX files.
- `createFumaPage` uses docs page/TOC components.
- These concerns should not share an entrypoint.

Fix:

Split concrete entrypoints:

```ts
@third-ui/fuma/fuma-translate-util
@third-ui/fuma/server/page-generator
@third-ui/fuma/server/llm-copy-handler
```

Current usage:

- Root layout imports translations from `@third-ui/fuma/fuma-translate-util`.
- Docs/blog/legal page files import `createFumaPage` from `@third-ui/fuma/server/page-generator`.
- LLM content routes import `LLMCopyHandler` from `@third-ui/fuma/server/llm-copy-handler`.

Because the app uses a TypeScript path alias:

```json
"@third-ui/*": ["../../packages/third-ui/src/*"]
```

source-level wrapper files are required:

```ts
packages/third-ui/src/fuma/server/page-generator.ts
packages/third-ui/src/fuma/server/llm-copy-handler.ts
```

No unused wrapper entrypoints are kept.

### 3. `@third-ui/fuma/base` Mixed Home Layout and Docs Layout

Original issue:

- `SiteHomeLayout`, `SiteDocsLayout`, and `DocsRootProvider` lived behind the same base barrel/module boundary.
- `site-layout.tsx` imported both `DocsLayout` and `RootProvider`.
- Home pages only needed `SiteHomeLayout`, but the module boundary touched docs-related code.

Fix:

Split the base architecture into concrete modules:

```ts
@third-ui/fuma/base/site-home-layout
@third-ui/fuma/base/site-docs-layout
@third-ui/fuma/base/docs-root-provider
@third-ui/fuma/base/site-layout-shared
@third-ui/fuma/base/nav-config
```

Compatibility:

- `site-layout.tsx` remains as a re-export compatibility layer.
- App code should prefer concrete imports instead of `@third-ui/fuma/base`.

Important type cleanup:

- `ExtendedLinkItem` is exported only from `site-layout-shared`.
- `custom-home-layout` no longer exports the same type, avoiding duplicate barrel exports.

### 4. `@windrun-huaiin/lib` Root Entry Was Dangerous

Original root entry:

```ts
export * from './utils';
export * from './llm-utils';
export * from './common-app-config';
```

Problem:

- Home page code only needed `cn` and `getAsNeededLocalizedUrl`.
- Some files imported from `@windrun-huaiin/lib`.
- The root barrel exported `llm-utils`.
- `llm-utils` imports `remark`, `remark-gfm`, `remark-mdx`, `remark-frontmatter`, `micromark`, `unified`, and related markdown parser dependencies.
- This pulled about `420 KiB` of markdown parser runtime into the home page function.

Fix:

Remove `llm-utils` from the root entry:

```ts
// packages/lib/src/index.ts
export * from './utils';
export * from './common-app-config';
```

Use explicit imports:

```ts
import { cn, getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { getLLMText } from '@windrun-huaiin/lib/llm-utils';
```

Current rule:

- `@windrun-huaiin/lib` root must stay lightweight.
- Any heavy parser/runtime module must be imported through an explicit subpath.

### 5. Fumadocs `RootProvider` Pulled Search Into Every Page

Fumadocs provider source behavior:

```ts
const DefaultSearchDialog = lazy(() => import("../components/dialog/search-default.js"));
```

Even when route layouts set:

```ts
searchToggle: { enabled: false }
```

the provider module itself still contained the lazy import for `search-default`, so Next traced the search dialog chunk.

This brought in:

```txt
fumadocs-ui/components/dialog/search-default
fumadocs-core/search/client
parse5 / hast / rehype related search rendering dependencies
```

Fix:

`packages/third-ui/src/fuma/base/docs-root-provider.tsx` no longer imports `fumadocs-ui/provider/next`.

Instead, it composes only the needed base providers:

```tsx
<NextProvider>
  <I18nProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </I18nProvider>
</NextProvider>
```

Search is not mounted. This removes Fumadocs search from normal page traces.

Note:

- `DirectionProvider` was not added directly because `@radix-ui/react-direction` is not a direct dependency of `third-ui`.
- Current site behavior is LTR, so this is acceptable. If RTL is needed later, add the dependency explicitly and reintroduce direction handling intentionally.

## Non-Essential Packages Removed From Normal Page Routes

The following are no longer present in the home page trace as large chunks:

- `remark`
- `remark-gfm`
- `remark-mdx`
- `micromark`
- `unified`
- `fumadocs-ui/components/dialog/search-default`
- `fumadocs-core/search/client`
- build-time configs and logs listed above

Remaining normal-page heavy areas:

- Next App Router runtime.
- Clerk/auth runtime.
- Fingerprint provider/runtime.
- Fumadocs home/nav components.
- Base UI icons.
- Framer Motion.
- Radix UI popover/dropdown primitives.
- i18n runtime/messages.

## Route Size Progress

Approximate home page function trace size across the investigation:

| Step | Home Page Trace Size | Notes |
|---|---:|---|
| Initial traced state | `~5.66 MiB` | build files, MDX metadata, barrels, providers all mixed |
| Exclude build/config/log files and avoid `fuma/server` translation barrel | `~3.94 MiB` | removed major accidental root files |
| Split `fuma/base` home/docs entrypoints | `~3.88 MiB` | small size win, important boundary cleanup |
| Remove `@windrun-huaiin/lib` root barrel LLM export usage | `~3.46 MiB` | removed large markdown parser chain |
| Replace Fumadocs `RootProvider` with no-search provider composition | `~3.04 MiB` | removed Fumadocs search/default chunks |

Current checked route traces:

| Route | Trace Size | Search Trace |
|---|---:|---:|
| `/[locale]` home | `~3.04 MiB` | `0` hits |
| `/[locale]/pricing` | `~3.39 MiB` | `0` hits |
| `/[locale]/docs/[...slug]` | `~22.27 MiB` | `0` hits |

Content pages remain large because they legitimately include local-md source artifacts and MDX content indexes.

## Current Page Layout / Provider Hierarchy

Root locale layout:

```tsx
<html lang={locale}>
  <NextIntlClientProvider messages={messages}>
    <body className={montserrat.className}>
      <NProgressBar />
      <ClerkProviderClient>
        <DocsRootProvider>
          {children}
        </DocsRootProvider>
      </ClerkProviderClient>
    </body>
  </NextIntlClientProvider>
</html>
```

Current `DocsRootProvider` is a `third-ui` controlled provider, not the Fumadocs all-in-one root provider:

```tsx
<NextProvider>
  <I18nProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </I18nProvider>
</NextProvider>
```

No `SearchProvider` is mounted by default.

Home route group:

```tsx
<FingerprintProvider>
  <SiteHomeLayout>
    {children}
  </SiteHomeLayout>
</FingerprintProvider>
```

Home layout includes:

- custom navbar/header
- shared banner support
- footer
- go-to-top
- theme switch
- i18n switch
- Clerk user/credit nav custom items where configured

Docs route group:

```tsx
<SiteDocsLayout>
  {children}
</SiteDocsLayout>
```

Blog/legal content route groups:

```tsx
<SiteHomeLayout>
  <SiteDocsLayout>
    {children}
  </SiteDocsLayout>
</SiteHomeLayout>
```

This preserves the common navbar/banner while only docs/blog/legal routes use docs page layout and local-md source trees.

## Boundary Rules Going Forward

Use concrete subpath imports for anything with meaningful runtime weight.

Prefer:

```ts
@windrun-huaiin/lib/utils
@windrun-huaiin/lib/llm-utils
@third-ui/fuma/base/site-home-layout
@third-ui/fuma/base/site-docs-layout
@third-ui/fuma/base/docs-root-provider
@third-ui/fuma/server/page-generator
@third-ui/fuma/server/llm-copy-handler
```

Avoid in normal page/layout code:

```ts
@windrun-huaiin/lib
@third-ui/fuma/server
@third-ui/fuma/base
fumadocs-ui/provider/next
```

Use `fumadocs-ui/provider/next` only if the site intentionally wants the Fumadocs default search provider and accepts the package cost.

## Quick Regression Checks

After build, verify home page trace:

```bash
pnpm --filter @windrun-huaiin/ddaas-website build
```

Then check:

- no `search-default` in home `.nft.json`
- no `fumadocs-core_dist_search` in home `.nft.json`
- no large `remark/micromark/unified` chunk in home `.nft.json`
- no build-time files such as `tsconfig.tsbuildinfo`, `logs`, `dev-scripts.config.json`

If these reappear, inspect new imports for broad barrels or provider defaults.

## Lessons: Writing Correct Boundaries

The main lesson is that "code organization" and "runtime packaging boundary" are not the same thing.

A barrel export can be convenient for source navigation, but it is also a dependency boundary. If a light helper and a heavy runtime module share the same root entrypoint, any consumer of the light helper may pay for the heavy module.

### Boundary Principles

Keep root entrypoints boring and lightweight.

Good root entrypoints:

- pure utility functions
- small config helpers
- type-only exports
- modules without filesystem, parser, auth, search, database, SDK, or UI-provider side effects

Avoid putting these in root entrypoints:

- Markdown/MDX parsers
- search engines or search dialogs
- filesystem readers
- database clients
- auth SDKs
- payment SDKs
- generated Prisma clients
- provider components that mount broad default behavior
- components that import large UI ecosystems

Use feature subpaths for heavy capabilities:

```ts
@windrun-huaiin/lib/utils
@windrun-huaiin/lib/llm-utils
@third-ui/fuma/server/page-generator
@third-ui/fuma/server/llm-copy-handler
```

### How To Judge "On Demand"

"On demand" means the route imports a module only when that route actually needs that feature at runtime.

It is not enough that a component hides a feature with a flag:

```tsx
searchToggle={{ enabled: false }}
```

If the provider module has a top-level import or lazy import for search, the package can still be traced.

Use these questions:

1. Does this route need the feature to render or respond?
2. Is the import path specific to that feature?
3. Does the module have top-level imports for unrelated features?
4. Does the provider mount defaults that the route does not use?
5. Would importing this from a plain home page pull docs, search, parser, auth, database, or file-system code?

If the answer to 3, 4, or 5 is yes, the boundary is not truly on-demand.

### Practical Rules

Prefer concrete imports in route/layout code:

```ts
import { SiteHomeLayout } from '@third-ui/fuma/base/site-home-layout';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
```

Avoid broad imports in route/layout code:

```ts
import { SiteHomeLayout } from '@third-ui/fuma/base';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
```

Do not treat `enabled: false` as a packaging guarantee. It is only runtime behavior unless the import boundary also excludes the feature.

When wrapping third-party providers, do not blindly expose the all-in-one provider. Recompose the minimal contexts the app actually needs.

For this site, the correct approach was:

- use Fumadocs basic contexts/components
- avoid Fumadocs default search provider
- keep docs layout only in docs/blog/legal route groups
- keep LLM/MDX parsing only in LLM and content routes

### Review Checklist For New Code

Before adding a shared export or provider:

- Can this module be imported by the home page without pulling non-home features?
- Does this entrypoint export both "light helpers" and "heavy runtime"?
- Are server-only utilities mixed with client UI components?
- Are docs/search/MDX/parser capabilities mixed with navbar/home layout?
- Is an `fs` or `process.cwd()` module reachable from normal page layouts?
- Does the provider import optional features at module top level?
- Can the feature be moved to a subpath entrypoint?

If a module is heavy but legitimate, make it explicit in the import path. The import path should tell the reader what runtime cost they are opting into.
