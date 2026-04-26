
import { appConfig } from '@/lib/appConfig';
import { moneyPriceConfig } from '@windrun-huaiin/backend-core/config/money-price';
import { getMoneyPriceInitUserContext } from '@windrun-huaiin/backend-core/pricing/server';
import { FingerprintStatus } from "@third-ui/clerk/fingerprint";
import { MoneyPrice } from "@third-ui/main/server";

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
  const initUserContext = await getMoneyPriceInitUserContext();
  return (
    <>
      { (forceShow || isDev) && <FingerprintStatus />}
      <MoneyPrice
        locale={locale}
        config={moneyPriceConfig}
        checkoutApiEndpoint="/api/stripe/checkout"
        customerPortalApiEndpoint="/api/stripe/customer-portal"
        enableClerkModal={appConfig.style.clerkAuthInModal}
        enabledBillingTypes={['monthly', 'yearly', 'onetime']}
        enableSubscriptionUpgrade={enableSubscriptionUpgrade}
        initUserContext={initUserContext}
        sectionClassName='mt-12'
        initialBillingType={initialBillingType}
      />
    </>
  );
}
