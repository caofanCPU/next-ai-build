# Fumadocs `local-md` Migration Issues

## Executive Summary

The failure of this migration was not primarily caused by the Markdown files themselves, nor by application-specific page logic. The core issue is that `@fumadocs/local-md` does not behave like a truly isolated, lightweight source-layer utility.

In practice, adopting it implicitly assumes that the host project is already aligned with a newer generation of the Fumadocs dependency stack, including at least:

- a newer `fumadocs-core`
- a matching `fumadocs-ui`
- newer `pageTree`, framework context, and internal runtime contracts

This project, however, still relies on a heavily customized `fumadocs-ui@16.0.9` stack. As a result, what looks like a source-layer replacement quickly expands into a chain of broader compatibility problems:

- forced `fumadocs-core` upgrade
- data shape incompatibilities with the old UI layer
- native/runtime bundling issues in the build pipeline
- framework context splitting
- API breakage between old UI internals and new core exports

For an existing project with significant custom wrappers built on top of the older UI generation, this is not a lightweight content-source migration. It is much closer to a full-stack Fumadocs dependency migration, with correspondingly high cost and risk.

So:

> Could `local-md` be designed as a truly standalone local content-source utility that only reads and parses local files, without requiring specific versions of `fumadocs-core`, `fumadocs-ui`, or other internal Fumadocs packages?

## Background

This project was originally running on the older Fumadocs 16.0.9 generation, using the legacy `fumadocs-mdx` source pipeline:

- `source.config.ts`
- `fumadocs-mdx/config`
- generated `@/.source`
- application code consuming the generated source via `loader()`

The goal of this migration attempt was to adopt the `@fumadocs/local-md` approach recommended in the Fumadocs documentation, in order to:

- remove the dependency on `source.config.ts`
- remove the dependency on `@/.source`
- load content directly from local `src/mdx/**` directories

In principle, this should have been a lightweight source-layer migration. In practice, it turned into a much larger compatibility problem because `local-md` is not isolated from the newer Fumadocs runtime and internal package model.

## Version Comparison

### Original stable dependency set

This was the effective version set that the project had been using successfully:

| Package | Original Version |
| --- | --- |
| `fumadocs-core` | `16.0.9` |
| `fumadocs-ui` | `16.0.9` |
| `fumadocs-docgen` | `3.0.4` |
| `fumadocs-mdx` | `13.0.6` |
| `fumadocs-typescript` | `4.0.13` |

### Versions effectively required during the `local-md` attempt

| Package | Required / Reached During Migration |
| --- | --- |
| `@fumadocs/local-md` | `0.1.1` |
| `fumadocs-core` | `16.8.1` |
| `fumadocs-ui` | still `16.0.9` |
| `fumadocs-docgen` | `3.0.4` |
| `fumadocs-typescript` | `4.0.13` |

### Critical fact

`@fumadocs/local-md@0.1.1` declares:

- `fumadocs-core: ^16.8.0`

This means that adopting `local-md` is not a source-only change. It explicitly forces the host project onto a newer `fumadocs-core` line.

### Why `fumadocs-ui` was not upgraded directly

This constraint also needs to be made explicit:

The project did not avoid upgrading `fumadocs-ui` out of simple conservatism. The reason is that the codebase already contains substantial custom extensions built on top of the older `fumadocs-ui`, including:

- custom Header / HomeLayout / DocsLayout wrappers
- dependencies on older type definitions and internal exports
- additional wrapping around older component behavior and context contracts

The newer `fumadocs-ui` releases introduce clear breaking changes in areas such as:

- type definitions
- export locations
- component structure and context contracts

As a result, upgrading `fumadocs-ui` here is not a small follow-up task. In practice it would likely mean:

- reworking a large set of custom components
- partially rewriting some of them
- and re-running a broad round of integration and UI validation

So **not upgrading `fumadocs-ui` is an engineering constraint with a concrete cost basis, not a trivial choice that can be dismissed with "just upgrade the UI package".**

