# @windrun-huaiin/base-ui

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

## 21.0.0

### Major Changes

- feat(mdx): local-md with light runtime build
  - patch for fumadocs `16.0.9` as fixed
  - icons bugfix
  - local-md adapt source

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@21.0.0

## 20.1.0

### Minor Changes

- feat(dialog): add useful alter-dialog
  - fingerpring status componnets supports i18n

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@20.0.0

## 20.0.0

### Major Changes

- docs(packages): uniform major version

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@20.0.0

## 16.0.0

### Major Changes

- feat(ai): support ai-chat
  - refactor icon's usage
  - enhance Redis, QStash
  - optimize page menu

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@16.0.0

## 15.1.1

### Patch Changes

- feat(i18n): support custome `biz` path
- Updated dependencies
  - @windrun-huaiin/lib@15.1.1

## 15.1.0

### Minor Changes

- fix(build): fix rollup pack issus

### Patch Changes

- Updated dependencies
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
  - @windrun-huaiin/lib@15.0.0

## 14.0.3

### Patch Changes

- feat(dependency): update dependencies
  - optimize: `diaomao-update` cli command
  - security: user mock or test now fully split with real code
  - fix: fingerprint panel test now won't override origin fpId, with new local storage
- Updated dependencies
  - @windrun-huaiin/lib@14.0.1

## 14.0.2

### Patch Changes

- feat(cli): support newline in translation message by richtext
- Updated dependencies
  - @windrun-huaiin/lib@14.0.0

## 14.0.1

### Patch Changes

- fix(theme): 404page and base icon style fixed for theme color adapt
- Updated dependencies
  - @windrun-huaiin/lib@14.0.0

## 14.0.0

### Major Changes

- feat(clerk): upgrade clerk dependency

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@14.0.0

## 13.1.0

### Minor Changes

- feat(theme): support 5 colors by env config
  - purple, orange, indigo, emerald, rose by `NEXT_PUBLIC_STYLE_ICON_COLOR`
  - remove `NEXT_PUBLIC_STYLE_SVG_ICON_COLOR` cause unuseful

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@13.0.0

## 13.0.0

### Major Changes

- feat(upgrade): update dependencies packages and uniform version to v13.x

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@13.0.0

## 12.0.0

### Major Changes

- feature(locale): support as-needed localPrefix by `NEXT_PUBLIC_I18N_LOCALE_PREFIX_AS_NEEDED`

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@12.0.0

## 11.0.1

### Patch Changes

- security(dependcy): CNVD-2025-29923 about NextJS Remote2Shell issue fixed
- Updated dependencies
  - @windrun-huaiin/lib@11.0.1

## 11.0.0

### Major Changes

- fix(backend): core service logic sink into common package
  - path use alias for simple

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@11.0.0

## 10.1.0

### Minor Changes

- fix(package): build and webpack, DO NOT USE package name IMPORT from the same project!

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@10.1.0

## 10.0.0

### Major Changes

- refactor(upgrade): Fumadocs dependencies upgrade to 16.0.9

  ### Also make patchs

  - `patches/fumadocs-core@16.0.9.patch`, **toc.ts** for TOC componnet config null issue fixed
  - `patches/fumadocs-ui@16.0.9.patch`, **toc-clerk.ts** for clerk's style of TOC, just custom css

  ### Key Version

  - nextjs `16.0.0`
  - next-intl `^4.4.0`
  - react `19.2.0`
  - rollup `4.46.2`
  - turbo `^2.6.0`
  - typescript `^5.8.3`
  - zod `^4.1.12`
  - fumadocs-core `16.0.9`
  - fumadocs-docgen `3.0.4`
  - fumadocs-mdx `13.0.6`
  - fumadocs-typescript `4.0.13`
  - fumadocs-ui `16.0.9`

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@10.0.0

## 8.1.2

### Patch Changes

- fix(fingerprint): init components, add showcase link
- Updated dependencies
  - @windrun-huaiin/lib@7.1.2

## 8.1.1

### Patch Changes

- feat(mdx): mermaid now support download SVG!
- Updated dependencies
  - @windrun-huaiin/lib@7.1.1

## 8.1.0

### Minor Changes

- chore(build): use rollup to build pkg!

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@7.1.0

## 8.0.0

### Major Changes

- chore(build): Common components package now only use Source Code, not dist files!

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@7.0.0

