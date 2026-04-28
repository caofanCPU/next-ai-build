/* eslint-disable @typescript-eslint/no-explicit-any */

// Fix BigInt serialization issue
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { getOptionalServerAuthUser } from '@core/auth/auth-utils';
import { moneyPriceConfig } from '@core/lib/money-price-config';
import { creditService, subscriptionService } from '@core/services/database';
import { buildInitUserContextFromEntities } from '@core/services/context';
import { getAsNeededLocalizedUrl, viewLocalTime } from '@windrun-huaiin/lib/utils';
import { buildMoneyPriceData } from '@windrun-huaiin/third-ui/main/money-price/server';
import type { CreditOverviewData, CreditOverviewTranslations } from '@windrun-huaiin/third-ui/main/credit';

export interface BuildCreditOverviewPayloadOptions {
  locale: string;
  defaultLocale?: string;
  localePrefixAsNeeded?: boolean;
  translations: CreditOverviewTranslations;
  pricingPath?: string;
  checkoutApiEndpoint?: string;
  customerPortalApiEndpoint?: string;
}

export interface CreditOverviewPayload {
  data: CreditOverviewData;
  totalLabel: string;
  translations: CreditOverviewTranslations;
}

export async function buildCreditOverviewPayload(
  options: BuildCreditOverviewPayloadOptions,
): Promise<CreditOverviewPayload | null> {
  const authUser = await getOptionalServerAuthUser();

  if (!authUser) {
    return null;
  }

  const {
    locale,
    defaultLocale = 'en',
    localePrefixAsNeeded = true,
    translations,
    pricingPath = '/pricing',
    checkoutApiEndpoint = '/api/stripe/checkout',
    customerPortalApiEndpoint = '/api/stripe/customer-portal',
  } = options;

  const { user } = authUser;
  const enableSubscriptionUpgrade = process.env.ENABLE_STRIPE_SUBSCRIPTION_UPGRADE !== 'false';

  const [credit, subscription, moneyPriceData] = await Promise.all([
    creditService.getCredit(user.userId),
    subscriptionService.getActiveSubscription(user.userId),
    buildMoneyPriceData({
      locale,
      currency: moneyPriceConfig.display.currency,
      enabledBillingTypes: ['monthly', 'yearly', 'onetime'],
    }),
  ]);

  if (!credit) {
    return null;
  }

  const initUserContext = buildInitUserContextFromEntities({
    user,
    credit,
    subscription,
  });

  const totalBalance =
    (credit.balanceFree ?? 0) +
    (credit.balancePaid ?? 0) +
    (credit.balanceOneTimePaid ?? 0);

  const buckets = [
    ...(credit.balancePaid > 0
      ? [{
          kind: 'subscription' as const,
          balance: credit.balancePaid,
          limit: credit.totalPaidLimit,
          expiresAt: viewLocalTime(credit.paidEnd),
        }]
      : []),
    ...(credit.balanceOneTimePaid > 0
      ? [{
          kind: 'onetime' as const,
          balance: credit.balanceOneTimePaid,
          limit: credit.totalOneTimePaidLimit,
          expiresAt: viewLocalTime(credit.oneTimePaidEnd),
        }]
      : []),
    ...(credit.balanceFree > 0
      ? [{
          kind: 'free' as const,
          balance: credit.balanceFree,
          limit: credit.totalFreeLimit,
          expiresAt: viewLocalTime(credit.freeEnd),
        }]
      : []),
  ];

  const pricingPageBaseUrl = getAsNeededLocalizedUrl(
    locale,
    pricingPath,
    localePrefixAsNeeded,
    defaultLocale,
  );

  const data: CreditOverviewData = {
    totalBalance,
    buckets,
    pricingContext: {
      moneyPriceData,
      moneyPriceConfig,
      checkoutApiEndpoint,
      customerPortalApiEndpoint,
      enableSubscriptionUpgrade,
      initUserContext,
    },
    ctaBehaviors: {
      subscribe: {
        desktop: { kind: 'modal', mode: 'subscription' },
        mobile: { kind: 'redirect', url: `${pricingPageBaseUrl}?initialBillingType=subscription` },
      },
      manage: {
        desktop: { kind: 'auth' },
        mobile: { kind: 'auth' },
      },
      onetime: {
        desktop: { kind: 'modal', mode: 'onetime' },
        mobile: { kind: 'redirect', url: `${pricingPageBaseUrl}?initialBillingType=onetime` },
      },
    },
  };

  if (subscription) {
    data.subscription = {
      planName: subscription.priceName ?? '',
      periodStart: viewLocalTime(subscription.subPeriodStart),
      periodEnd: viewLocalTime(subscription.subPeriodEnd),
    };
  }

  return {
    data,
    totalLabel: translations.totalLabel,
    translations,
  };
}
