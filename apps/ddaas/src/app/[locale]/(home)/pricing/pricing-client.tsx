'use client';

import { MoneyPriceInteractive } from '@third-ui/main/money-price';
import type { InitUserContext, MoneyPriceConfig, MoneyPriceData } from '@third-ui/main/money-price';
import { useEffect, useState } from 'react';

interface PricingClientProps {
  data: MoneyPriceData;
  config: MoneyPriceConfig;
  checkoutApiEndpoint: string;
  customerPortalApiEndpoint: string;
  enableClerkModal: boolean;
  enabledBillingTypes: string[];
  enableSubscriptionUpgrade: boolean;
  initialBillingType?: string;
}

export function PricingClient({
  data,
  config,
  checkoutApiEndpoint,
  customerPortalApiEndpoint,
  enableClerkModal,
  enabledBillingTypes,
  enableSubscriptionUpgrade,
  initialBillingType,
}: PricingClientProps) {
  const [initUserContext, setInitUserContext] = useState<InitUserContext>({
    fingerprintId: null,
    xUser: null,
    xCredit: null,
    xSubscription: null,
    isClerkAuthenticated: false,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadPricingContext() {
      try {
        const response = await fetch('/api/user/pricing-context', {
          credentials: 'same-origin',
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const nextContext = (await response.json()) as InitUserContext;
        if (!controller.signal.aborted) {
          setInitUserContext(nextContext);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn('[Pricing] Failed to load user pricing context', error);
        }
      }
    }

    loadPricingContext();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <MoneyPriceInteractive
      data={data}
      config={config}
      checkoutApiEndpoint={checkoutApiEndpoint}
      customerPortalApiEndpoint={customerPortalApiEndpoint}
      enableClerkModal={enableClerkModal}
      enabledBillingTypes={enabledBillingTypes}
      enableSubscriptionUpgrade={enableSubscriptionUpgrade}
      initialBillingType={initialBillingType}
      initUserContext={initUserContext}
    />
  );
}
