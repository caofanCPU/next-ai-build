import { creditService, subscriptionService, userService } from '../database/index';
import type { Credit, Subscription, User } from '../database/prisma-model-type';
import { viewLocalTime } from '@windrun-huaiin/lib/utils';
import type { XCredit, XSubscription, XUser } from '@windrun-huaiin/third-ui/fingerprint';
import type { InitUserContext } from '@windrun-huaiin/third-ui/main/server';

export interface UserContextEntities {
  user: User;
  credit: Credit | null;
  subscription: Subscription | null;
}

export interface FingerprintUserContext extends UserContextEntities {
  totalUsersOnDevice: number;
  hasAnonymousUser: boolean;
}

export function mapUserToXUser(user: User): XUser {
  return {
    userId: user.userId,
    userName: user.userName || '',
    fingerprintId: user.fingerprintId || '',
    clerkUserId: user.clerkUserId || '',
    stripeCusId: user.stripeCusId || '',
    email: user.email || '',
    status: user.status,
    createdAt: viewLocalTime(user.createdAt),
  };
}

export function mapCreditToXCredit(credit: Credit): XCredit {
  return {
    balanceFree: credit.balanceFree,
    totalFreeLimit: credit.totalFreeLimit,
    freeStart: viewLocalTime(credit.freeStart),
    freeEnd: viewLocalTime(credit.freeEnd),
    balancePaid: credit.balancePaid,
    totalPaidLimit: credit.totalPaidLimit,
    paidStart: viewLocalTime(credit.paidStart),
    paidEnd: viewLocalTime(credit.paidEnd),
    balanceOneTimePaid: credit.balanceOneTimePaid,
    totalOneTimePaidLimit: credit.totalOneTimePaidLimit,
    oneTimePaidStart: viewLocalTime(credit.oneTimePaidStart),
    oneTimePaidEnd: viewLocalTime(credit.oneTimePaidEnd),
    totalBalance: credit.balanceFree + credit.balancePaid + credit.balanceOneTimePaid,
  };
}

export function mapSubscriptionToXSubscription(
  subscription: Subscription | null,
): XSubscription | null {
  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    userId: subscription.userId || '',
    paySubscriptionId: subscription.paySubscriptionId || '',
    orderId: subscription.orderId || '',
    priceId: subscription.priceId || '',
    priceName: subscription.priceName || '',
    status: subscription.status || '',
    creditsAllocated: subscription.creditsAllocated,
    subPeriodStart: viewLocalTime(subscription.subPeriodStart),
    subPeriodEnd: viewLocalTime(subscription.subPeriodEnd),
  };
}

export function buildInitUserContextFromEntities(params: {
  user: User;
  credit: Credit | null;
  subscription: Subscription | null;
  isClerkAuthenticated?: boolean;
}): InitUserContext {
  return {
    fingerprintId: params.user.fingerprintId || null,
    xUser: mapUserToXUser(params.user),
    xCredit: params.credit ? mapCreditToXCredit(params.credit) : null,
    xSubscription: mapSubscriptionToXSubscription(params.subscription),
    isClerkAuthenticated: params.isClerkAuthenticated ?? true,
  };
}

export async function fetchUserContextByClerkUserId(
  clerkUserId: string,
): Promise<UserContextEntities | null> {
  const user = await userService.findByClerkUserId(clerkUserId);

  if (!user) {
    return null;
  }

  const [credit, subscription] = await Promise.all([
    creditService.getCredit(user.userId),
    subscriptionService.getActiveSubscription(user.userId),
  ]);

  return { user, credit, subscription };
}

export async function fetchLatestUserContextByFingerprintId(
  fingerprintId: string,
): Promise<FingerprintUserContext | null> {
  const existingUsers = await userService.findListByFingerprintId(fingerprintId);
  if (existingUsers.length === 0) {
    return null;
  }

  const latestAnonymousUser = existingUsers[0];
  const [credit, subscription] = await Promise.all([
    creditService.getCredit(latestAnonymousUser.userId),
    subscriptionService.getActiveSubscription(latestAnonymousUser.userId),
  ]);

  return {
    user: latestAnonymousUser,
    credit,
    subscription,
    totalUsersOnDevice: existingUsers.length,
    hasAnonymousUser: true,
  };
}
