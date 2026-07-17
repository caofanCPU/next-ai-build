import { cn } from '@windrun-huaiin/lib/utils';
import { MoneyPriceInteractive } from './money-price-interactive';
import type { MoneyPriceProps } from './money-price-types';
import { buildMoneyPriceData } from './money-price-data';

export async function MoneyPrice({
  locale,
  config,
  checkoutApiEndpoint,
  customerPortalApiEndpoint,
  enableClerkModal = false,
  sectionClassName,
  enabledBillingTypes,
  mobileBillingSwitchBehavior,
  enableSubscriptionUpgrade = true,
  initUserContext,
  initialBillingType,
}: MoneyPriceProps) {
  const data = await buildMoneyPriceData({
    locale,
    currency: config.display.currency,
    enabledBillingTypes,
  });

  return (
    <section id="money-pricing" className={cn("px-4 py-4 md:px-16 md:py-8 mx-auto max-w-7xl scroll-mt-10", sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
        {data.title}
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-4 text-base md:text-lg mx-auto">
        {data.subtitle}
      </p>
      <MoneyPriceInteractive
        data={data}
        config={config}
        checkoutApiEndpoint={checkoutApiEndpoint}
        customerPortalApiEndpoint={customerPortalApiEndpoint}
        enableClerkModal={enableClerkModal}
        enabledBillingTypes={enabledBillingTypes}
        mobileBillingSwitchBehavior={mobileBillingSwitchBehavior}
        enableSubscriptionUpgrade={enableSubscriptionUpgrade}
        initUserContext={initUserContext}
        initialBillingType={initialBillingType}
      />
    </section>
  );
}
