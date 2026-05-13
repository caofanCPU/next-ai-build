
import { appConfig } from "@/lib/appConfig";
import { buildProtectedPageRoutePatterns, handleAuthMiddleware } from "@core/auth/auth-middleware";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware({
  locales: appConfig.i18n.locales,
  defaultLocale: appConfig.i18n.defaultLocale,
  localePrefix: appConfig.i18n.localePrefixAsNeeded ? "as-needed" : "always", 
  localeDetection: false
});

// Page routes that require authentication.
const protectedPageRoutes = createRouteMatcher(
  buildProtectedPageRoutePatterns(
    ['/dashboard', '/settings', '/profile', '/billing'],
    appConfig.i18n.locales
  )
);

// API routes that require authentication.
const protectedApiRoutes = createRouteMatcher([
  // Stripe payment APIs.
  '/api/stripe(.*)',
  // Credit APIs.
  '/api/credit(.*)',
  // Transaction APIs.
  '/api/transaction(.*)'
]);

// Public API routes such as webhooks and anonymous user initialization.
const publicApiRoutes = createRouteMatcher([
  // Stripe webhook
  '/api/webhook/stripe',
  // Clerk webhook
  '/api/webhook/clerk/user',
  // Anonymous user initialization.
  '/api/user/anonymous/init',
  // Health checks and public content APIs.
  '/api/health',
  '/api/legal',
  '/api/docs',
  '/api/search',
  '/api/blog'
]);

// Clerk v6 recommended usage: export clerkMiddleware(handler, options) directly.
// No extra wrapper function or manual request forwarding is needed.
export default clerkMiddleware(
  async (auth, req: NextRequest) => {
    const { defaultLocale, locales } = appConfig.i18n;
    const pathname = req.nextUrl.pathname;
    const isWellKnownPath =
      pathname === '/.well-known' || pathname.startsWith('/.well-known/');
    const hasLocalePrefix = locales.some(
      (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)
    );

    if (isWellKnownPath) {
      return NextResponse.next();
    }

    const authResponse = await handleAuthMiddleware(auth, req, {
      protectedPageRoutes,
      protectedApiRoutes,
      publicApiRoutes,
      intlMiddleware,
    });
    if (authResponse) {
      return authResponse;
    }

    // Handle page requests without locale prefixes according to configuration.
    // This prevents requests from missing the [locale] route.
    if (!hasLocalePrefix && !pathname.startsWith('/api/')) {
      const url = req.nextUrl.clone();
      url.pathname = `/${defaultLocale}${pathname}`;

      if (appConfig.i18n.localePrefixAsNeeded) {
        return NextResponse.rewrite(url);
      } else {
        return NextResponse.redirect(url);
      }
    }

    // Use the default i18n middleware for all other routes.

    // handle trailing slash redirect
    if (req.nextUrl.pathname.length > 1 && req.nextUrl.pathname.endsWith("/")) {
      return NextResponse.redirect(
        new URL(req.nextUrl.pathname.slice(0, -1), req.url),
        301
      );
    }
    // Default handling for other public page routes.
    return intlMiddleware(req);
  },
  { debug: appConfig.clerk.debug }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, but include API routes
    "/((?!_next|\\.well-known|sitemap.xml?|robots.txt?|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)(?:$|\\?)).*)",
    // Include API routes explicitly
    "/api/(.*)",
  ],
};
