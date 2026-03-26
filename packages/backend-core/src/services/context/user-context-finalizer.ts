import { viewLocalTime } from '@windrun-huaiin/lib/utils';
import type { XSubscription, XUser } from '@windrun-huaiin/third-ui/fingerprint';

type FinalizableUserContext = {
  xUser: XUser | null;
  xSubscription: XSubscription | null;
};

/**
 * Output finalizer for user-context payloads.
 * Real data assembly should stay in user-context-service; any optional test-only
 * shaping is isolated here so production services do not depend on mock code.
 */
export function finalizeUserContext<T extends FinalizableUserContext>(context: T): T {
  const mockEnabled = process.env.MONEY_PRICE_MOCK_USER_ENABLED === 'true';
  const mockType = Number(process.env.MONEY_PRICE_MOCK_USER_TYPE ?? NaN);

  if (
    !context.xUser ||
    !mockEnabled ||
    !Number.isInteger(mockType) ||
    mockType < 0 ||
    mockType > 4
  ) {
    return context;
  }

  const ensureSubscription = () => {
    if (!context.xSubscription) {
      const now = new Date();
      context.xSubscription = {
        id: BigInt(99999),
        userId: context.xUser!.userId,
        paySubscriptionId: 'MOCK-PAY-SUB-ID',
        orderId: '',
        priceId: '',
        priceName: 'MOCK-TEST',
        status: 'active',
        creditsAllocated: 0,
        subPeriodStart: viewLocalTime(now),
        subPeriodEnd: viewLocalTime(now),
      };
    }

    return context.xSubscription!;
  };

  switch (mockType) {
    case 0: {
      const subscription = ensureSubscription();
      subscription.status = '';
      subscription.priceId = '';
      break;
    }
    case 1: {
      const subscription = ensureSubscription();
      subscription.priceId =
        process.env.STRIPE_PRO_MONTHLY_PRICE_ID || subscription.priceId;
      break;
    }
    case 2: {
      const subscription = ensureSubscription();
      subscription.priceId =
        process.env.STRIPE_ULTRA_MONTHLY_PRICE_ID || subscription.priceId;
      break;
    }
    case 3: {
      const subscription = ensureSubscription();
      subscription.priceId =
        process.env.STRIPE_PRO_YEARLY_PRICE_ID || subscription.priceId;
      break;
    }
    case 4: {
      const subscription = ensureSubscription();
      subscription.priceId =
        process.env.STRIPE_ULTRA_YEARLY_PRICE_ID || subscription.priceId;
      break;
    }
    default:
      break;
  }

  return context;
}
