import { NextRequest } from 'next/server';
import { userService } from '../services/database/index';
import { User } from '../services/database/prisma-model-type';
import { AUTH_ERRORS, AUTH_HEADERS, type AuthProvider } from './auth-shared';

/**
 * 认证结果类型
 */
export interface AuthResult {
  userId: string;
  user: User;
  provider: AuthProvider;
  providerUserId: string;
}

/**
 * 从中间件设置的 Clerk ID 获取完整用户信息
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
 * 要求用户必须已认证，返回用户ID
 */
export async function requireAuth(req: NextRequest): Promise<string> {
  const auth = await getAuthenticatedUser(req);
  return auth.userId;
}

/**
 * 要求用户必须已认证，返回完整用户信息
 */
export async function requireAuthWithUser(req: NextRequest): Promise<AuthResult> {
  return await getAuthenticatedUser(req);
}

/**
 * API Route版本的认证工具函数
 */
export class ApiAuthUtils {
  private req: NextRequest;

  constructor(req: NextRequest) {
    this.req = req;
  }

  /**
   * 要求用户必须已认证，返回用户ID
   */
  async requireAuth(): Promise<string> {
    return await requireAuth(this.req);
  }

  /**
   * 要求用户必须已认证，返回完整用户信息
   */
  async requireAuthWithUser(): Promise<AuthResult> {
    return await requireAuthWithUser(this.req);
  }

  /**
   * 获取用户ID（如果已认证）
   */
  async getUserId(): Promise<string | null> {
    try {
      const auth = await getAuthenticatedUser(this.req);
      return auth.userId;
    } catch {
      return null;
    }
  }

  /**
   * 获取完整用户信息（如果已认证）
   */
  async getUser(): Promise<AuthResult | null> {
    try {
      return await getAuthenticatedUser(this.req);
    } catch {
      return null;
    }
  }
}
