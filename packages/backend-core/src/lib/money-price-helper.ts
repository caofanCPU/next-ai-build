import { cookies, headers } from 'next/headers';
import {
  extractFingerprintFromNextStores,
} from '@windrun-huaiin/third-ui/fingerprint/server';
import type { InitUserContext } from '@windrun-huaiin/third-ui/main/server';
import { getOptionalServerAuthIdentity } from '../auth/auth-utils';
import {
  buildInitUserContextFromEntities,
  fetchUserContextByClerkUserId,
  finalizeUserContext,
} from '../services/context';

async function readFingerprintIdFromRequest(): Promise<string | null> {
  const cookieStore = await cookies();
  const headerList = await headers();

  return extractFingerprintFromNextStores({
    headers: headerList,
    cookies: cookieStore,
  });
}

export async function getMoneyPriceInitUserContext(): Promise<InitUserContext> {
  const authIdentity = await getOptionalServerAuthIdentity();
  const clerkUserId = authIdentity?.providerUserId ?? null;

  if (clerkUserId) {
    const userContext = await fetchUserContextByClerkUserId(clerkUserId);
    if (!userContext) {
      return {
        fingerprintId: null,
        xUser: null,
        xCredit: null,
        xSubscription: null,
        isClerkAuthenticated: false,
      };
    }

    const initUserContext = buildInitUserContextFromEntities({
      user: userContext.user,
      credit: userContext.credit,
      subscription: userContext.subscription,
      isClerkAuthenticated: true,
    });

    return finalizeUserContext(initUserContext);
  }

  const fingerprintId = await readFingerprintIdFromRequest();

  if (!fingerprintId) {
    console.error("Not found fingerprintId from request! NEED CHECK!")
  }

  return {
    fingerprintId,
    xUser: null,
    xCredit: null,
    xSubscription: null,
    isClerkAuthenticated: false,
  };
}
