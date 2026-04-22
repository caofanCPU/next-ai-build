# Local-md Integration Notes

This note summarizes the main code touch points after switching to our forked `local-md` package, and the MDX features that are currently unsupported or intentionally replaced.

## Files Usually Need To Change

The exact scope depends on the project structure, but in a normal `local-md` integration the main file names involved are:

- `package.json`
- `next.config.ts`
- `local-md-source.ts`
- `source-docs.ts`
- `source-blog.ts`
- `source-legal.ts`
- `layout.tsx`
- `page.tsx`
- `mdx-components.tsx`
- `math.tsx`
- `README.md`

## What These Files Usually Handle

- `package.json`: switch dependency from upstream package to our forked package name.
- `next.config.ts`: ensure workspace package transpilation and tracing behavior are correct.
- `local-md-source.ts`: create the runtime markdown source and adapt it back into the older Fumadocs loader shape.
- `source-docs.ts`, `source-blog.ts`, `source-legal.ts`: replace old generated-source usage with the new local source loader.
- `layout.tsx`, `page.tsx`: adjust tree typing and content loading usage if the old generated source contract was different.
- `mdx-components.tsx`: register custom MDX runtime components.
- `math.tsx`: provide custom `MathBlock` and `InlineMath` rendering.

## Project-Specific Bugfix Files

These were touched in our project, but they are not inherent requirements of `local-md` itself:

- `global-icon.tsx`
- `icons/index.ts`
- `limited-lucide-icons.ts`

They belong to project-specific compatibility fixes, mainly around icon-name resolution and local icon export cleanup.

## MDX Features Currently Not Supported

These are the main limitations or deliberate differences in the current solution:

- Fenced code blocks like ```` ```math ```` are not supported as a math syntax path.
- Old Fuma-style `include` tags are not supported.
- Inline math inside heading lines is not supported.
- Legacy compatibility for every old `fumadocs-mdx`-specific custom syntax is not guaranteed.
- Any syntax that depended on the old generated compile pipeline may require either a custom component or a manual rewrite.

## Replacement Rules In Current Project

- Use `<MathBlock formula="..." />` instead of fenced `math` blocks.
- Use `<InlineMath formula="..." />` instead of older inline math shortcuts.
- Use explicit MDX components when a feature used to depend on old compile-time magic.
- Use frontmatter `icon` with icon names resolved by our runtime icon adapter.

## Cache Control

The current cache behavior is controlled by a server-side environment variable:

- `LOCAL_MD_CACHE_DISABLE=true`

When this value is set to `true`, the main `local-md` caches are disabled.

In that mode:

- local Markdown and MDX files are re-read on refresh
- content is re-parsed instead of reusing the cached result
- a normal page refresh is usually enough to see the latest content changes

The previous development watch server has been removed from this fork to keep the package smaller and simpler.

## Practical Rule Of Thumb

If a feature was previously handled by old `fumadocs-mdx` compile-time transforms, do not assume it will continue to work automatically under this `local-md` runtime path.

The safe approach is:

- keep standard Markdown and standard MDX
- move advanced behavior into explicit React/MDX components
- keep custom syntax small, visible, and easy to test
