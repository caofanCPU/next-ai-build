import { getOptionalServerAuthIdentity } from '@core/auth/auth-utils';
import { handleFingerprintRequest } from './route-shared';
import type { NextRequest } from 'next/server';

/**
 * Clerk-aware anonymous user initialization API.
 * POST /api/user/anonymous/init
 */
export async function POST(request: NextRequest) {
  return handleFingerprintRequest(request, {
    createIfNotExists: true,
    getAuthIdentity: getOptionalServerAuthIdentity,
  });
}
