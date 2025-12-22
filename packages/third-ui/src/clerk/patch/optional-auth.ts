import { auth } from '@clerk/nextjs/server';

export type OptionalAuthResult = {
  userId: string | null;
  sessionId: string | null;
  raw: Awaited<ReturnType<typeof auth>> | null;
};

/**
 * 可选鉴权：在缺少 Clerk 标记或未登录时返回 null，避免 auth() 抛错。
 * 仅供服务端使用，请从 @third-ui/clerk/patch/optional-auth 导入。
 */
export async function getOptionalAuth(): Promise<OptionalAuthResult> {
  try {
    const res = await auth();
    return {
      userId: res.userId ?? null,
      sessionId: res.sessionId ?? null,
      raw: res,
    };
  } catch {
    return { userId: null, sessionId: null, raw: null };
  }
}