## 7.2.0

### Minor Changes

- fix(build): RSC and RCC build issue! tsup config splitting should be TRUE

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@6.2.1

## 7.1.1

### Patch Changes

- fix(build): RSC and RCC build issue!
- Updated dependencies
  - @windrun-huaiin/lib@6.2.1

## 7.1.0

### Minor Changes

- fix(build): add plugin to preserve 'use client' and 'use server' directives

  - Implemented a new esbuild plugin to ensure 'use client' and 'use server' directives are preserved at the top of TypeScript/JavaScript files.
  - Updated configuration for both base-ui and third-ui packages.
  - Added error handling for file processing.

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@6.2.1

## 7.0.0

### Major Changes

- chore(refactor): components are split into server and client, for better performance and SEO

  - Clerk, change the import path to `@windrun-huaiin/third-ui/clerk/server`
  - Fuma, change the import path to `@windrun-huaiin/third-ui/fuma/server`
  - Main, change the import path to `@windrun-huaiin/third-ui/main/server`
  - Base UI, change the import path to `@windrun-huaiin/base-ui/components/server`
  - and layout、page, change function to async function, and add locale parameter

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@6.2.1

## 6.0.3

### Patch Changes

- test(package): just update version
- Updated dependencies
  - @windrun-huaiin/lib@6.2.1

## 6.0.2

### Patch Changes

- feat(icon): add music4 icon
- Updated dependencies
  - @windrun-huaiin/lib@6.2.0

## 6.0.1

### Patch Changes

- feat(clerk): clerk now can show signup button optional in fuma header
  feat(icon): defalt icon change to Sparkles
- Updated dependencies
  - @windrun-huaiin/lib@6.1.0

## 6.0.0

### Major Changes

- refactor(icon): icon now only exists in @windrun-huaiin/buse-ui, and just control dependenly!

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@6.1.0

## 5.3.4

### Patch Changes

- feat(button): XButton support click-button and click-bitton groups
- Updated dependencies
  - @windrun-huaiin/lib@5.7.2

## 5.3.3

### Patch Changes

- feat(icon): add new icons
- Updated dependencies
  - @windrun-huaiin/lib@5.7.1

## 5.3.2

### Patch Changes

- rollback(dev-scripts): give up support monorepo for nextjs reason
  fix(build): tsup config fix
- Updated dependencies
  - @windrun-huaiin/lib@5.7.0

## 5.3.1

### Patch Changes

- fix(icon): add icon
- Updated dependencies
  - @windrun-huaiin/lib@5.4.0

## 5.3.0

### Minor Changes

- feat(main): add price UI
  fix(main): goToTop UI fix
  fix(fuma): menu bar style fix
  feat(icon): add lucide FAQ icon

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@5.3.0

## 5.2.0

### Minor Changes

- feat(base-ui): add useful icon
  feat(third-ui): add useful fuma mdx component, siteX for email and site title
  feat(ddaas): update mdx

  closed #TP00-108

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@5.2.0

## 5.1.2

### Patch Changes

- README update
- Updated dependencies
  - @windrun-huaiin/lib@5.1.2

## 5.1.1

### Patch Changes

- Server components and Client components are separated!
  - The key point is IMPORT, once you import a client component, then you're client too!
- Updated dependencies
  - @windrun-huaiin/lib@5.1.1

## 5.1.0

### Minor Changes

- Fix tsup config, pack dist should be CAREFUL!

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@5.1.0

## 5.0.0

### Major Changes

-

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@5.0.0

## 4.1.1

### Patch Changes

- fix: export components should be CAREFUL!
- Updated dependencies
  - @windrun-huaiin/lib@4.0.0

## 4.1.0

### Minor Changes

-

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@4.0.0

## 4.0.0

### Major Changes

- React version shoud be fixed at 「19.2.0-canary-3fbfb9ba-20250409」, WTF!

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@4.0.0

## 3.7.0

### Minor Changes

- React version shoud be fixed at 19.1.0
  - Next version shoud be fixed at 15.3.2

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@3.4.0

## 3.6.0

### Minor Changes

- Repair bundle build config for reason: DO NOT PACK REACT!

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@3.4.0

## 3.5.1

### Patch Changes

- Clean packages and republish
- Updated dependencies
  - @windrun-huaiin/lib@3.3.1

## 3.5.0

### Minor Changes

