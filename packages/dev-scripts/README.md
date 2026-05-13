# @windrun-huaiin/dev-scripts

Development scripts for multilingual Next.js and MDX-based projects. The package provides a unified CLI for translation validation, blog index generation, workspace cleanup, dependency synchronization, and `@windrun-huaiin/backend-core` integration.

## Core Features

### Translation Validation

`check-translations` validates i18n message files against the translation keys used in source code.

It can:

- Detect missing namespaces and keys used by the application but absent from locale messages.
- Detect unused namespaces and keys that exist in messages but are no longer referenced.
- Compare locales and report inconsistent keys between languages.
- Support both single-file and multi-file message setups.
- Merge all matching message files for the same locale before validation.
- Scan application source files and, when enabled, related local `@windrun-huaiin/*` workspace packages.
- Support exact key whitelists and namespace-level whitelists for known static-analysis edge cases.

The checker is designed for real multilingual projects where messages may be split by feature, page, or package.

### Blog Index Generation

`generate-blog-index` scans MDX blog posts and generates derived blog metadata.

It can:

- Read blog MDX files.
- Parse frontmatter metadata.
- Generate the main blog index page.
- Generate monthly archive or statistics content.
- Sort and group posts automatically.

This is useful for content-heavy projects where blog listing pages should be generated from source MDX files instead of maintained manually.

### Backend Core Integration

`backend-core` provides helper commands for projects using `@windrun-huaiin/backend-core`.

It can:

- List available backend route handlers.
- Generate Next.js route wrapper files under the application route directory.
- Merge package-provided Prisma models into the host Prisma schema.
- Sync package-provided SQL migration files into the host project.

These commands help applications consume shared backend functionality while keeping app-level route files and Prisma assets explicit.

### Workspace Cleanup

`deep-clean` removes dependency folders, build outputs, cache directories, and lock files.

It automatically adapts to:

- Monorepo projects with `pnpm-workspace.yaml`.
- Single-package projects without a workspace file.

By default, it runs in preview mode. Add `--yes` to perform deletion.

### Dependency Synchronization

`diaomao-update` synchronizes an allowlisted set of dependency versions for Diaomao-related projects.

In workspace catalog setups, it updates the catalog versions found in the nearest `pnpm-workspace.yaml` instead of blindly rewriting every workspace package.

### Configuration-Driven CLI

The CLI can be configured from either:

- the `devScripts` field in `package.json`
- a `dev-scripts.config.json` file

This makes it suitable for different repository layouts without hardcoding project structure into the commands.

## Quick Start

Install the package as a development dependency:

```bash
pnpm add -D @windrun-huaiin/dev-scripts
```

Add project scripts:

```json
{
  "scripts": {
    "check-translations": "dev-scripts check-translations",
    "generate-blog-index": "dev-scripts generate-blog-index",
    "deep-clean": "dev-scripts deep-clean"
  }
}
```

Run commands:

```bash
pnpm check-translations
pnpm generate-blog-index
pnpm deep-clean
```

## Configuration

### package.json

Use `devScripts` for compact project-level configuration:

```json
{
  "devScripts": {
    "locales": ["en", "zh"],
    "defaultLocale": "en",
    "messageRoot": "messages",
    "messageGlobs": [
      "messages/{locale}.json",
      "messages/biz/*.{locale}.json"
    ],
    "scan": {
      "include": ["src/**/*.{tsx,ts,jsx,js}"],
      "exclude": [
        "src/**/*.d.ts",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "node_modules/**"
      ],
      "includeWindrunPackages": false,
      "whitelist": [],
      "namespaceWhitelist": []
    },
    "blogDir": "src/mdx/blog",
    "logDir": "logs",
    "architectureExclude": ["coverage", ".env.local", "*.local"]
  },
  "architectureConfig": {
    ".": "RootProject"
  }
}
```

### dev-scripts.config.json

Use a standalone config file when the project needs a more structured setup:

```json
{
  "i18n": {
    "locales": ["en", "zh"],
    "defaultLocale": "en",
    "messageRoot": "messages",
    "messageGlobs": [
      "messages/{locale}.json",
      "messages/biz/*.{locale}.json"
    ]
  },
  "scan": {
    "include": ["src/**/*.{tsx,ts,jsx,js}"],
    "exclude": [
      "src/**/*.d.ts",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "node_modules/**"
    ],
    "includeWindrunPackages": false,
    "whitelist": [],
    "namespaceWhitelist": []
  },
  "blog": {
    "mdxDir": "src/mdx/blog",
    "outputFile": "index.mdx",
    "metaFile": "meta.json",
    "iocSlug": "ioc",
    "prefix": "blog"
  },
  "output": {
    "logDir": "logs",
    "verbose": false
  },
  "architectureExclude": ["coverage", ".env.local", "*.local"]
}
```

Pass a custom config file with `--config`:

```bash
dev-scripts check-translations --config dev-scripts.config.json
```

## Commands

### check-translations

Validate missing, unused, and inconsistent translation keys.

```bash
dev-scripts check-translations [options]
```

