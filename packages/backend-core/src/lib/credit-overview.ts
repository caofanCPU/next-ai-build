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
  enabledBillingTypes?: string[];
}

export interface CreditOverviewPayload {
  data: CreditOverviewData;
  totalLabel: string;
  translations: CreditOverviewTranslations;
}

const DEFAULT_ENABLED_BILLING_TYPES = ['monthly', 'yearly', 'onetime'];
const SUBSCRIPTION_BILLING_TYPES = new Set(['monthly', 'yearly']);

function normalizeEnabledBillingTypes(enabledBillingTypes: string[] | undefined) {
  const normalized = Array.from(
    new Set(
      (enabledBillingTypes?.length ? enabledBillingTypes : DEFAULT_ENABLED_BILLING_TYPES)
        .map((billingType) => billingType.trim())
        .filter((billingType) => billingType.length > 0),
    ),
  );

  return normalized.length ? normalized : DEFAULT_ENABLED_BILLING_TYPES;
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
    enabledBillingTypes: enabledBillingTypesOption,
  } = options;

  const { user } = authUser;
  const enableSubscriptionUpgrade = process.env.ENABLE_STRIPE_SUBSCRIPTION_UPGRADE !== 'false';
  const enabledBillingTypes = normalizeEnabledBillingTypes(enabledBillingTypesOption);
  const subscriptionBillingEnabled = enabledBillingTypes.some((billingType) =>
    SUBSCRIPTION_BILLING_TYPES.has(billingType),
  );
  const onetimeBillingEnabled = enabledBillingTypes.includes('onetime');

  const [credit, subscription, moneyPriceData] = await Promise.all([
    creditService.getCredit(user.userId),
    subscriptionService.getActiveSubscription(user.userId),
    buildMoneyPriceData({
      locale,
      currency: moneyPriceConfig.display.currency,
      enabledBillingTypes,
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
    (subscriptionBillingEnabled ? credit.balancePaid ?? 0 : 0) +
    (onetimeBillingEnabled ? credit.balanceOneTimePaid ?? 0 : 0);

  const buckets = [
    ...(subscriptionBillingEnabled && credit.balancePaid > 0
      ? [{
          kind: 'subscription' as const,
          balance: credit.balancePaid,
          limit: credit.totalPaidLimit,
          expiresAt: viewLocalTime(credit.paidEnd),
        }]
      : []),
    ...(onetimeBillingEnabled && credit.balanceOneTimePaid > 0
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
      ...(subscriptionBillingEnabled
        ? {
            subscribe: {
              desktop: { kind: 'modal', mode: 'subscription' },
              mobile: { kind: 'redirect', url: `${pricingPageBaseUrl}?initialBillingType=subscription` },
            },
            manage: {
              desktop: { kind: 'auth' },
              mobile: { kind: 'auth' },
            },
          }
        : {}),
      ...(onetimeBillingEnabled
        ? {
            onetime: {
              desktop: { kind: 'modal', mode: 'onetime' },
              mobile: { kind: 'redirect', url: `${pricingPageBaseUrl}?initialBillingType=onetime` },
            },
          }
        : {}),
    },
  };

  if (subscriptionBillingEnabled && subscription) {
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
