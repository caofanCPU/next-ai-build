import { creditService, subscriptionService, userService } from '@windrun-huaiin/backend-core/database';
import { auth } from '@clerk/nextjs/server';
import { viewLocalTime } from '@lib/utils';
import { CreditNavButton } from '@third-ui/main';
import type { CreditOverviewData } from '@third-ui/main/server';
import { CreditOverview, buildMoneyPriceData } from '@third-ui/main/server';
import { moneyPriceConfig } from '@windrun-huaiin/backend-core/lib';
import { buildInitUserContextFromEntities } from '@windrun-huaiin/backend-core/context'
import { getTranslations } from 'next-intl/server';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { localPrefixAsNeeded, defaultLocale } from '@/lib/appConfig';

interface CreditPopoverProps {
  locale: string;
}

export async function CreditPopover({ locale }: CreditPopoverProps) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return null;
  }

  const user = await userService.findByClerkUserId(clerkUserId);
  if (!user) {
    console.warn('User not found!');
    return null;
  }

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

  // 根据是否订阅，动态调整 buckets 顺序
  // 已订阅：subscription → onetime → free
  // 未订阅：onetime → free
  // 为0的类型积分不展示

  // 直接基于 credit 对象生成 buckets，无需额外传参
  const buckets = [
    ...(credit.balancePaid > 0 
      ? [{
          kind: 'subscription' as const,
          balance: credit.balancePaid,
          limit: credit.totalPaidLimit,
          expiresAt: viewLocalTime(credit.paidEnd)
        }] 
      : []),

    ...(credit.balanceOneTimePaid > 0 
      ? [{
          kind: 'onetime' as const,
          balance: credit.balanceOneTimePaid,
          limit: credit.totalOneTimePaidLimit,
          expiresAt: viewLocalTime(credit.oneTimePaidEnd)
        }] 
      : []),

    ...(credit.balanceFree > 0 
      ? [{
          kind: 'free' as const,
          balance: credit.balanceFree,
          limit: credit.totalFreeLimit,
          expiresAt: viewLocalTime(credit.freeEnd)
         }] 
      : [])
  ];

  // 按照项目设置来决定是否带上语言前缀
  const pricingPageBaseUrl = getAsNeededLocalizedUrl(locale, "/pricing",  localPrefixAsNeeded,  defaultLocale);

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
      planName: subscription.priceName || t('subscription.active'),
      periodStart: viewLocalTime(subscription.subPeriodStart),
      periodEnd: viewLocalTime(subscription.subPeriodEnd),
    };
  }

  return (
    <CreditNavButton
      locale={locale}
      totalBalance={totalBalance}
      totalLabel={t('summary.totalLabel')}
    >
      <CreditOverview locale={locale} data={data} />
    </CreditNavButton>
  );
}