## What `local-md` appears to promise

Conceptually, `local-md` should only be responsible for:

- scanning local content directories
- parsing frontmatter
- compiling markdown / mdx
- producing page metadata, TOC, and source data structures

From that perspective, it should not need to assume that the host project has already upgraded:

- `fumadocs-ui`
- framework context APIs
- internal `pageTree` shapes
- other Fumadocs runtime internals

In other words, a local file source should ideally behave like a source-layer utility, not like the entry point into an entire new dependency generation.

## Problems encountered during migration

### 1. `local-md` immediately forces a `fumadocs-core` upgrade

The first issue was not business logic. It was the dependency graph itself:

- the project was stable on `fumadocs-core@16.0.9`
- `local-md@0.1.1` requires `fumadocs-core@^16.8.0`

So before validating any actual source migration, the project was already forced into a core upgrade.

This means `local-md` is not an incremental add-on. It is tightly coupled to a newer core runtime.

### 2. `PageTree` structure changed and old `fumadocs-ui` could no longer consume it safely

Once `fumadocs-core` was upgraded, the next issue was the page tree shape.

One concrete example:

- newer `core` uses `$ref: string`
- older `ui` expects object-shaped references such as:
  - `{ file: string }`
  - `{ metaFile?: string }`

The result:

- `DocsLayout tree={...}` became type-incompatible
- there was also a runtime risk because older UI code reads the older structure

This already shows that `local-md` is not just replacing the source layer. Its output shape assumes a newer core/UI contract.

### 3. `fumadocs-docgen -> oxc-transform` broke under Turbopack

The project already used the following MDX plugins:

- `remarkDocGen`
- `remarkTypeScriptToJavaScript`

`remarkTypeScriptToJavaScript` internally relies on:

- `fumadocs-docgen`
- `oxc-transform`

After moving the pipeline into `local-md`, these plugin dependencies became part of the runtime source loading path. Under `next dev` / Turbopack this produced build failures such as:

- `non-ecmascript placeable asset`
- dynamic wasm/native fallback resolution failures inside `oxc-transform`
- `Module not found: Can't resolve '/tmp/oxc-transform-...'`

This is important because it demonstrates that `local-md` is not simply "read local files and parse them". It can pull complex build-time dependencies into runtime source loading, and those dependencies are not necessarily Turbopack-safe.

### 4. `FrameworkProvider` runtime failures

At one point the application failed at runtime with:

`You need to wrap your application inside FrameworkProvider`

This was not just a missing provider. The real cause was context splitting:

- `fumadocs-ui@16.0.9` still brought its own `fumadocs-core@16.0.9`
- the application also had `fumadocs-core@16.8.1`
- provider and consumer ended up using different `fumadocs-core` instances

That created a split React context boundary:

- the provider came from one core instance
- the consumer came from another core instance

This is a strong signal that upgrading `core` while keeping old `ui` is not a supported compatibility path in practice.

### 5. Unifying `fumadocs-core` then exposed an older UI API dependency

To remove the context split, one attempt was to force `fumadocs-ui@16.0.9` to resolve to the same `fumadocs-core@16.8.1` instance.

That reduced the multi-instance problem, but immediately revealed a harder compatibility break:

- old `fumadocs-ui@16.0.9` still imports `createContext` from `fumadocs-core/framework`
- `fumadocs-core@16.8.1` no longer exports that API

This caused errors like:

- `Export createContext doesn't exist in target module`

At that point the conclusion became clear:

**`fumadocs-ui@16.0.9` and `fumadocs-core@16.8.1` are not a real compatibility pair.**

So while `local-md` appears to replace only the source layer, in practice it assumes that the host project has already moved far enough into the newer Fumadocs API surface.

## Core architectural issue

The main problem is not the amount of code changes. The problem is the migration assumption embedded in the design.

### The assumption implied by the documentation

