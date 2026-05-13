# `@windrun-huaiin/fumadocs-local-md`

The positioning of `local-md` is now clearly defined:

- Integrate with the content source capabilities of `fumadocs-core`
- Support two content source modes: `runtime` and `build`
- Use `.source` as the build output directory
- Expose unified data-fetching interfaces and an official CLI to the application layer

It no longer requires applications to maintain a custom MDX build script, nor does it require applications to directly perceive the internal MDX build implementation.

## Design Goals

- Use built static content sources by default in production to avoid re-parsing MD/MDX during requests
- Use build artifacts by default in development to ensure consistent behavior between local and production environments
- Fall back to `runtime` mode **only when explicitly enabled in development** to reduce wait time from frequent builds
- Keep component injection at the render phase, letting the upper application decide which component capabilities to enable
- `local-md` handles "content source processing"; `third-ui` or the application layer handles "component rendering"

## New Architecture

### 1. `runtime` Mode

`runtime` mode directly reads source files under `src/mdx` and completes the following **at runtime**:

- File scanning
- Frontmatter parsing
- Remark / rehype processing
- MDX compilation
- Page tree and page data assembly

This mode is suitable for fast local development but **not recommended for production** to serve long-term documentation traffic.

### 2. `build` Mode

`build` mode first runs a build process to process documentation content into `.source` artifacts.

During requests, it only handles:

- Reading `.source` files
- Assembling the source structure required by `fumadocs-core`
- Injecting components on demand during actual page rendering

In short, heavy operations like MDX re-parsing, remark/rehype/shiki processing are **pre-executed at build time**.

### 3. `.source` Directory

Generated in the application root:

```text
.source/
  index.ts
  blog.source.config.mjs
  docs.source.config.mjs
  legal.source.config.mjs
```

Conventions:

- `.source/index.ts` is the main entry
- Each top-level content source directory maps to `.source/<sourceKey>.source.config.mjs`
- `sourceKey` is derived from the top-level subdirectory names under `src/mdx/*`

Example:

```text
src/mdx/
  docs/
  blog/
  legal/
```

The CLI will automatically detect three content sources: `docs`, `blog`, and `legal`.

## CLI

The **only recommended build entry** for the application layer:

```bash
pnpm exec local-md build
```

CLI Conventions:

- Current working directory = application root
- Fixed content root: `src/mdx`
- Auto-scan top-level subdirectories under `src/mdx` as source keys
- Output written **fixed** to `.source` in the application root

This means the application layer no longer needs custom scripts for "scanning directories and generating sources".

## Application Layer Integration

The application layer typically only needs two parts:

- Define a unified `local-md` source configuration
- Choose between `build` or `runtime` mode when fetching content sources

**Recommended Strategy**:
- Production: always use `build`
- Development: use `build` by default
- Use `runtime` **only when the development flag is explicitly turned on**

Example (used in `ddaas`):
- Use `runtime` when `LOCAL_MD_DEV_RUNTIME=true` **and** non-production
- Use `build` in all other cases

This guarantees:
- Static content sources in production
- Local behavior matches production by default
- Switch to runtime mode explicitly for fast documentation edits

## Component & Dependency Boundaries

Two distinct responsibilities in this design:
- "Parsing & compiling" documentation content
- "Component injection & rendering" of documentation pages

`local-md` handles the former; the application layer or `third-ui` handles the latter.

Therefore:
- `.source` stores fully processed content results
- Component injection still happens at the page render phase
- Unused component capabilities in the app are **not forced** in the render layer

Important note:
- The `local-md` package itself still depends on the full MDX compilation chain to correctly parse and process MDX
- This is **separate** from whether a component is actually rendered on the page

In short: `build` solves request-time performance and stability; component enablement remains controlled by the upper layer.

## Caching

Even in `build` mode, a runtime cache layer is retained.

Cached objects (**not** recompiled MDX):
- `.source` file read results
- Assembled source results from `fumadocs-core` loader
- Renderer instances for some pages

Purpose:
- Avoid repeated disk reads on every request
- Avoid repeated assembly of the same source data on every request

If set:
```bash
LOCAL_MD_CACHE_DISABLE=true
```

All runtime objects will be re-read and re-created on every request.

## Public API Boundary

Only two types of capabilities are recommended for external use:
- Package runtime interfaces
- `local-md build` CLI

Internal code under `src/md-build/*` is implementation detail for `local-md` itself and **should not be imported directly** by the application layer.

In short:
- Application layer **should not** depend on `./md-build`
- Application layer **should not** call internal build APIs directly
- Application layer only needs to execute the CLI and read `.source` at runtime

## Recommended Workflow

Development:
```bash
pnpm exec local-md build
pnpm dev
```

For fast edits (temporarily skip build):
```bash
LOCAL_MD_DEV_RUNTIME=true pnpm dev
```

Before deployment:
```bash
pnpm exec local-md build
pnpm build
```

Two deployment options:
- Commit/include `.source` as part of the repository/build input
- Run `local-md build` before the application's formal build

In all cases, production **must read from `.source`** and **must not fall back to `runtime`**.