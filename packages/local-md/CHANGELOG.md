# @windrun-huaiin/fumadocs-local-md

## 28.0.0

### Major Changes

- refactor(pack): optimize page route and api route pack size
  - fix barral import
  - split componts
  - prisma change to build as package
  - db model will be free as needed

## 27.0.0

### Major Changes

- refactor(mdx): support local-md and build-md, build-md is first on production env
  - optimize pack size and function size, which pack `prisma` in no need page 'cause barral import
  - refactor components export path, for solving barral issues
  - fix money price card issues

## 26.0.2

### Patch Changes

- feat(package): local-md add log

## 26.0.1

### Patch Changes

- feat(package): local-md add log

## 26.0.0

### Major Changes

- fix(mdx): uniform major version
  - fix 404page style

## 25.0.0

### Major Changes

- fix(mdx): uniform major version
  - fix 404page style

## 24.0.0

### Major Changes

- fix(mdx): uniform major version

## 23.2.0

### Minor Changes

- fix(mdx): local-md fix source build action, which can cause OOM
  - support `portable-clerk`, `fumadocs-clerk`, `fumadocs-normal` 3 styles of TOC

## 23.1.0

### Minor Changes

- fix(mdx): support cut packages by adjust mdx config

## 23.0.0

### Major Changes

- refactor(mdx): support cut packages by adjust mdx config

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
  - @windrun-huaiin/contracts@22.0.0

## 21.0.0

### Major Changes

- feat(mdx): local-md with light runtime build
  - patch for fumadocs `16.0.9` as fixed
  - icons bugfix
  - local-md adapt source
