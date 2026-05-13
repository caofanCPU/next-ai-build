/**
 * Fingerprint Server Utilities
 * Server-only fingerprint ID extraction and validation logic.
 * Safe for server usage without browser APIs or FingerprintJS.
 */

import {
  FINGERPRINT_HEADER_NAME,
  FINGERPRINT_COOKIE_NAME,
  isValidFingerprintId,
} from './fingerprint-shared';

/**
 * Extract fingerprint ID from a request.
 * Priority: header > cookie > query parameter.
 * Safe to use on the server.
 */
export function extractFingerprintId(
  headers: Headers | Record<string, string>,
  cookies?: Record<string, string>,
  query?: Record<string, string | undefined>
): string | null {
  // 1. Read from header.
  const headerValue = headers instanceof Headers 
    ? headers.get(FINGERPRINT_HEADER_NAME)
    : headers[FINGERPRINT_HEADER_NAME];
  
  if (headerValue && isValidFingerprintId(headerValue)) {
    return headerValue;
  }

  // 2. Read from cookie.
  if (cookies) {
    const cookieValue = cookies[FINGERPRINT_COOKIE_NAME];
    if (cookieValue && isValidFingerprintId(cookieValue)) {
      return cookieValue;
    }
  }

  // 3. Read from query parameters.
  if (query) {
    const queryValue = query.fingerprint_id || query.fp_id;
    if (queryValue && isValidFingerprintId(queryValue)) {
      return queryValue;
    }
  }

  return null;
}

/**
 * Generate a server-side fallback fingerprint ID.
 * Used when the client cannot generate a fingerprint.
 * Safe to use on the server.
 */
export function generateServerFingerprintId(): string {
  return `fp_server_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Extract fingerprint ID from a Next.js Request object.
 * Convenience helper for Next.js API routes.
 */
export function extractFingerprintFromNextRequest(request: Request): string | null {
  const headers = request.headers;
  
  // Try cookies by parsing the cookie header.
  const cookieHeader = headers.get('cookie');
  const cookies: Record<string, string> = {};
  
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = value;
      }
    });
  }

  // Try URL query parameters.
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return extractFingerprintId(headers, cookies, query);
}

type NextHeadersLike = Pick<Headers, 'forEach'>;
type NextCookiesLike = {
  getAll(): Array<{ name: string; value: string }>;
};

/**
 * Extract fingerprint ID from Next.js runtime headers/cookies stores.
 * Reusable in App Router server components and Server Actions.
 */
export function extractFingerprintFromNextStores(params: {
  headers: NextHeadersLike;
  cookies: NextCookiesLike;
}): string | null {
  const cookieMap = params.cookies
    .getAll()
    .reduce<Record<string, string>>((acc, cookie) => {
      acc[cookie.name] = cookie.value;
      return acc;
    }, {});

  const headerMap: Record<string, string> = {};
  params.headers.forEach((value, key) => {
    headerMap[key] = value;
  });

  return extractFingerprintId(headerMap, cookieMap);
}
