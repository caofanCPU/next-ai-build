import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { userService } from '../services/database/index';
import { User } from '../services/database/prisma-model-type';
import { AUTH_ERRORS, AUTH_HEADERS, type AuthProvider, type ProviderIdentity } from './auth-shared';

export interface AuthResult {
  userId: string;
  user: User;
  provider: AuthProvider;
  providerUserId: string;
}

/**
 * Fetch User's info from header field by Middleware
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthResult> {
  try {
    const provider = req.headers.get(AUTH_HEADERS.provider);
    const providerUserId = req.headers.get(AUTH_HEADERS.providerUserId);
    if (provider !== 'clerk' || !providerUserId) {
      throw new Error(AUTH_ERRORS.unauthorized);
    }

    const user = await userService.findByClerkUserId(providerUserId);
    if (!user) {
      throw new Error(AUTH_ERRORS.userNotFound);
    }

    return {
      userId: user.userId,
      user,
      provider: 'clerk',
      providerUserId,
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    throw error;
  }
}

/**
 * Require Auth, success back user's id
 */
export async function requireAuth(req: NextRequest): Promise<string> {
  const auth = await getAuthenticatedUser(req);
  return auth.userId;
}

/**
 * Require Auth, success back user's info
 */
export async function requireAuthWithUser(req: NextRequest): Promise<AuthResult> {
  return await getAuthenticatedUser(req);
}

/**
 * Only use in server side
 * Server Component / Server Action, just need user's login status
 */
export async function getOptionalServerAuthIdentity(): Promise<ProviderIdentity | null> {
  try {
    const { userId: providerUserId } = await auth();
    if (!providerUserId) {
      return null;
    }

    return {
      provider: 'clerk',
      providerUserId,
    };
  } catch (error) {
    console.error('Error getting optional server auth identity:', error);
    return null;
  }
}

/**
 * Only use in server side
 * Server Component / Server Action, need user's login status and user's data, will check db
 */
export async function getOptionalServerAuthUser(): Promise<AuthResult | null> {
  try {
    const identity = await getOptionalServerAuthIdentity();
    if (!identity) {
      return null;
    }

    const user = await userService.findByClerkUserId(identity.providerUserId);
    if (!user) {
      return null;
    }

    return {
      userId: user.userId,
      user,
      provider: identity.provider,
      providerUserId: identity.providerUserId,
    };
  } catch (error) {
    console.error('Error getting optional server auth user:', error);
    return null;
  }
}

/**
 * API Route Auth Util
 */
export class ApiAuthUtils {
  private req: NextRequest;

  constructor(req: NextRequest) {
    this.req = req;
  }

  async requireAuth(): Promise<string> {
    return await requireAuth(this.req);
  }

  async requireAuthWithUser(): Promise<AuthResult> {
    return await requireAuthWithUser(this.req);
  }

  async getUserId(): Promise<string | null> {
    try {
      const auth = await getAuthenticatedUser(this.req);
      return auth.userId;
    } catch {
      return null;
    }
  }

  async getUser(): Promise<AuthResult | null> {
    try {
      return await getAuthenticatedUser(this.req);
    } catch {
      return null;
    }
  }
}
