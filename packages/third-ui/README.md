# @windrun-huaiin/third-ui

Shared React and Next.js UI integrations for product websites, documentation systems, authentication flows, pricing pages, credit displays, AI interfaces, and Fuma-based MDX rendering.

This package is organized around public subpath exports. Use the smallest entry point that matches the feature you need so that application code can keep client, server, and heavy-renderer boundaries explicit.

## Feature Areas

### Main Application UI

The main UI layer provides reusable building blocks for product-facing pages and application surfaces:

- Hero sections, gallery sections, CTA blocks, feature sections, FAQ sections, footer sections, tips, usage blocks, and SEO-oriented content blocks.
- Standard application states such as 404 pages, loading indicators, loading frames, and navigation progress feedback.
- Interaction components such as alert dialogs, buttons, pill selects, calendars, motion helpers, and animation helpers.
- Home-page and server-side helpers for composing localized, content-driven page sections.

Primary entry points:

| Entry | Purpose |
| --- | --- |
| `@windrun-huaiin/third-ui/main` | General application UI components and shared main-page building blocks |
| `@windrun-huaiin/third-ui/main/server` | Server-side helpers for main UI composition |
| `@windrun-huaiin/third-ui/main/home/server` | Server-side home-page helpers |
| `@windrun-huaiin/third-ui/main/hero` | Hero section components |
| `@windrun-huaiin/third-ui/main/alert-dialog` | Alert dialog components |
| `@windrun-huaiin/third-ui/main/buttons` | Button components |
| `@windrun-huaiin/third-ui/main/calendar` | Calendar components |
| `@windrun-huaiin/third-ui/main/pill-select` | Pill select components |
| `@windrun-huaiin/third-ui/main/loading` | Loading components |
| `@windrun-huaiin/third-ui/main/loading-frame` | Loading frame components |
| `@windrun-huaiin/third-ui/main/motion` | Motion helpers and components |
| `@windrun-huaiin/third-ui/main/anime` | Animation helpers and components |

### Pricing, Credits, and Commerce UI

The pricing and credit layer covers UI and server utilities for product plans, credit balances, money-price displays, and purchase-oriented controls.

Primary entry points:

| Entry | Purpose |
| --- | --- |
| `@windrun-huaiin/third-ui/main/money-price` | Money-price UI components, interactive pricing controls, and pricing configuration helpers |
| `@windrun-huaiin/third-ui/main/money-price/server` | Server-side money-price helpers |
| `@windrun-huaiin/third-ui/main/credit` | Credit UI components, credit types, and credit display helpers |
| `@windrun-huaiin/third-ui/main/credit/server` | Server-side credit helpers |

### AI UI

The AI layer provides ready-to-compose interface pieces for chat and prompt-driven product experiences:

- Prompt textarea and composer components.
- Message bubbles, message content, message metadata, message actions, and message lists.
- Markdown rendering support for AI responses.
- Status indicators and conversation state hooks.

Primary entry point:

| Entry | Purpose |
| --- | --- |
| `@windrun-huaiin/third-ui/ai` | AI chat, prompt, message, markdown, status, and conversation UI utilities |

### Clerk and Fingerprint Integration

The Clerk layer provides authentication UI integration for applications that use Clerk, including appearance configuration, provider components, user and organization components, and sign-in or sign-up flows that can be combined with fingerprint-aware behavior.

The fingerprint layer is split into client and server entry points so applications can keep browser collection, provider state, hooks, and server-side fingerprint handling separated.

Primary entry points:

| Entry | Purpose |
| --- | --- |
| `@windrun-huaiin/third-ui/clerk` | Clerk UI integration, auth components, providers, page helpers, and fingerprint-aware auth components |
| `@windrun-huaiin/third-ui/clerk/server` | Server-side Clerk helpers |
| `@windrun-huaiin/third-ui/fingerprint` | Client-side fingerprint components, provider, hooks, shared types, and debug utilities |
| `@windrun-huaiin/third-ui/fingerprint/server` | Server-side fingerprint helpers |

