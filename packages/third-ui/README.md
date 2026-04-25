# @windrun-huaiin/third-ui

This README currently documents only the Fuma/MDX component design in `third-ui`.

Other modules in this package, such as Clerk, main application UI, AI UI, fingerprint, SEO helpers, and shared layout utilities, are intentionally not covered here.

## MDX Component Layer

The Fuma/MDX part of `third-ui` provides the rendering component map used by application MDX pages.

It is not responsible for reading files or compiling MDX. That belongs to `@windrun-huaiin/fumadocs-local-md`.

The split is:

- `local-md`: content source, frontmatter/meta parsing, Markdown/MDX compilation, render execution safety.
- `third-ui`: React components used when MDX is rendered.
- application: chooses which compiler features and renderer features are imported.

## Design Goals

- Keep the base MDX component map useful but small.
- Make heavyweight rendering features explicit imports.
- Avoid old aggregate component entries that import every renderer feature at module load time.
- Let application code be the capability declaration.
- Preserve a safe fallback path when disabled or unknown MDX components appear in content.
- Keep renderer-only capabilities separate from compiler-only capabilities.

## Current Entry Model

New applications should use the base site MDX entry:

```ts
@windrun-huaiin/third-ui/fuma/server/site-mdx/base
```

Optional renderer features live behind physical subpath entries:

```ts
@windrun-huaiin/third-ui/fuma/server/site-mdx/features/code
@windrun-huaiin/third-ui/fuma/server/site-mdx/features/math
@windrun-huaiin/third-ui/fuma/server/site-mdx/features/mermaid
@windrun-huaiin/third-ui/fuma/server/site-mdx/features/type-table
```

The old aggregate entries have been removed. There is no supported `site-mdx-components` entry and no `optional-features` aggregate entry.

## Base Components

The base entry is the minimum component set for normal documentation content.

It includes:

- Fuma UI basics: `Card`, `Cards`, `Callout`, `File`, `Folder`, `Files`, `Accordion`, `Accordions`, `Tab`, `Tabs`.
- Markdown element renderers: headings, links, blockquote, lists, table, inline code, pre, image, and related primitive tags.
- Site-level lightweight components: `SiteX`, `TrophyCard`, `ZiaCard`, `GradientButton`, `ZiaFile`, `ZiaFolder`, `SunoEmbed`.
- Image rendering integration with image fallback and CDN-related options.
- Feature-specific fallback components for disabled math, Mermaid, type table, and code-tab style components.

It intentionally does not include heavyweight renderer implementations such as Mermaid, KaTeX rendering, Fuma codeblock rendering, or type-table rendering.

## Renderer Feature Matrix

| Capability | Renderer Entry | Compiler Entry Required | Notes |
| --- | --- | --- | --- |
| `base` | `site-mdx/base` | `local-md/presets/fuma-docs/base` | Required for normal MDX rendering |
| `code` | `site-mdx/features/code` | `local-md/presets/fuma-docs/features/code` | Enables Fuma codeblock UI and built-in language icon mapping |
| `math` | `site-mdx/features/math` | `local-md/presets/fuma-docs/features/math` | Enables `MathBlock` and `InlineMath` rendering |
| `mermaid` | `site-mdx/features/mermaid` | Not required | Renderer-only component capability |
| `type-table` | `site-mdx/features/type-table` | Not required | Renderer-only component capability |
| `npm` | Not required | `local-md/presets/fuma-docs/features/npm` | Compiler-only content transform |

This table is the main rule for application integration.

`code` and `math` need both compiler and renderer support. `npm` is compiler-only. `mermaid` and `type-table` are renderer-only.

## Bundle Cropping Rule

Renderer pruning is based on import boundaries.

If an application does not import `site-mdx/features/mermaid`, Mermaid renderer code should not be pulled into the base renderer entry. The same rule applies to code, math, and type-table renderer features.

Do not reintroduce a file that imports all renderer features and then chooses one at runtime. That pattern defeats bundle cropping because static imports run before configuration checks.

Correct model:

- base entry imports only base renderers and lightweight fallback components.
- each optional feature entry imports only its own renderer implementation.
- application code imports the feature entries it wants.

## Fallback Design

There are two fallback layers.

The first layer lives in `third-ui`.

It provides feature-aware fallbacks for known but disabled MDX capabilities:

- `MathBlock`
- `InlineMath`
- `Mermaid`
- `TypeTable`
- `CodeBlockTab`
- `CodeBlockTabs`
- `CodeBlockTabsList`
- `CodeBlockTabsTrigger`

These fallbacks render visible warning blocks instead of silently dropping content.

The second layer lives in `local-md`.

It is the final safety net for arbitrary unknown PascalCase components, such as:

```mdx
<CalloutXXX />
```

`local-md` detects missing component references from the compiled MDX output and injects generic fallback components before rendering. This prevents unknown MDX components from crashing the page.

The priority order is:

- application-provided MDX components
- enabled `third-ui` renderer feature components
- `third-ui` known disabled-feature fallbacks
- `local-md` generic unknown-component fallback

## Heavy Renderer Boundary

Heavy renderers are isolated under dedicated feature paths or heavy modules.

Examples:

- Mermaid rendering is behind the Mermaid feature entry.
- Math rendering uses the math feature entry and lazy heavy math renderer.
- Type table rendering is behind the type-table feature entry.
- Fuma codeblock rendering is behind the code feature entry.

The code renderer owns its programming-language icon map internally. Applications should not pass a global icon map into `createCodeMdxComponents()`.

This keeps `site-mdx/base` from becoming a hidden dependency sink.

## Application Rules

Applications should treat their MDX integration files as the capability declaration.

For `apps/ddaas`, the important files are:

- `src/lib/content-source.ts`: compiler/source capabilities.
- `src/components/mdx-components.tsx`: renderer/component capabilities.

When enabling a capability:

- import the compiler feature only if the capability needs compiler support.
- import the renderer feature only if the capability needs renderer support.
- add the imported feature to the matching `features` list.
- do not import unused feature entries “just in case”.

If an application creates its own MDX component and that component imports a heavy package directly, the package can still enter the bundle. That is expected and belongs to the application layer.

## Styling

MDX components assume the application includes the package styles and Tailwind source scanning for `third-ui`.

The exact global CSS setup is application-specific, but MDX pages need the same base styles used by the rest of the Fuma UI integration.

## Export Map

MDX-related exports currently relevant to this design:

| Export | Purpose |
| --- | --- |
| `./fuma/server/site-mdx/base` | Recommended base MDX component factory |
| `./fuma/server/site-mdx/features/code` | Optional code renderer components |
| `./fuma/server/site-mdx/features/math` | Optional math renderer components |
| `./fuma/server/site-mdx/features/mermaid` | Optional Mermaid renderer components |
| `./fuma/server/site-mdx/features/type-table` | Optional type-table renderer components |
| `./fuma/mdx` | Shared MDX building blocks used by pages and widgets |
| `./fuma/heavy` | Heavy renderer exports; avoid importing from app base paths unless intentionally needed |
| `./fuma/share` | Shared markdown component utilities |

## Non-Goals

- This README does not document Clerk, main UI, AI UI, fingerprint, or SEO helpers.
- The base MDX entry should not become an all-features preset.
- Runtime feature flags should not be used as the primary pruning mechanism.
- Unknown MDX components should not crash the page.
