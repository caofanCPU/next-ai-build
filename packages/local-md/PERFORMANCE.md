# local-md Performance Notes

This document only describes the `local-md` processing path itself:

- source discovery
- frontmatter and meta parsing
- source loader creation
- single-page Markdown/MDX compilation
- runtime cache behavior

It does not describe application business logic, route-level auth, middleware, or UI rendering concerns outside `local-md`.

## Scope

`local-md` has two different kinds of work during a request:

1. Source build
2. Single-page body compile

They are not the same thing.

### 1. Source Build

Source build means:

- glob the content directory
- read `.md`, `.mdx`, and `.json`
- parse frontmatter
- parse `meta.json`
- create the Fumadocs-compatible page tree and routing metadata

This step is directory-level.

It does **not** compile every page body.

### 2. Single-Page Body Compile

Body compile means:

- the matched page calls `page.data.load(...)`
- `local-md` compiles that page's Markdown/MDX body
- the compiled result is rendered with MDX components

This step is page-level.

Visiting one page must only compile that page body, not every page in the directory.

## Current Instrumentation

When `LOCAL_MD_DEBUG=true`, `local-md` now emits timing logs for:

- `storage:getPages:parsed`
- `localMd:createSource`
- `createRuntimeSource:static-source`
- `createLocalMdSourceLoader:after-loader`
- `compiler:compile:md`
- `compiler:compile:mdx`

Applications using `createFumaPage(...)` also emit:

- `generateStaticParams`
- `page:source-ready`
- `page:get-page`
- `generateMetadata:get-page`
- `page:load`

These logs are enough to separate:

- source build cost
- page lookup cost
- current-page compile cost

## Environment Flags

### `LOCAL_MD_DEBUG`

```bash
LOCAL_MD_DEBUG=true
```

Enables detailed timing and structural logs.

### `LOCAL_MD_CACHE_DISABLE`

```bash
LOCAL_MD_CACHE_DISABLE=true
```

Disables persistent source result caching.

Use this in development when you want refresh-based realtime content changes without restarting the dev server.

Important:

- this disables source result reuse across requests
- it should not cause one request to rebuild the same source multiple times in parallel

`local-md` now keeps an in-flight dedupe even when cache is disabled, so concurrent calls in the same request share one source-building promise.

### `LOCAL_MD_CACHE_EMPTY`

```bash
LOCAL_MD_CACHE_EMPTY=true
```

Controls whether an empty source result is cached. Default behavior is to avoid caching empty results.

## What We Verified

These points were confirmed with runtime logs.

### A. `local-md` does not compile the whole directory on first page visit

Observed behavior:

- source build for `docs` completed in tens to low hundreds of milliseconds
- the actual current page emitted its own `compiler:compile:mdx`

This means:

- the directory was scanned and indexed
- only the matched page body was compiled

### B. First-hit slowness can still be real

Even when only one page body is compiled, the first request can still be slower because it combines:

- source build
- page-level MDX processor initialization
- current-page compile

For example, a simple page can still be slow if the active MDX compiler chain includes heavyweight plugins such as:

- code highlighting
- math
- npm install transforms

### C. Cache-disabled mode previously amplified request cost

Before in-flight dedupe was added, `generateStaticParams`, `generateMetadata`, and the page render path could each build the same source again in the same request when `LOCAL_MD_CACHE_DISABLE=true`.

That behavior has been fixed by keeping:

- no persistent result cache
- yes in-flight request dedupe

So the current model is:

- realtime refresh semantics remain
- same-request duplicate source builds are avoided

## How To Read A Log Chain

Use this order:

1. `storage:getPages:parsed`
2. `createLocalMdSourceLoader:after-loader`
3. `page:source-ready`
4. `page:get-page`
5. `compiler:compile:mdx` or `compiler:compile:md`
6. `page:load`

Interpretation:

- if `storage:getPages:parsed` is large, directory scan and frontmatter/meta parsing are expensive
- if `createLocalMdSourceLoader:after-loader` is much larger than `storage:getPages:parsed`, loader/page-tree generation is expensive
- if `page:get-page` is near zero, routing lookup is not the problem
- if `compiler:compile:mdx` is large, the current page's MDX processor chain is the main cost
- if `page:load` is much larger than `compiler:compile:mdx`, rendering or MDX component evaluation adds extra cost

## Example Conclusions From Real Measurements

### Case 1: Directory source build

Observed logs showed:

- `storage:getPages:parsed`: about `20ms` on one run, about `300ms` on another run
- `createLocalMdSourceLoader:after-loader`: about `30ms` to `315ms`

Meaning:

- source build exists and is directory-wide
- but this is still not full-directory body compilation

### Case 2: Simple MDX page still slow

Observed logs for a simple page showed:

- `page:get-page`: `0ms`
- `compiler:compile:mdx`: about `670ms`

Meaning:

- route lookup is cheap
- the dominant cost is current-page MDX compile, not page-tree lookup

## Practical Testing Method

Use this minimal process:

1. Start dev server with:

```bash
LOCAL_MD_DEBUG=true LOCAL_MD_CACHE_DISABLE=true pnpm dev
```

2. Visit one page for the first time.

3. Record:

- `storage:getPages:parsed`
- `createLocalMdSourceLoader:after-loader`
- `compiler:compile:mdx`
- `page:load`

4. Refresh the same page again.

5. Compare the same metrics.

Questions to answer:

- Did source build happen once or multiple times per request?
- Is the main cost source build or current-page compile?
- Is the page simple but still paying for a heavyweight compiler chain?

## Current Performance Model

Today, the effective model is:

- source build is lazy and directory-level
- body compile is lazy and page-level
- cache-enabled mode reuses source results
- cache-disabled mode rebuilds source per request, but now dedupes concurrent calls

What this model does **not** guarantee:

- that every MDX page is cheap to compile
- that simple pages avoid heavyweight feature initialization if the app wired those features into one shared compiler pipeline

## Likely Next Optimization Direction

If first-hit compile remains too slow, the next optimization should target compiler strategy, not source scanning.

The most promising direction is:

- keep one lightweight base compiler
- only activate heavyweight features for pages that actually need them

Examples:

- plain docs page: base pipeline only
- code-heavy page: base + code feature
- math page: base + math feature

That is separate from source caching and should be treated as a compiler architecture optimization.