### Fuma Layouts, Docs, and MDX

The Fuma layer provides site layouts, documentation layouts, navigation configuration, docs root providers, MDX component maps, shared markdown components, and optional heavy renderer boundaries.

It is designed for applications that want to compose documentation pages without mixing content compilation, layout composition, and renderer feature selection into one entry.

Primary layout and docs entry points:

| Entry | Purpose |
| --- | --- |
| `@windrun-huaiin/third-ui/fuma/base` | Base Fuma layout and navigation exports |
| `@windrun-huaiin/third-ui/fuma/base/docs-root-provider` | Docs root provider |
| `@windrun-huaiin/third-ui/fuma/base/nav-config` | Navigation configuration helpers |
| `@windrun-huaiin/third-ui/fuma/base/site-docs-layout` | Documentation layout components |
| `@windrun-huaiin/third-ui/fuma/base/site-home-layout` | Home layout components |
| `@windrun-huaiin/third-ui/fuma/base/site-layout-shared` | Shared site layout utilities |
| `@windrun-huaiin/third-ui/fuma/server` | Server-side Fuma helpers |
| `@windrun-huaiin/third-ui/fuma/server/page-generator` | Documentation page generation helpers |
| `@windrun-huaiin/third-ui/fuma/server/llm-copy-handler` | LLM copy handler helpers |
| `@windrun-huaiin/third-ui/fuma/fuma-translate-util` | Fuma translation utilities |

### MDX Renderer Boundaries

The MDX renderer layer is intentionally split into a base entry and optional feature entries.

Use the base entry for ordinary documentation content. Add feature entries only when an application needs the corresponding renderer capability.

| Capability | Renderer Entry | Typical Purpose |
| --- | --- | --- |
| Base MDX | `@windrun-huaiin/third-ui/fuma/server/site-mdx/base` | Standard MDX component map for documentation pages |
| Code | `@windrun-huaiin/third-ui/fuma/server/site-mdx/features/code` | Code block rendering components |
| Math | `@windrun-huaiin/third-ui/fuma/server/site-mdx/features/math` | Math block and inline math rendering components |
| Mermaid | `@windrun-huaiin/third-ui/fuma/server/site-mdx/features/mermaid` | Mermaid diagram rendering components |
| Type Table | `@windrun-huaiin/third-ui/fuma/server/site-mdx/features/type-table` | Type table rendering components |
| Shared MDX | `@windrun-huaiin/third-ui/fuma/mdx` | Shared MDX building blocks |
| Shared Markdown | `@windrun-huaiin/third-ui/fuma/share` | Shared markdown component utilities |
| Heavy Renderers | `@windrun-huaiin/third-ui/fuma/heavy` | Heavy renderer exports for intentional, explicit imports |

The base MDX entry should stay lightweight. Heavy capabilities such as code, math, Mermaid, and type-table rendering should be imported through their dedicated entries only when the application enables them.

### Server and SEO Utilities

Shared server and SEO helpers are exposed separately from UI component entries.

Primary entry points:

| Entry | Purpose |
| --- | --- |
| `@windrun-huaiin/third-ui/lib/server` | Shared server utilities |
| `@windrun-huaiin/third-ui/lib/seo-metadata` | SEO metadata helpers |

### Styles

The package exposes a shared stylesheet for components that depend on the package-level visual system.

| Entry | Purpose |
| --- | --- |
| `@windrun-huaiin/third-ui/styles/third-ui.css` | Shared third-ui styles |

## Usage Notes

- Prefer specific subpath imports over broad imports when the feature area is known.
- Use server entries only from server-side application code.
- Keep optional Fuma MDX renderer features explicit in the application integration layer.
- Import heavy renderer entries only when the page or feature intentionally needs them.
- Include the shared stylesheet in the application when using components that rely on package styles.

## Installation

```bash
pnpm add @windrun-huaiin/third-ui
```

This package is intended for React and Next.js applications. Peer framework setup, styling setup, localization setup, and authentication setup are provided by the consuming application.
