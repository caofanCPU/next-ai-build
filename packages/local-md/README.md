# @windrun-huaiin/fumadocs-local-md

Local Markdown/MDX source runtime for Fumadocs-style documentation sites.

This package is responsible for reading local content files, parsing frontmatter and meta files, compiling Markdown/MDX, rendering page bodies, and exposing a source loader that application projects can use from server-side routes or page generators.

## Design Goals

- Keep local Markdown and MDX loading in one server-side package.
- Provide a small base compiler preset that is safe for minimal documentation sites.
- Make heavyweight MDX capabilities opt-in through physical import boundaries.
- Avoid feature flags that run after static imports, because those cannot reliably reduce bundle output.
- Support Fumadocs-style source data, TOC, structured data, frontmatter schemas, and meta schemas.
- Keep application integration explicit enough that bundle ownership is clear.

## Recommended Entry Points

Use these entries for new integrations:

```ts
import { createConfiguredLocalMdSourceFactory } from '@windrun-huaiin/fumadocs-local-md/server/source';
import { createFumaDocsBaseCompilerOptions } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/base';
```

Optional compiler features are exposed as separate entries:

```ts
import { createFumaDocsCodeFeature } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/features/code';
import { createFumaDocsMathFeature } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/features/math';
import { createFumaDocsNpmFeature } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/features/npm';
```

The legacy aggregate preset is still exported:

```ts
import { createFumaDocsCompilerOptions } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs';
```

Prefer the base-plus-feature entry model when bundle pruning matters.

## Basic Usage

```ts
import { createConfiguredLocalMdSourceFactory } from '@windrun-huaiin/fumadocs-local-md/server/source';
import { createFumaDocsBaseCompilerOptions } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/base';

export const mdxSourceFactory = createConfiguredLocalMdSourceFactory({
  frontmatterSchema,
  metaSchema,
  i18n,
  icon(icon) {
    return getIcon(icon);
  },
  ...createFumaDocsBaseCompilerOptions(),
});

export async function getContentSource(sourceKey: 'docs' | 'blog' | 'legal') {
  return mdxSourceFactory.getCachedSource(sourceKey);
}
```

The source factory returns a cached source loader. Each source key maps to local content under the configured source root, for example `src/mdx/docs`, `src/mdx/blog`, or `src/mdx/legal`.

## Compiler Capabilities

The base preset includes the common Markdown/MDX pipeline and lightweight Fumadocs structure plugins. Heavy features are opt-in.

```ts
import { createFumaDocsBaseCompilerOptions } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/base';
import { createFumaDocsCodeFeature } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/features/code';
import { createFumaDocsMathFeature } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/features/math';
import { createFumaDocsNpmFeature } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/features/npm';

const compilerOptions = createFumaDocsBaseCompilerOptions({
  features: [
    createFumaDocsCodeFeature(),
    createFumaDocsMathFeature(),
    createFumaDocsNpmFeature(),
  ],
});
```

| Capability | Compiler Feature | Main Effect |
| --- | --- | --- |
| `base` | `createFumaDocsBaseCompilerOptions()` | Markdown/MDX parsing, TOC, structure, heading handling, code tabs, steps |
| `code` | `createFumaDocsCodeFeature()` | Rehype code highlighting and Shiki-related compiler chain |
| `math` | `createFumaDocsMathFeature()` | `remark-math` and `rehype-katex` |
| `npm` | `createFumaDocsNpmFeature()` | Install command transformation through Fumadocs npm remark plugin |

Renderer-only capabilities such as Mermaid diagrams and type tables are not compiler features. They belong in the MDX component layer of the application or UI package.

## Bundle Pruning Model

Bundle pruning is based on imports, not runtime configuration.

If an application only imports the base preset, code/math/npm compiler implementations are not statically imported by the base entry. To enable a feature, the application must import the feature entry and pass the feature object into `createFumaDocsBaseCompilerOptions()`.

This is intentional. A config array such as `features: ['code']` is not enough if the module that interprets it has already imported every implementation at the top level.

## Runtime Rendering Safety

MDX files can reference components that were not registered by the application. By default, MDX throws an error such as:

```txt
Expected component `Example` to be defined
```

This package treats that as a content authoring problem, not a reason to take the whole page down.

The fallback is applied in the `local-md` render stage:

1. MDX is compiled to function-body JavaScript.
2. The compiled output is scanned for `_missingMdxReference("ComponentName", true)`.
3. Before rendering the MDX component, `local-md` adds fallback React components for missing PascalCase component names.
4. The MDX runtime receives a real component, so the page renders a visible warning block instead of throwing.

This protects the site from accidental authoring errors such as:

```mdx
<NotRegistered title="Example">
  Content
</NotRegistered>
```

The fallback block shows:

- the missing component name
- primitive props such as strings, numbers, and booleans
- children content when available

Fallback priority is:

1. Application-provided MDX components.
2. UI package feature components, such as code, math, Mermaid, or type-table renderers.
3. UI package feature-specific fallbacks, such as disabled `MathBlock` or `Mermaid`.
4. `local-md` unknown component fallback as the final safety net.

This final fallback is intentionally generic. It does not try to guess which feature should be enabled; it only prevents unknown MDX components from making the route unavailable.

## Cache Behavior

Source loading is cached by default.

Disable the runtime cache during development with:

```bash
LOCAL_MD_CACHE_DISABLE=true
```

When disabled, local content is read and compiled again on refresh. This avoids a separate watch server and keeps the development workflow refresh-based.

## Source Shape

The configured source exposes page data in a Fumadocs-compatible shape:

- `title`
- `description`
- `icon`
- `toc`
- `body`
- `load()`
- frontmatter fields from the configured schema

`load(components)` renders the page body with the supplied MDX component map and returns the rendered body, TOC, structured data, and module exports.

## Export Map

Important package exports:

| Export | Purpose |
| --- | --- |
| `.` | Core local-md API and shared types |
| `./core` | Minimal core API without server source helpers |
| `./server/source` | Configured source factory for applications |
| `./presets/fuma-docs/base` | Recommended base compiler preset |
| `./presets/fuma-docs/features/code` | Optional code compiler feature |
| `./presets/fuma-docs/features/math` | Optional math compiler feature |
| `./presets/fuma-docs/features/npm` | Optional npm compiler feature |
| `./js/executor-virtual` | Virtual JS executor for Markdown AST rendering |
| `./js/executor-native` | Native JS executor |

## Attribution

This package is based on `@fumadocs/local-md`, with substantial modifications and enhancements.
