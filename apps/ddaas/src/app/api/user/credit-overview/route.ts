import { defaultLocale, localePrefixAsNeeded } from '@/lib/appConfig';
import { createGET } from '@core/app/api/user/credit-overview/route';
import type { CreditOverviewTranslations } from '@third-ui/main/credit';
import { getTranslations } from 'next-intl/server';

export const GET = createGET({
  defaultLocale,
  localePrefixAsNeeded,
  async resolveTranslations(locale) {
    const t = await getTranslations({ locale, namespace: 'credit' });

    return {
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
    } satisfies CreditOverviewTranslations;
  },
});
