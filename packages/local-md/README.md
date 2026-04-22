# @windrun-huaiin/fumadocs-local-md

A compatibility-focused local Markdown source package based on the open-source `@fumadocs/local-md` project.
You can visit his [source code here](https://github.com/fuma-nama/fumadocs), and also read his [blog](https://www.fumadocs.dev/) is a good idea.

This package is maintained as a project-specific fork for environments that need a local Markdown source layer compatible with an older Fumadocs stack, especially `fumadocs-core@16.0.9` and `fumadocs-ui@16.0.9`.

## Why This Fork Exists

The upstream `@fumadocs/local-md` package is designed for the modern Fumadocs ecosystem. In practice, adopting it inside an existing production codebase can be difficult when:

- the project cannot upgrade the full Fumadocs stack together
- custom UI extensions depend on older `fumadocs-ui` types and behaviors
- the existing documentation layer already relies on project-specific rendering, icons, and MDX integrations

This fork exists to close that compatibility gap without requiring a full upstream upgrade.

## Goals

- Keep a local Markdown source workflow for Fumadocs-based projects
- Preserve compatibility with `fumadocs-core@16.0.9`
- Avoid forcing `fumadocs-ui` upgrades in projects with heavy custom UI extensions
- Support project-specific integration requirements such as:
  - custom themed icon resolution
  - custom MDX rendering behavior
  - compatibility-focused loader adaptation

## Key Differences From Upstream

Compared with upstream `@fumadocs/local-md`, this fork includes compatibility and integration changes for older Fumadocs environments and real-world monorepo usage.

Notable adaptation areas include:

- compatibility fixes for `fumadocs-core@16.0.9`
- workspace-friendly packaging and exports
- frontmatter/schema handling aligned with this project's runtime expectations
- custom loader integration to preserve icon and page-tree behavior
- local integration adjustments for project-specific MDX rendering flows

This package should be treated as a maintained compatibility fork, not as a drop-in mirror of the upstream release.

## Scope

This fork is primarily intended for:

- projects already built on an older Fumadocs stack
- teams that need a local Markdown source solution without upgrading all Fumadocs packages together
- monorepos with project-specific MDX, icon, and layout integration requirements

If you are starting from scratch on the latest Fumadocs stack, the upstream package is still the first thing to evaluate.

## Runtime Cache Strategy

This fork no longer keeps the upstream-style development watch server.

Instead, cache behavior is controlled with a server-side environment variable:

- `LOCAL_MD_CACHE_DISABLE=true`

When this value is set to `true`, local markdown and MDX content are read and parsed again on refresh instead of reusing cached results.

This keeps the development model simple:

- no extra local dev server
- no runtime watch connection setup
- normal refresh-based content verification during development

In production, you can leave this variable unset so the package keeps its normal cache behavior.

## Attribution

This package is based on the open-source `@fumadocs/local-md` project from Fumadocs.

The original architecture and upstream implementation come from the Fumadocs project and its author(s). This fork adds substantial compatibility and integration adaptations for the Windrun-Huaiin monorepo and other projects with similar version-lock and migration constraints.

## Naming

This package is published under a separate name because it is not the official upstream package:

- upstream: `@fumadocs/local-md`
- this fork: `@windrun-huaiin/fumadocs-local-md`

The separate package name is intentional and helps avoid confusion between upstream releases and this compatibility-focused fork.

## License

This package keeps the upstream license model. See the repository license information before external reuse or redistribution.
