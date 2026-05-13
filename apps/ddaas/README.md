# DDaaS Website

DDaaS is a production-ready product website foundation built on the `@windrun-huaiin` component and backend packages. It is designed for teams that want to launch polished SaaS, AI, documentation, and paid digital-product websites without rebuilding the same authentication, pricing, documentation, layout, theme, and payment infrastructure for every project.

Instead of acting as a single static template, DDaaS works as a configurable product system. Navigation, documentation structure, pricing plans, credits, visual theme, animation tone, authentication flow, content sources, and backend routes can be composed from shared packages and adapted to a new product with minimal application code.

## Product Positioning

DDaaS helps you turn a modern Next.js application into a commercial website faster:

- Launch marketing pages, documentation, blogs, legal pages, pricing pages, and authenticated user flows from one integrated codebase.
- Reuse professional React UI, Fumadocs layouts, MDX rendering, Stripe commerce, Clerk authentication, Prisma models, and API route handlers.
- Keep desktop, tablet, and mobile experiences consistent through shared responsive components.
- Configure the product experience at the application layer instead of rewriting core UI and backend logic.
- Build paid products with subscription plans, one-time credit packs, customer portal access, user credits, and payment webhooks already modeled.

## Core Capabilities

### Commercial Website Shell

DDaaS provides the common surface area required by a paid product website:

- Product home pages with hero, feature, gallery, usage, FAQ, CTA, SEO, and footer sections.
- Pricing pages with monthly, yearly, and one-time credit-pack purchase modes.
- Blog, documentation, and legal content routes backed by local MDX.
- Localized URL generation and multilingual message loading.
- Global navigation, dropdown menus, mobile navigation behavior, loading states, and 404 experiences.
- Site icon handling, favicon consistency, analytics script integration, and SEO metadata helpers.

### Authentication And Identity

The application integrates Clerk-based authentication from shared UI and backend packages:

- Sign-in, sign-up, and waitlist flows.
- Clerk appearance and provider integration.
- Server-side auth helpers and middleware support.
- Clerk user webhook route wiring.
- Fingerprint-aware anonymous user initialization for products that need a pre-login user context.

This makes DDaaS suitable for freemium products, AI tools, creator tools, documentation portals, and paid utilities where users may start anonymously and later convert into authenticated customers.

### Stripe, Pricing, And Credits

DDaaS includes a full commerce foundation for paid products:

- Stripe checkout route integration.
- Stripe customer portal route integration.
- Stripe webhook handling.
- Subscription products with monthly and yearly billing.
- One-time credit packs.
- Free, Pro, and Ultra plan slots that can be mapped to real Stripe price IDs.
- Credit balance display, credit overview APIs, and credit audit models.
- Pricing context APIs for rendering user-aware purchase states.

Pricing is controlled through structured configuration. Product teams can change plan names, billing options, price IDs, amounts, currencies, included credits, discount display, feature lists, highlighted plans, and purchase behavior without redesigning the pricing system.

### Configurable Product Experience

One of DDaaS's main strengths is personalization by configuration. A new product can adjust the user experience without forking the entire application shell:

- Menu configuration: primary links, grouped dropdowns, landing items, featured menu banners, icons, descriptions, localized URLs, and prefetch behavior.
- Layout configuration: site title, home URL, transparent navigation mode, theme switch behavior, search toggle behavior, documentation layout, and home layout.
- Pricing configuration: active payment provider, subscription plans, credit-pack plans, billing intervals, discounts, currency display, feature count balancing, and checkout endpoints.
- Animation configuration: pricing-card animation tones such as theme, rainbow, mono, warm, and cool, plus per-billing-mode animation differences.
- Theme skin configuration: shared color palettes, themed icons, themed buttons, gradients, rings, progress indicators, rich-text highlights, and dark-mode compatibility.
- Content configuration: build-time or development runtime MDX source modes for docs, blogs, and legal pages.
- Locale configuration: default locale, supported locales, locale prefix strategy, merged message sources, and localized navigation generation.

This lets DDaaS support multiple product brands while keeping the underlying engineering system stable.

### Documentation, Blog, And Legal Content

DDaaS uses `@windrun-huaiin/fumadocs-local-md` and `@windrun-huaiin/third-ui` to deliver a documentation system that is fast in production and flexible in development:

- Local MDX content sources under `src/mdx`.
- Build-mode content generation into `.source` for production stability.
- Optional runtime mode for faster local documentation editing.
- Fumadocs layouts for documentation and content pages.
- MDX rendering boundaries for standard content, code blocks, math, Mermaid diagrams, type tables, and other heavier renderers.
- Blog index generation from MDX frontmatter.
- LLM-readable content endpoints for docs, blog, and legal content.

This gives product teams a documentation and content publishing workflow without maintaining custom MDX build scripts.

### AI Product Interfaces

