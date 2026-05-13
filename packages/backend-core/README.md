# @windrun-huaiin/backend-core

Shared backend primitives for Next.js applications, including Prisma access, database services, authentication helpers, Stripe integration, credit and pricing server utilities, Upstash utilities, AI services, and ready-to-wire API route handlers.

This package is organized around public subpath exports. Import the narrowest entry point that matches the backend capability you need, especially when separating server-only code from route handlers.

## Feature Areas

### Core Backend Utilities

The root entry provides shared backend exports for application code that needs the common backend surface of the package.

| Entry | Purpose |
| --- | --- |
| `@windrun-huaiin/backend-core` | Shared backend primitives and common exports |

### Prisma and Database Services

The Prisma and database entries provide the data-access layer for applications that share database models, service methods, and transaction-oriented backend logic.

| Entry | Purpose |
| --- | --- |
| `@windrun-huaiin/backend-core/prisma` | Prisma client and Prisma-related utilities |
| `@windrun-huaiin/backend-core/database` | Database service layer |
| `@windrun-huaiin/backend-core/aggregate` | Aggregate service layer |
| `@windrun-huaiin/backend-core/context` | Backend context helpers |

### Authentication

Authentication entries provide shared server utilities, shared auth definitions, and middleware helpers for applications that need consistent auth handling.

| Entry | Purpose |
| --- | --- |
| `@windrun-huaiin/backend-core/auth/server` | Server-side authentication helpers |
| `@windrun-huaiin/backend-core/auth/shared` | Shared authentication utilities and definitions |
| `@windrun-huaiin/backend-core/auth/middleware` | Authentication middleware helpers |

### Stripe, Pricing, and Credits

Commerce entries cover Stripe integration, checkout and customer portal route handlers, pricing server helpers, and credit server helpers.

| Entry | Purpose |
| --- | --- |
| `@windrun-huaiin/backend-core/stripe` | Stripe service layer |
| `@windrun-huaiin/backend-core/stripe/server` | Server-side Stripe configuration helpers |
| `@windrun-huaiin/backend-core/pricing/server` | Server-side pricing helpers |
| `@windrun-huaiin/backend-core/credit/server` | Server-side credit helpers |
| `@windrun-huaiin/backend-core/config/money-price` | Money-price configuration |
| `@windrun-huaiin/backend-core/app/api/stripe/checkout/route` | Stripe checkout API route handler |
| `@windrun-huaiin/backend-core/app/api/stripe/customer-portal/route` | Stripe customer portal API route handler |
| `@windrun-huaiin/backend-core/app/api/webhook/stripe/route` | Stripe webhook API route handler |

### User and Clerk Routes

User route handlers provide reusable API endpoints for anonymous user initialization, credit overview, pricing context, and Clerk user webhooks.

| Entry | Purpose |
| --- | --- |
| `@windrun-huaiin/backend-core/app/api/user/anonymous/init/route` | Anonymous user initialization API route handler |
| `@windrun-huaiin/backend-core/app/api/user/credit-overview/route` | User credit overview API route handler |
| `@windrun-huaiin/backend-core/app/api/user/pricing-context/route` | User pricing context API route handler |
| `@windrun-huaiin/backend-core/app/api/webhook/clerk/user/route` | Clerk user webhook API route handler |

### Fingerprint and Upstash

Fingerprint and Upstash entries expose server-side configuration and infrastructure helpers for identity and storage-related backend workflows.

| Entry | Purpose |
| --- | --- |
| `@windrun-huaiin/backend-core/config/fingerprint` | Fingerprint configuration |
| `@windrun-huaiin/backend-core/upstash/server` | Server-side Upstash helpers |

### AI Services

AI entries provide shared AI service utilities and a reusable API route handler for AI endpoints.

| Entry | Purpose |
| --- | --- |
| `@windrun-huaiin/backend-core/ai` | AI service layer |
| `@windrun-huaiin/backend-core/app/api/ai/route` | AI API route handler |

## Usage Notes

- Use server-only entries from server components, route handlers, server actions, or backend modules.
- Use API route handler entries when an application wants to mount the package-provided route behavior directly in a Next.js route.
- Keep Prisma, database, Stripe, auth, and Upstash imports out of client-side code.
- Prefer feature-specific subpath imports so each application depends only on the backend capabilities it actually uses.

## Installation

```bash
pnpm add @windrun-huaiin/backend-core
```

This package is intended for Next.js backend usage. The consuming application is responsible for its environment variables, database setup, authentication provider setup, Stripe setup, and deployment configuration.
