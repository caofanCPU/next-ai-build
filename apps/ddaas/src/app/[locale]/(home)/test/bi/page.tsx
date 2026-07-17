import { appConfig } from '@/lib/appConfig';
import { moneyPriceConfig } from '@core/config/money-price';
import { buildMoneyPriceData } from '@third-ui/main/money-price/server';
import { PricingModalPlayground } from './pricing-modal-playground';

export default async function BillingInteractionTestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const enabledBillingTypes = ['monthly', 'yearly', 'onetime'];
  const enableSubscriptionUpgrade = process.env.ENABLE_STRIPE_SUBSCRIPTION_UPGRADE !== 'false';
  const data = await buildMoneyPriceData({
    locale,
    currency: moneyPriceConfig.display.currency,
    enabledBillingTypes,
  });

  return (
    <PricingModalPlayground
      data={data}
      config={moneyPriceConfig}
      enableClerkModal={appConfig.style.clerkAuthInModal}
      enableSubscriptionUpgrade={enableSubscriptionUpgrade}
    />
  );
}