The shared UI system includes AI-focused interface components that DDaaS can compose into product experiences:

- Prompt textarea and composer components.
- Chat messages, markdown response rendering, metadata, actions, status indicators, and message lists.
- Reusable AI API route wiring.
- AI playground surfaces for validating runtime behavior.

These pieces are useful for AI SaaS products, prompt tools, image-generation products, agents, and internal AI dashboards.

### Backend Foundation

DDaaS consumes `@windrun-huaiin/backend-core` to provide reusable backend infrastructure:

- Prisma client generation and shared database models.
- User, subscription, transaction, credit, credit audit, and API log models.
- Database service and aggregate service layers.
- Auth middleware and server helpers.
- Stripe services and route handlers.
- Upstash server helpers.
- AI service and API route helpers.
- Development scripts for syncing backend-core routes, Prisma models, and migrations into the application.

The result is a website foundation that includes the operational pieces required for paid products, not only the visual pages.

## Package System

DDaaS is assembled from focused packages in this monorepo:

| Package | Role in DDaaS |
| --- | --- |
| `@windrun-huaiin/base-ui` | Base React UI, theme utilities, icons, favicon handling, analytics scripts, and responsive visual primitives. |
| `@windrun-huaiin/third-ui` | Product page sections, pricing UI, credit UI, AI UI, Clerk integration, Fumadocs layouts, MDX renderers, loading states, and interaction components. |
| `@windrun-huaiin/backend-core` | Prisma, auth, Stripe, pricing, credit, Upstash, AI services, and reusable Next.js API route handlers. |
| `@windrun-huaiin/fumadocs-local-md` | Local MDX source processing, build-mode `.source` generation, runtime development mode, and content source APIs. |
| `@windrun-huaiin/lib` | Common app config, i18n helpers, localized URL generation, class-name utilities, date formatting, message merging, and MDX-to-LLM text conversion. |
| `@windrun-huaiin/contracts` | Shared domain contracts, including AI-related contracts. |
| `@windrun-huaiin/dev-scripts` | Translation checks, blog index generation, backend route syncing, Prisma asset syncing, dependency updates, and workspace maintenance scripts. |

## Why Teams Pay For This

DDaaS saves the most time where commercial websites usually become expensive:

- Payment readiness: Stripe checkout, portal, webhooks, subscription state, transactions, and credits are already represented.
- Auth readiness: Clerk pages, server helpers, user webhooks, and anonymous-user initialization are wired as reusable pieces.
- Content readiness: docs, blog, legal pages, MDX build artifacts, LLM content extraction, and generated blog indexes are part of the system.
- Design consistency: shared theme palettes, icons, responsive components, animation tones, and dark-mode behavior reduce redesign work.
- Configuration speed: new products can customize menus, pricing, themes, animations, locales, and content sources without rebuilding the platform.
- Engineering leverage: reusable packages keep repeated SaaS infrastructure out of individual app code.

For agencies, indie hackers, and product teams, DDaaS turns the first weeks of SaaS website engineering into a configuration and product-content task.

## Typical Use Cases

- AI SaaS landing pages with authenticated generation tools and credit billing.
- Documentation-first product sites with pricing and account flows.
- Paid creator tools that sell subscriptions and one-time credit packs.
- Multi-language marketing websites with blogs, legal pages, and SEO content.
- Internal product portals that need consistent UI, auth, docs, and backend route structure.
- Fast product validation sites that must still look and behave like production software.

## Application Structure

```text
apps/ddaas/
  src/app/                 Next.js App Router pages, layouts, API routes, docs, blog, legal, pricing, and auth routes
  src/components/          Application-level composition components
  src/lib/                 App config, locale helpers, site icon config, docs source config
  src/mdx/                 Local MDX content for docs, blog, and legal pages
  src/server/              App-specific server services
  prisma/                  Host Prisma schema using backend-core models
  messages/                Locale messages
  .source/                 Generated local-md content source artifacts
```

## Build Workflow

DDaaS keeps content generation and application build steps explicit:

```bash
pnpm build-local-md
pnpm build
```

The production build uses generated `.source` artifacts for MDX content, generates the blog index, generates the Prisma client, and then builds the Next.js application.

## Configuration First, Copy Later

The current application copy can be replaced per product. The durable value of DDaaS is the configured system underneath it: a responsive product website shell, composable navigation, commercial pricing, user identity, credits, documentation, legal content, AI UI surfaces, and reusable backend routes.

For a new product, the recommended workflow is:

1. Configure brand, theme, navigation, locale behavior, and site metadata.
2. Configure Stripe price IDs, billing plans, credit packs, and pricing-card presentation.
3. Replace product copy in locale messages and MDX content.
4. Enable only the MDX renderers, AI surfaces, and backend routes the product needs.
5. Run translation validation, local-md build, Prisma generation, and the Next.js production build.

