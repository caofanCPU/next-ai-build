import { handleFingerprintRequest } from './route-shared';
import type { NextRequest } from 'next/server';

/**
 * Fingerprint-only anonymous user initialization API.
 * Use this route in apps that do not install or configure Clerk.
 * POST /api/user/anonymous/init
 */
export async function POST(request: NextRequest) {
  return handleFingerprintRequest(request, {
    createIfNotExists: true,
    getAuthIdentity: async () => null,
  });
}
