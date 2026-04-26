# @windrun-huaiin/backend-core

## 27.0.0

### Major Changes

- refactor(mdx): support local-md and build-md, build-md is first on production env
  - optimize pack size and function size, which pack `prisma` in no need page 'cause barral import
  - refactor components export path, for solving barral issues
  - fix money price card issues

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@27.0.0
  - @windrun-huaiin/contracts@27.0.0
  - @windrun-huaiin/third-ui@27.0.0

## 26.0.2

### Patch Changes

- fix(package): changeset cli bug fix

## 26.0.1

### Patch Changes

- fix(mdx): uniform major version
  - fix 404page style

## 26.0.0

### Major Changes

- fix(mdx): uniform major version
  - fix 404page style

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@26.0.0
  - @windrun-huaiin/contracts@26.0.0
  - @windrun-huaiin/third-ui@26.0.0

## 26.0.0

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@25.0.0
  - @windrun-huaiin/contracts@25.0.0
  - @windrun-huaiin/third-ui@25.0.0

## 25.0.1

### Patch Changes

- fix(mdx): uniform major version

## 25.0.0

### Patch Changes

- fix(mdx): uniform major version
- Updated dependencies
  - @windrun-huaiin/lib@24.0.0
  - @windrun-huaiin/contracts@24.0.0
  - @windrun-huaiin/third-ui@24.0.0

## 24.0.0

### Minor Changes

- fix(mdx): support cut packages by adjust mdx config

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@23.1.0
  - @windrun-huaiin/contracts@23.1.0
  - @windrun-huaiin/third-ui@23.1.0

## 23.0.0

### Major Changes

- refactor(mdx): support cut packages by adjust mdx config

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@23.0.0
  - @windrun-huaiin/contracts@23.0.0
  - @windrun-huaiin/third-ui@23.0.0

## 22.0.0

### Major Changes

- refactor(mdx): sink fuma-docs into local-md and third-ui, apps now are no need to dependency fumadocs
  - fix schema init sql for safety RABC
  - remove fumadocs-mdx, fumadocs-docgen, fumadocs-typescripts
  - upgrade fumadocs-core and fumadocs-ui into 16.8.2
  - build a longtime contracts for fumadocs' late version update
  - optimize layout for easy use

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@22.0.0
  - @windrun-huaiin/contracts@22.0.0
  - @windrun-huaiin/third-ui@22.0.0

## 21.0.0

### Major Changes

- feat(mdx): local-md with light runtime build
  - patch for fumadocs `16.0.9` as fixed
  - icons bugfix
  - local-md adapt source

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@21.0.0
  - @windrun-huaiin/contracts@21.0.0
  - @windrun-huaiin/third-ui@21.0.0

## 20.2.0

### Minor Changes

- feat(stripe): upgrade stripe version from 20.0.0 to 22.0.2
  - fix version chore updates
  - remove rare envs

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@20.1.0
  - @windrun-huaiin/lib@20.0.0
  - @windrun-huaiin/contracts@20.0.0

## 20.1.0

### Minor Changes

- fix(upstash): redis key prefix issue fix, qstash config fix

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@20.0.0
  - @windrun-huaiin/lib@20.0.0
  - @windrun-huaiin/contracts@20.0.0

## 20.0.1

### Patch Changes

- feat(upstash): expend redis, qstash
- Updated dependencies
  - @windrun-huaiin/third-ui@20.0.0
  - @windrun-huaiin/lib@20.0.0
  - @windrun-huaiin/contracts@20.0.0

## 20.0.0

### Major Changes

- docs(packages): uniform major version

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@20.0.0
  - @windrun-huaiin/lib@20.0.0
  - @windrun-huaiin/contracts@20.0.0

## 17.0.0

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@16.0.1
  - @windrun-huaiin/lib@16.0.0
  - @windrun-huaiin/contracts@16.0.0

## 16.0.0

### Major Changes

- feat(ai): support ai-chat
  - refactor icon's usage
  - enhance Redis, QStash
  - optimize page menu

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@16.0.0
  - @windrun-huaiin/lib@16.0.0

## 15.1.0

### Minor Changes

- fix(build): fix rollup pack issus

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@15.1.0
  - @windrun-huaiin/lib@15.1.0

## 15.0.0

### Major Changes

