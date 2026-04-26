
import { appConfig } from '@/lib/appConfig';
import { moneyPriceConfig } from '@windrun-huaiin/backend-core/config/money-price';
import { FingerprintStatus } from "@third-ui/clerk/fingerprint";
import { buildMoneyPriceData } from "@third-ui/main/server";
import { cn } from '@windrun-huaiin/lib/utils';
import { PricingClient } from './pricing-client';

export default async function Pricing({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ initialBillingType?: string }>;
}) {
  const isDev = process.env.NODE_ENV !== 'production';
  const forceShow = process.env.SHOW_FINGERPRINT_STATUS === 'true'
  const enableSubscriptionUpgrade = process.env.ENABLE_STRIPE_SUBSCRIPTION_UPGRADE !== 'false';
  const { locale } =  await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { initialBillingType } = resolvedSearchParams;
  console.log(initialBillingType);
  const enabledBillingTypes = ['monthly', 'yearly', 'onetime'];
  const data = await buildMoneyPriceData({
    locale,
    currency: moneyPriceConfig.display.currency,
    enabledBillingTypes,
  });

  return (
    <>
      { (forceShow || isDev) && <FingerprintStatus />}
      <section id="money-pricing" className={cn("px-4 py-4 md:px-16 md:py-8 mx-auto max-w-7xl scroll-mt-10", 'mt-12')}>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
          {data.title}
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-4 text-base md:text-lg mx-auto">
          {data.subtitle}
        </p>
        <PricingClient
          data={data}
          config={moneyPriceConfig}
          checkoutApiEndpoint="/api/stripe/checkout"
          customerPortalApiEndpoint="/api/stripe/customer-portal"
          enableClerkModal={appConfig.style.clerkAuthInModal}
          enabledBillingTypes={enabledBillingTypes}
          enableSubscriptionUpgrade={enableSubscriptionUpgrade}
          initialBillingType={initialBillingType}
        />
      </section>
    </>
  );
}