Options:

- `-v, --verbose`: print detailed logs
- `--config <path>`: use a custom config file
- `-h, --help`: show help

Validation model:

- Missing translation: a key is used in code but does not exist in the merged message set.
- Unused translation: a key exists in messages but is not used by scanned code.
- Locale mismatch: a locale has extra or missing keys compared with other locales.

Supported usage patterns include `useTranslations`, `getTranslations`, `FormattedMessage`, template-string keys, and variable keys where they can be resolved safely by static analysis.

### Translation Whitelists

Static analysis can produce intentional findings for dynamic or externally resolved keys. Use whitelists to suppress confirmed cases.

`whitelist` is for exact keys:

```json
{
  "scan": {
    "whitelist": ["credit.subscription.active"]
  }
}
```

`namespaceWhitelist` suppresses a namespace and all of its children:

```json
{
  "scan": {
    "namespaceWhitelist": ["faq", "footer", "clerk"]
  }
}
```

Exact whitelists are not fuzzy matches. If `faq.a` and `faq.b` should both be ignored, both keys must be listed unless the entire `faq` namespace is intentionally ignored through `namespaceWhitelist`.

### Monorepo Package Scanning

Enable `includeWindrunPackages` when application messages are consumed by local workspace packages.

```json
{
  "scan": {
    "include": ["src/**/*.{tsx,ts,jsx,js}"],
    "includeWindrunPackages": true
  }
}
```

When enabled, the scanner:

- Scans files matched by the application `scan.include` rules.
- Detects related `@windrun-huaiin/*` imports.
- Scans the corresponding local package source directories when available.
- Resolves local aliases mapped to workspace package sources through `tsconfig.json`.
- Prefers local workspace packages over duplicate package sources from `node_modules`.

This allows shared package translation usage to be included in the final validation result.

### generate-blog-index

Generate blog index files and monthly metadata from MDX posts.

```bash
dev-scripts generate-blog-index [options]
```

Options:

- `-v, --verbose`: print detailed logs
- `--config <path>`: use a custom config file
- `-h, --help`: show help

Expected blog structure:

```text
src/mdx/blog/
├── index.mdx
├── ioc.mdx
├── meta.json
├── 2024-01-01.mdx
└── 2024-01-15.mdx
```

Expected post frontmatter:

```md
---
title: "Post title"
description: "Post description"
icon: "BookOpen"
date: "2024-01-01"
---
```

### deep-clean

Preview or remove common dependency and build artifacts.

```bash
dev-scripts deep-clean [options]
```

Options:

- `--yes`: delete matched files and directories
- `-v, --verbose`: print detailed logs
- `--config <path>`: use a custom config file
- `-h, --help`: show help

Without `--yes`, the command only prints what would be removed.

In a monorepo, it targets common root, `packages/*`, and `apps/*` artifacts such as:

- `node_modules`
- `.next`
- `dist`
- `.turbo`
- `pnpm-lock.yaml`

In a single-package project, it targets local dependency and build artifacts only.

### diaomao-update

Synchronize allowlisted dependency versions for Diaomao-related projects.

```bash
dev-scripts diaomao-update [options]
```

Options:

- `-v, --verbose`: print detailed logs
- `-h, --help`: show help

For workspace catalog dependencies, the command updates catalog versions in the nearest `pnpm-workspace.yaml`.

### backend-core

Integrate shared backend assets from `@windrun-huaiin/backend-core`.

```bash
dev-scripts backend-core routes:list
dev-scripts backend-core routes:sync --app-dir src/app --force
dev-scripts backend-core prisma:sync --schema prisma/schema.prisma
dev-scripts backend-core migrations:sync --dest prisma --force
```

Available tasks:

- `routes:list`: list available backend route handlers.
- `routes:sync`: generate proxy route files under the application route directory.
- `prisma:sync`: append package models to the host Prisma schema and adapt schema names to the host datasource.
- `migrations:sync`: copy package SQL migrations into the host project.

## Translation File Structure

A typical message directory:

```text
messages/
├── en.json
├── zh.json
└── ja.json
```

Example message file:

```json
{
  "common": {
    "welcome": "Welcome",
    "goodbye": "Goodbye"
  },
  "dashboard": {
    "title": "Dashboard",
    "analytics": {
      "title": "Analytics",
      "views": "Views"
    }
  }
}
```

## CI Usage

Run translation checks in CI to prevent missing or inconsistent keys from reaching production:

```yaml
name: Check Translations

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm install
      - run: pnpm check-translations
```

## Debugging

Use `--verbose` to print detailed scanner and validation output:

```bash
dev-scripts check-translations --verbose
```

Verbose output includes scanned files, detected translation function bindings, extracted keys, and detailed validation steps.

## Safety Notes

Most commands are intended for local development and CI checks. Commands that modify files or remove artifacts should be reviewed before use in automated workflows.

`deep-clean` is destructive only when `--yes` is provided. `diaomao-update` and scaffold/update commands may modify dependency files and should be run only in trusted projects.

## License

MIT
