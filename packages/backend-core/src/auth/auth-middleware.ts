import type { ClerkMiddlewareAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_HEADERS, type ProviderIdentity } from './auth-shared';

export function buildProtectedPageRoutePatterns(
  protectedRoots: readonly string[],
  locales: readonly string[]
): string[] {
  const uniqueRoots = [...new Set(protectedRoots)]
    .map((root) => root.trim())
    .filter(Boolean)
    .map((root) => (root.startsWith('/') ? root : `/${root}`))
    .map((root) => root.replace(/\/+$/, ''));

  const uniqueLocales = [...new Set(locales)]
    .map((locale) => locale.trim())
    .filter(Boolean);

  const patterns = new Set<string>();

  for (const root of uniqueRoots) {
    patterns.add(`${root}(.*)`);

    for (const locale of uniqueLocales) {
      patterns.add(`/${locale}${root}(.*)`);
    }
  }

  return [...patterns];
}

export interface AuthMiddlewareOptions {
  protectedPageRoutes: (req: NextRequest) => boolean;
  protectedApiRoutes: (req: NextRequest) => boolean;
  publicApiRoutes: (req: NextRequest) => boolean;
  intlMiddleware: (req: NextRequest) => ReturnType<typeof NextResponse.next> | Response | undefined;
}

async function authenticateWithClerk(auth: ClerkMiddlewareAuth): Promise<ProviderIdentity | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  return {
    provider: 'clerk',
    providerUserId: userId,
  };
}

export function buildAuthenticatedRequestHeaders(
  req: NextRequest,
  auth: ProviderIdentity
): Headers {
  const headers = new Headers(req.headers);
  headers.set(AUTH_HEADERS.provider, auth.provider);
  headers.set(AUTH_HEADERS.providerUserId, auth.providerUserId);
  return headers;
}

export async function handleAuthMiddleware(
  auth: ClerkMiddlewareAuth,
  req: NextRequest,
  options: AuthMiddlewareOptions
) {
  const { protectedPageRoutes, protectedApiRoutes, publicApiRoutes, intlMiddleware } = options;

  if (protectedPageRoutes(req)) {
    const identity = await authenticateWithClerk(auth);
    if (!identity) {
      return (await auth()).redirectToSignIn();
    }
    const requestHeaders = buildAuthenticatedRequestHeaders(req, identity);
    console.log('Forward auth context for protected page:', identity.provider, identity.providerUserId);
    return intlMiddleware(
      new NextRequest(req.url, {
        headers: requestHeaders,
        method: req.method,
        body: req.body,
      })
    );
  }

  if (protectedApiRoutes(req)) {
    const identity = await authenticateWithClerk(auth);
    if (!identity) {
      return (await auth()).redirectToSignIn();
    }
    const requestHeaders = buildAuthenticatedRequestHeaders(req, identity);
    console.log('Forward auth context for protected API:', identity.provider, identity.providerUserId);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (publicApiRoutes(req)) {
    console.log('Public API route, no auth required:', req.nextUrl.pathname);
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith('/api/')) {
    console.log('Other API route, no internationalization:', req.nextUrl.pathname);
    return NextResponse.next();
  }

  return null;
}
