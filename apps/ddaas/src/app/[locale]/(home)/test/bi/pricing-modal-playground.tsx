'use client';

import {
  PricingModalProvider,
  usePricingModal,
  type MoneyPriceConfig,
  type MoneyPriceData,
} from '@third-ui/main/money-price';

interface PricingModalPlaygroundProps {
  data: MoneyPriceData;
  config: MoneyPriceConfig;
  enableClerkModal: boolean;
  enableSubscriptionUpgrade: boolean;
}

interface ProviderConfig {
  id: string;
  title: string;
  description: string;
  enabledBillingTypes: string[];
  mobileBillingSwitchBehavior?: 'sticky' | 'static';
  buttons: Array<{
    label: string;
    billingType: string;
  }>;
}

const providerConfigs: ProviderConfig[] = [
  {
    id: 'all',
    title: 'Shared Provider',
    description: 'One provider wraps multiple controls. Mobile billing switch uses the default static behavior.',
    enabledBillingTypes: ['monthly', 'yearly', 'onetime'],
    buttons: [
      { label: 'Monthly', billingType: 'monthly' },
      { label: 'Yearly', billingType: 'yearly' },
      { label: 'One-time', billingType: 'onetime' },
    ],
  },
  {
    id: 'all-sticky',
    title: 'Shared Provider Sticky Mobile Switch',
    description: 'All billing types are available, and the mobile billing switch sticks while scrolling.',
    enabledBillingTypes: ['monthly', 'yearly', 'onetime'],
    mobileBillingSwitchBehavior: 'sticky',
    buttons: [
      { label: 'Monthly', billingType: 'monthly' },
      { label: 'Yearly', billingType: 'yearly' },
      { label: 'One-time', billingType: 'onetime' },
    ],
  },
  {
    id: 'onetime',
    title: 'One-time Only',
    description: 'Only the one-time tab is available. Unsupported requests fall back to one-time.',
    enabledBillingTypes: ['onetime'],
    buttons: [
      { label: 'Open one-time', billingType: 'onetime' },
      { label: 'Ask yearly', billingType: 'yearly' },
    ],
  },
  {
    id: 'subscription',
    title: 'Subscription Only',
    description: 'Only subscription billing types are available.',
    enabledBillingTypes: ['monthly', 'yearly'],
    buttons: [
      { label: 'Monthly', billingType: 'monthly' },
      { label: 'Yearly', billingType: 'yearly' },
      { label: 'Ask one-time', billingType: 'onetime' },
    ],
  },
];

const pageClass =
  'mx-auto mt-12 flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6';
const panelClass =
  'rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80';
const buttonClass =
  'inline-flex h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-purple-400 hover:text-purple-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-purple-400 dark:hover:text-purple-200';

function BillingButtons({
  buttons,
}: {
  buttons: ProviderConfig['buttons'];
}) {
  const { openPricingModal } = usePricingModal();

  return (
    <div className="flex flex-wrap gap-3">
      {buttons.map((button) => (
        <button
          key={`${button.label}-${button.billingType}`}
          type="button"
          className={buttonClass}
          onClick={() => openPricingModal({ billingType: button.billingType })}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}

function ProviderPanel({
  provider,
  data,
  config,
  enableClerkModal,
  enableSubscriptionUpgrade,
}: {
  provider: ProviderConfig;
} & PricingModalPlaygroundProps) {
  return (
    <PricingModalProvider
      data={data}
      config={config}
      checkoutApiEndpoint="/api/stripe/checkout"
      customerPortalApiEndpoint="/api/stripe/customer-portal"
      enableClerkModal={enableClerkModal}
      enabledBillingTypes={provider.enabledBillingTypes}
      mobileBillingSwitchBehavior={provider.mobileBillingSwitchBehavior}
      enableSubscriptionUpgrade={enableSubscriptionUpgrade}
      pricingContextEndpoint="/api/user/pricing-context"
    >
      <section className={panelClass}>
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
            {provider.title}
          </h2>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            {provider.description}
          </p>
          <code className="mt-2 w-fit rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            enabledBillingTypes=[{provider.enabledBillingTypes.join(', ')}]
          </code>
          <code className="mt-1 w-fit rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            mobileBillingSwitchBehavior={provider.mobileBillingSwitchBehavior ?? 'static'}
          </code>
        </div>
        <BillingButtons buttons={provider.buttons} />
      </section>
    </PricingModalProvider>
  );
}

function NestedProviderDemo({
  data,
  config,
  enableClerkModal,
  enableSubscriptionUpgrade,
}: PricingModalPlaygroundProps) {
  return (
    <PricingModalProvider
      data={data}
      config={config}
      checkoutApiEndpoint="/api/stripe/checkout"
      customerPortalApiEndpoint="/api/stripe/customer-portal"
      enableClerkModal={enableClerkModal}
      enabledBillingTypes={['onetime']}
      enableSubscriptionUpgrade={enableSubscriptionUpgrade}
      pricingContextEndpoint="/api/user/pricing-context"
    >
      <section className={panelClass}>
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
            Nested Providers
          </h2>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            The outer area is one-time only. The inner area overrides it with subscription-only config.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
              Outer provider
            </h3>
            <BillingButtons
              buttons={[
                { label: 'Open one-time', billingType: 'onetime' },
                { label: 'Ask monthly', billingType: 'monthly' },
              ]}
            />
          </div>
          <PricingModalProvider
            data={data}
            config={config}
            checkoutApiEndpoint="/api/stripe/checkout"
            customerPortalApiEndpoint="/api/stripe/customer-portal"
            enableClerkModal={enableClerkModal}
            enabledBillingTypes={['monthly', 'yearly']}
            mobileBillingSwitchBehavior="static"
            enableSubscriptionUpgrade={enableSubscriptionUpgrade}
            pricingContextEndpoint="/api/user/pricing-context"
          >
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                Inner provider
              </h3>
              <BillingButtons
                buttons={[
                  { label: 'Open monthly', billingType: 'monthly' },
                  { label: 'Open yearly', billingType: 'yearly' },
                  { label: 'Ask one-time', billingType: 'onetime' },
                ]}
              />
            </div>
          </PricingModalProvider>
        </div>
      </section>
    </PricingModalProvider>
  );
}

export function PricingModalPlayground(props: PricingModalPlaygroundProps) {
  return (
    <main className={pageClass}>
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 md:text-3xl">
          Billing Modal Test
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Test local pricing modal providers with different enabled billing type configurations.
        </p>
      </header>

      <ProviderPanel provider={providerConfigs[0]} {...props} />

      <div className="grid gap-6 lg:grid-cols-2">
        {providerConfigs.slice(1).map((provider) => (
          <ProviderPanel key={provider.id} provider={provider} {...props} />
        ))}
      </div>

      <NestedProviderDemo {...props} />
    </main>
  );
}