- feat(upgrade): many useful tricks now lanch
  - `windrun-huaiin/dev-scripts` check messages issue, powerful
  - `windrun-huaiin/backend-core` fix satefy issues
  - `windrun-huaiin/base-ui` fix styles
  - `windrun-huaiin/third-ui` support a serias `Button` components

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@15.0.0
  - @windrun-huaiin/lib@15.0.0

## 14.6.0

### Minor Changes

- fix(prisma): `windrun-huaiin/backend-core` should't export `prisma/clien` 'cause it make things bad

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@14.5.0
  - @windrun-huaiin/lib@14.0.1

## 14.5.0

### Minor Changes

- fix(auth): refactor authentication middleware and utilities for protected routes
  - This version contains `break updates`, such as `ApiAuthUtils`'s import path
  - And serious auth issue in old middleware handler, force command to upgrade
  - Remove `optional-auth` of clerk patch, just use `ApiAuthUtils`, `layout.config` is the one shoud be updated

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@14.5.0
  - @windrun-huaiin/lib@14.0.1

## 14.4.0

### Minor Changes

- fix(auth): refactor authentication middleware and utilities for protected routes
  - This version contains `break updates`, such as `ApiAuthUtils`'s import path
  - And serious auth issue in old middleware handler, force command to upgrade

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@14.4.3
  - @windrun-huaiin/lib@14.0.1

## 14.3.0

### Minor Changes

- feat(dependency): update dependencies
  - optimize: `diaomao-update` cli command
  - security: user mock or test now fully split with real code
  - fix: fingerprint panel test now won't override origin fpId, with new local storage

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@14.2.0
  - @windrun-huaiin/lib@14.0.1

## 14.2.0

### Minor Changes

- fix(user): fixed repeated anonymous init user both in frontend and backend
  - frontend useRef for Prevention
  - backend use pg transaction tx for Idempotency
  - `FingerprintStatus` component now support user concurrent test

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@14.1.0
  - @windrun-huaiin/lib@14.0.0

## 14.1.1

### Patch Changes

- fix(user): user first source ref issue fixed
  - Support img loading delay test by env switch `DelayedImg`
- Updated dependencies
  - @windrun-huaiin/third-ui@14.0.2
  - @windrun-huaiin/lib@14.0.0

## 14.1.0

### Minor Changes

- fix(stripe): upgrade clerk dependency

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@14.0.0
  - @windrun-huaiin/lib@14.0.0

## 14.0.0

### Major Changes

- feat(clerk): upgrade clerk dependency

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@14.0.0
  - @windrun-huaiin/lib@14.0.0

## 13.0.0

### Major Changes

- feat(upgrade): update dependencies packages and uniform version to v13.x

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@13.0.0
  - @windrun-huaiin/lib@13.0.0

## 12.0.0

### Major Changes

- feature(locale): support as-needed localPrefix by `NEXT_PUBLIC_I18N_LOCALE_PREFIX_AS_NEEDED`

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@12.0.0
  - @windrun-huaiin/lib@12.0.0

## 11.0.3

### Patch Changes

- fix(stripe): update stripe API version to **2025-11-17.clover** in dependency package **stripe: 20.0.0**
- Updated dependencies
  - @windrun-huaiin/third-ui@11.0.2
  - @windrun-huaiin/lib@11.0.1

## 11.0.2

### Patch Changes

- security(dependcy): CNVD-2025-29923 about NextJS Remote2Shell issue fixed
- Updated dependencies
  - @windrun-huaiin/third-ui@11.0.1
  - @windrun-huaiin/lib@11.0.1

## 11.0.1

### Patch Changes

- fix(migrations): update migration commands to support schema name and remove obsolete SQL files
- Updated dependencies
  - @windrun-huaiin/third-ui@11.0.0
  - @windrun-huaiin/lib@11.0.0

## 11.0.0

### Major Changes

- fix(backend): core service logic sink into common package
  - path use alias for simple

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@11.0.0
  - @windrun-huaiin/lib@11.0.0

## 10.0.1

### Patch Changes

- feat(backend): core service logic sink into common package
- Updated dependencies
  - @windrun-huaiin/third-ui@10.1.3
  - @windrun-huaiin/lib@10.1.0

## 10.0.0

### Major Changes

- feat(backend): core service logic sink into common package

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/third-ui@10.1.3
  - @windrun-huaiin/lib@10.1.0
