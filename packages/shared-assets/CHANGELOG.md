# @windrun-huaiin/shared-assets

## 11.0.1

### Patch Changes

- security(dependcy): CNVD-2025-29923 about NextJS Remote2Shell issue fixed

## 11.0.0

### Major Changes

- fix(backend): core service logic sink into common package
  - path use alias for simple

## 10.1.0

### Minor Changes

- fix(package): build and webpack, DO NOT USE package name IMPORT from the same project!

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

## 4.2.1

### Patch Changes

- fix(fingerprint): init components, add showcase link

## 4.2.0

### Minor Changes

- chore(build): use rollup to build pkg!

## 4.1.4

### Patch Changes

- test(package): just update version

## 4.1.3

### Patch Changes

- fix(icon): add icon

## 4.1.2

### Patch Changes

- README update

## 4.1.1

### Patch Changes

- Server components and Client components are separated!
  - The key point is IMPORT, once you import a client component, then you're client too!

## 4.1.0

### Minor Changes

- Fix tsup config, pack dist should be CAREFUL!

## 4.0.0

### Major Changes

-

## 3.3.0

### Minor Changes

- Repair bundle build config for reason: DO NOT PACK REACT!

## 3.2.3

### Patch Changes

- Clean packages and republish

## 3.2.2

### Patch Changes

- Align the version of some packages to 3.2.2
  - Try to release new version to npm repo

## 3.1.0

### Minor Changes

- Align the version of all packages to 3.1.0
  - Release version 3.1.0

## 1.4.0

### Minor Changes

- Finish the build process for all packages.

  - The build process for all packages is now complete.
  - Turbo build:prod is now complete.
  - Environment variables are now correctly passed to the build process.
  - README.md is now updated.

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