- Hotfix: remove peer dependencies from base-ui and lib, for reason like: DO NOT CREATE REPEAT REACT INSTANCES!

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@3.3.0

## 3.4.0

### Minor Changes

- refactor(clean): DELETE unuse!

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@3.2.2

## 3.3.0

### Minor Changes

- Server components and client components separation

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@3.2.2

## 3.2.4

### Patch Changes

- Align the version of some packages to 3.2.2
  - Try to release new version to npm repo
- Updated dependencies
  - @windrun-huaiin/lib@3.2.2

## 3.1.0

### Minor Changes

- Align the version of all packages to 3.1.0
  - Release version 3.1.0

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@3.1.0

## 1.4.0

### Minor Changes

- Finish the build process for all packages.

  - The build process for all packages is now complete.
  - Turbo build:prod is now complete.
  - Environment variables are now correctly passed to the build process.
  - README.md is now updated.

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@1.4.0

## 1.3.0

### Minor Changes

- Major icon system refactor and shared assets infrastructure

  ## 🚀 New Features

  ### 📦 Shared Assets Package

  - Introduce `@windrun-huaiin/shared-assets` package for centralized cross-application static resource management
  - Integrate Turborepo task orchestration with intelligent caching for resource copying workflows
  - Provide TypeScript type-safe path configuration and utilities
  - Support development watch mode and production build-time asset copying

  ### 🎨 Icon System Architecture Overhaul

  - Refactor icon component architecture by eliminating redundant size parameters
  - Enhance `globalIcon` intelligent wrapper for unified size and color management
  - Resolve CSS priority conflicts to ensure proper external style inheritance
  - Strengthen type safety with comprehensive icon component type inference

  ## 🔧 Improvements

  ### Base UI (@windrun-huaiin/base-ui)

  - Restructure all custom SVG icon components with simplified parameter interfaces
  - Fix viewBox and fill attribute issues in Java, SQL, CSV, and other icon components
  - Optimize `global-icon.tsx` type definitions and intelligent processing logic
  - Enhance CSS class handling capabilities for icon components

  ### Third UI (@windrun-huaiin/third-ui)

  - Update `FumaGithubInfo` component to resolve icon sizing inconsistencies
  - Improve error handling with graceful network failure fallback mechanisms
  - Standardize icon usage patterns for consistent styling across components

  ### Library (@windrun-huaiin/lib)

  - Provide curated Lucide icon set to optimize bundle size
  - Enhance common utility functions and configuration management

  ### Dev Scripts (@windrun-huaiin/dev-scripts)

  - Support multilingual project development workflows
  - Provide blog index generation and translation validation tools

  ### DDAAS Website (@windrun-huaiin/ddaas-website)

  - Integrate new shared resource management system
  - Modernize icon usage patterns with unified `icons.*` API calls
  - Optimize build pipeline with Turborepo task dependency management

  ## 🐛 Bug Fixes

  - Resolve icon display issues across different theme configurations
  - Fix CSS class priority conflicts causing incorrect icon dimensions
  - Correct SVG viewBox mismatches resulting in icon distortion
  - Address confusion between `themeSvgIconColor` and `themeIconColor` usage

  ## 💥 Breaking Changes

  - Icon components no longer accept `size` parameter; managed centrally by `globalIcon`
  - Default icon dimensions may be adjusted; please verify UI display
  - Shared resource file path structure changes require reference updates

  ## 🧪 Technical Improvements

  - Implement inline style precedence to override external CSS constraints
  - Enhance wrapper component type safety with proper generic constraints
  - Optimize build performance through intelligent asset copying strategies
  - Standardize icon component interfaces across the entire system

  ## 📚 Documentation

  - Comprehensive usage documentation for shared-assets package
  - Updated icon system best practices and implementation guidelines
  - Turborepo integration configuration and deployment instructions

  ***

  This major architectural enhancement improves developer experience and project maintainability. We recommend thorough testing of icon display and shared resource loading before production deployment.

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@1.3.0

## 1.2.0

### Minor Changes

- feat: upgrade all packages to version 1.2.0

  - Align project base version

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@1.0.0

## 1.1.0

### Minor Changes

- feat: upgrade all packages to version 1.2.0

  - Refactor ddaas from single-project to monorepo
  - Extract useful UI、Config、util、Script

### Patch Changes

- Updated dependencies
  - @windrun-huaiin/lib@0.2.0
