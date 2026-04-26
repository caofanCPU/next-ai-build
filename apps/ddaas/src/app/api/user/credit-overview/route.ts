import { defaultLocale, localePrefixAsNeeded } from '@/lib/appConfig';
import { viewLocalTime } from '@lib/utils';
import { getOptionalServerAuthUser } from '@windrun-huaiin/backend-core/auth/server';
import { buildInitUserContextFromEntities } from '@windrun-huaiin/backend-core/context';
import { creditService, subscriptionService } from '@windrun-huaiin/backend-core/database';
import { moneyPriceConfig } from '@windrun-huaiin/backend-core/config/money-price';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { buildMoneyPriceData } from '@third-ui/main/server';
import type { CreditOverviewData, CreditOverviewTranslations } from '@third-ui/main';
import { getTranslations } from 'next-intl/server';
import { NextResponse } from 'next/server';

interface CreditOverviewPayload {
  data: CreditOverviewData;
  totalLabel: string;
  translations: CreditOverviewTranslations;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || defaultLocale;
  const authUser = await getOptionalServerAuthUser();

  if (!authUser) {
    return NextResponse.json(null);
  }

  const { user } = authUser;
  const enableSubscriptionUpgrade = process.env.ENABLE_STRIPE_SUBSCRIPTION_UPGRADE !== 'false';

  const [credit, subscription, t, moneyPriceData] = await Promise.all([
    creditService.getCredit(user.userId),
    subscriptionService.getActiveSubscription(user.userId),
    getTranslations({ locale, namespace: 'credit' }),
    buildMoneyPriceData({
      locale,
      currency: moneyPriceConfig.display.currency,
      enabledBillingTypes: ['monthly', 'yearly', 'onetime'],
    }),
  ]);

  if (!credit) {
    return NextResponse.json(null);
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
    '/pricing',
    localePrefixAsNeeded,
    defaultLocale,
  );

  const data: CreditOverviewData = {
    totalBalance,
    buckets,
    pricingContext: {
      moneyPriceData,
      moneyPriceConfig,
      checkoutApiEndpoint: '/api/stripe/checkout',
      customerPortalApiEndpoint: '/api/stripe/customer-portal',
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
      planName: subscription.priceName,
      periodStart: viewLocalTime(subscription.subPeriodStart),
      periodEnd: viewLocalTime(subscription.subPeriodEnd),
    };
  }

  const translations: CreditOverviewTranslations = {
    summaryDescription: t('summary.description'),
    totalLabel: t('summary.totalLabel'),
    bucketsTitle: t('buckets.title'),
    bucketsEmpty: t('buckets.empty'),
    expiredAtLabel: t('buckets.expiredAtLabel'),
    expandDetail: t('buckets.expandDetail'),
    hiddenDetail: t('buckets.hiddenDetail'),
    bucketDefaultLabels: (t.raw('buckets.labels') as Record<string, string>) ?? {},
    subscriptionPeriodLabel: t('subscription.periodLabel'),
    subscriptionManage: t('subscription.manage'),
    subscriptionInactive: t('subscription.inactive'),
    subscribePay: t('subscription.pay'),
    onetimeBuy: t('onetime.buy'),
  };

  const payload: CreditOverviewPayload = {
    data,
    totalLabel: t('summary.totalLabel'),
    translations,
  };

  return NextResponse.json(payload);
}