The documentation implicitly assumes that the user is already in, or close to, the newer Fumadocs generation:

- upgraded `fumadocs-core`
- upgraded `fumadocs-ui`
- matching framework/context APIs
- matching page tree contracts

That may be true for greenfield projects or for projects that upgrade the whole stack together.

It is not true for many real-world codebases with existing customizations.

### What many existing projects actually need

In a mature codebase, the realistic expectation is often:

- keep the existing UI layer and existing Fumadocs UI customizations
- replace only the content source implementation
- avoid a framework-wide dependency migration

That means the desired migration path is:

- source-layer replacement
- minimal UI/runtime impact
- no forced coupling to a newer internal package generation

### What happened instead

In practice:

- `local-md` forces a newer `fumadocs-core`
- its outputs are not shape-compatible with old `fumadocs-ui`
- once old UI is preserved, framework/context/API incompatibilities start surfacing

So for an existing project, this is not a narrow source migration. It is a cross-package upgrade with hidden runtime assumptions.

## Conclusion

### Conclusion 1: this is not a lightweight source migration

The visible goal was:

- migrate from `fumadocs-mdx` to `local-md`

But the actual impact area included:

- `fumadocs-core`
- `fumadocs-ui`
- framework context APIs
- `pageTree` structure
- `docgen` / `oxc-transform`
- Next.js / Turbopack bundling behavior

That means `local-md` is not just a source implementation swap. In older projects it behaves more like an entry point into a newer coordinated Fumadocs dependency stack.

### Conclusion 2: `local-md` does not cleanly isolate source-layer responsibilities

From a design perspective, `local-md` should have remained primarily responsible for:

- file discovery
- frontmatter parsing
- markdown / mdx processing
- emitting source data

Instead, through its peer dependency requirements and output contracts, it is coupled to the newer `fumadocs-core` generation in a way that leaks into UI and runtime layers.

That makes it hard to treat as an independent local content adapter.

### Conclusion 3: for projects heavily customized on top of `fumadocs-ui@16.0.9`, this migration path is high-risk

If a project already contains:

- custom `DocsLayout` usage
- custom home/header layouts
- custom TOC/page-generation wrappers
- significant internal wrapping around older `fumadocs-ui`

then adopting `local-md` without upgrading the entire Fumadocs stack is likely to be unstable.

In such a codebase, a source migration can easily turn into:

- type incompatibilities
- bundler failures
- context/runtime failures
- internal API breakages

At that point the migration stops being "lightweight" in any meaningful engineering sense.

## Direct criticism of the current `local-md` design

The main criticism is straightforward:

> A local Markdown source adapter should not implicitly require the host project to already be aligned with a newer generation of `fumadocs-core`, and it should definitely not rely on the host also being effectively compatible with a newer `fumadocs-ui` contract.

Because from a responsibility boundary perspective, `local-md` should only need to:

- read files
- parse frontmatter
- compile markdown / mdx
- emit source data

It should not effectively force:

- a specific newer core generation
- indirect UI compatibility assumptions
- framework-context compatibility
- bundler/runtime side effects far beyond the source layer

If `local-md` is intended to be a lightweight source solution, it should either:

- significantly reduce its coupling to internal Fumadocs runtime packages
- or explicitly provide a compatibility path for older `fumadocs-core` / `fumadocs-ui` projects

Without that, it is not really a lightweight migration tool. It is simply the recommended source path for projects already aligned with the newer Fumadocs stack.

## Practical conclusion for this project

For a codebase like this one, which still relies on `fumadocs-ui@16.0.9` and contains substantial custom wrapping around the existing Fumadocs UI layer, the current recommendation is:

- **do not continue the `local-md` migration on top of the current dependency baseline**
- either keep the legacy `fumadocs-mdx` approach
- or revisit `local-md` only after a full, coordinated Fumadocs stack upgrade

At the moment, the migration cost and compatibility risk clearly outweigh the advertised "lightweight" benefit.
