# @windrun-huaiin/backend-core

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
