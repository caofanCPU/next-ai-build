'use client';

import { useClerk } from '@clerk/nextjs';
import { GradientButton } from '@third-ui/fuma/mdx/gradient-button';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { cn } from '@windrun-huaiin/lib/utils';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { redirectToCustomerPortal } from '../money-price/customer-portal';
import type {
  CreditBucket,
  CreditBucketStatus,
  CreditOverviewData,
  CreditActionConfig,
  CreditAuthAction,
  PricingModalMode,
} from './types';
import { useCreditNavPopover } from './credit-nav-button';

type CreditActionKey = 'subscribe' | 'manage' | 'onetime';

export interface CreditOverviewTranslations {
  summaryDescription: string;
  totalLabel: string;
  bucketsTitle: string;
  bucketsEmpty: string;
  expiredAtLabel: string;
  expandDetail: string;
  hiddenDetail: string;
  bucketDefaultLabels: Record<string, string>;
  subscriptionPeriodLabel: string;
  subscriptionManage: string;
  subscriptionInactive: string;
  subscribePay?: string;
  onetimeBuy: string;
}

interface CreditOverviewClientProps {
  data: CreditOverviewData;
  locale: string;
  translations: CreditOverviewTranslations;
  className?: string;
  expiringSoonThresholdDays?: number;
  customActionHandlers?: Record<string, () => Promise<void> | void>;
}

interface NormalizedBucket extends CreditBucket {
  progress: number;
  computedLabel: string;
  computedStatus: CreditBucketStatus;
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

const formatNumber = (locale: string, value: number) =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);


export function CreditOverviewClient({
  data,
  locale,
  translations,
  className,
  expiringSoonThresholdDays = 7,
  customActionHandlers,
}: CreditOverviewClientProps) {
  const { redirectToSignIn } = useClerk();
  const navPopover = useCreditNavPopover();
  const isMobile = navPopover?.isMobile ?? false;
  const [bucketExpanded, setBucketExpanded] = useState(false);
  const userToggledRef = useRef(false);
  const closeNavPopover = useCallback(
    (options?: { defer?: boolean }) => {
      if (!navPopover) {
        return;
      }
      if (options?.defer) {
        if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(() => navPopover.close());
        } else {
          setTimeout(() => navPopover.close(), 0);
        }
        return;
      }
      navPopover.close();
    },
    [navPopover],
  );
  const buckets = useMemo<NormalizedBucket[]>(() => {
    return (data.buckets || []).map((bucket) => {
      const limit = Math.max(bucket.limit, 0);
      const rawProgress =
        typeof bucket.progressPercent === 'number'
          ? bucket.progressPercent
          : limit > 0
            ? (bucket.balance / limit) * 100
            : bucket.balance > 0
              ? 100
              : 0;

      const computedLabel =
        bucket.label ??
        translations.bucketDefaultLabels[bucket.kind] ??
        bucket.kind;

      const computedStatus =
        bucket.status ?? deriveStatus(bucket.expiresAt, expiringSoonThresholdDays);

      return {
        ...bucket,
        progress: clampPercent(rawProgress),
        computedLabel,
        computedStatus,
      };
    });
  }, [data.buckets, translations.bucketDefaultLabels, expiringSoonThresholdDays]);

  const hasBuckets = buckets.length > 0;
  const subscription = data.subscription;
  const pricingContext = data.pricingContext;
  const ctaBehaviors = data.ctaBehaviors;
  const getModalMoneyPriceData = useCallback(
    (mode: PricingModalMode) => {
      if (!pricingContext) {
        return null;
      }

      if (mode !== 'onetime') {
        return pricingContext.moneyPriceData;
      }

      const hasOnetimeOption = pricingContext.moneyPriceData.billingSwitch.options.some(
        (option) => option.key === 'onetime',
      );

      if (!hasOnetimeOption) {
        return pricingContext.moneyPriceData;
      }

      return {
        ...pricingContext.moneyPriceData,
        billingSwitch: {
          ...pricingContext.moneyPriceData.billingSwitch,
          defaultKey: 'onetime',
        },
      };
    },
    [pricingContext],
  );

  const requestPricingModal = useCallback(
    (mode: PricingModalMode) => {
      if (!pricingContext || !navPopover?.openPricingModal) {
        return false;
      }
      const dataForMode = getModalMoneyPriceData(mode);
      if (!dataForMode) {
        return false;
      }

      navPopover.openPricingModal({
        mode,
        modalMoneyPriceData: dataForMode,
        pricingContext,
      });
      return true;
    },
    [getModalMoneyPriceData, navPopover, pricingContext],
  );

  const executeAuthAction = useCallback(
    async (action: CreditAuthAction) => {
      const endpoint = action.endpoint ?? pricingContext?.customerPortalApiEndpoint;
      if (!endpoint) {
        console.warn('[CreditOverview] Auth action requires an endpoint.');
        return false;
      }

      return redirectToCustomerPortal({
        customerPortalApiEndpoint: endpoint,
        redirectToSignIn,
        returnUrl: action.returnUrl,
      });
    },
    [pricingContext, redirectToSignIn],
  );

  const executeConfiguredAction = useCallback(
    async (
      action: CreditActionConfig,
      key: CreditActionKey,
      device: 'desktop' | 'mobile',
    ) => {
      if (device === 'mobile' && action.kind === 'modal') {
        console.warn(
          `[CreditOverview] Mobile device cannot run modal action for "${key}". Adjust configuration.`,
        );
        return false;
      }

      switch (action.kind) {
        case 'modal': {
          const opened = requestPricingModal(action.mode);
          if (opened) {
            closeNavPopover({ defer: true });
          }
          return opened;
        }
        case 'redirect': {
          if (!action.url || action.url === '#') {
            console.warn(`[CreditOverview] Redirect URL missing for action "${key}".`);
            return false;
          }
          window.location.href = action.url;
          closeNavPopover();
          return true;
        }
        case 'auth': {
          const handled = await executeAuthAction(action);
          if (handled) {
            closeNavPopover();
          }
          return handled;
        }
        case 'custom': {
          const handler = customActionHandlers?.[action.handlerKey];
          if (!handler) {
            console.warn(
              `[CreditOverview] Custom action "${action.handlerKey}" missing handler for "${key}".`,
            );
            return false;
          }
          await handler();
          closeNavPopover();
          return true;
        }
        default:
          return false;
      }
    },
    [closeNavPopover, customActionHandlers, executeAuthAction, requestPricingModal],
  );

  const runConfiguredAction = useCallback(
    async (key: CreditActionKey, fallback: () => Promise<void> | void) => {
      const device: 'desktop' | 'mobile' = isMobile ? 'mobile' : 'desktop';
      const deviceAction = ctaBehaviors?.[key]?.[device];

      if (deviceAction) {
        const handled = await executeConfiguredAction(deviceAction, key, device);
        if (handled) {
          return;
        }
        console.warn(
          `[CreditOverview] Configured action "${key}" for ${device} did not complete successfully. Falling back to default behavior.`,
        );
      } else if (ctaBehaviors?.[key]) {
        console.warn(
          `[CreditOverview] Missing ${device} configuration for action "${key}". Falling back to default behavior.`,
        );
      }

      await Promise.resolve(fallback());
    },
    [ctaBehaviors, executeConfiguredAction, isMobile],
  );

  const fallbackSubscribe = useCallback(async () => {
    if (!isMobile) {
      const opened = requestPricingModal('subscription');
      if (opened) {
        closeNavPopover({ defer: true });
        return;
      }
    }

    console.warn(
      `[CreditOverview] Missing subscribe action for ${isMobile ? 'mobile' : 'desktop'} device. Dropdown will simply close.`,
    );
    closeNavPopover();
  }, [closeNavPopover, isMobile, requestPricingModal]);

  const fallbackManage = useCallback(async () => {
    const handled = await redirectToCustomerPortal({
      customerPortalApiEndpoint: pricingContext?.customerPortalApiEndpoint,
      redirectToSignIn,
    });

    if (handled) {
      closeNavPopover();
      return;
    }

    if (!isMobile) {
      const opened = requestPricingModal('subscription');
      if (opened) {
        closeNavPopover({ defer: true });
      }
    }
  }, [
    closeNavPopover,
    isMobile,
    pricingContext,
    redirectToSignIn,
    requestPricingModal,
  ]);

  const fallbackOnetime = useCallback(async () => {
    if (!isMobile) {
      const opened = requestPricingModal('onetime');
      if (opened) {
        closeNavPopover({ defer: true });
        return;
      }
    }

    console.warn(
      `[CreditOverview] Missing onetime action for ${isMobile ? 'mobile' : 'desktop'} device. Dropdown will simply close.`,
    );
    closeNavPopover();
  }, [closeNavPopover, isMobile, requestPricingModal]);

  const handleSubscribeAction = useCallback(async () => {
    if (subscription) {
      return;
    }

    await runConfiguredAction('subscribe', fallbackSubscribe);
  }, [fallbackSubscribe, runConfiguredAction, subscription]);

  const handleManageAction = useCallback(async () => {
    if (!subscription) {
      return;
    }

    await runConfiguredAction('manage', fallbackManage);
  }, [fallbackManage, runConfiguredAction, subscription]);

  const handleOnetimeAction = useCallback(async () => {
    await runConfiguredAction('onetime', fallbackOnetime);
  }, [fallbackOnetime, runConfiguredAction]);

  useLayoutEffect(() => {
    if (userToggledRef.current) {
      return;
    }
    setBucketExpanded(!isMobile);
  }, [isMobile]);

  const toggleBucketExpanded = useCallback(() => {
    userToggledRef.current = true;
    setBucketExpanded((prev) => !prev);
  }, []);

  const expandBuckets = useCallback(() => {
    userToggledRef.current = true;
    setBucketExpanded(true);
  }, []);

  return (
    <section
      className={cn(
        "flex flex-col gap-2 p-2 shadow-inner rounded-xl bg-white dark:bg-slate-900",
        className
      )}
    >
      {/* Primary Card - Total Credits + Subscription */}
      <header className="relative rounded-2xl bg-linear-to-bl from-indigo-200/60 via-indigo-400/90 to-purple-200/50 p-4 shadow-inner dark:from-indigo-300/20 dark:via-slate-400 dark:to-slate-500/50 sm:p-6">
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center justify-start rounded-full ">
            <icons.Gem aria-hidden className="mr-2 h-6 w-6 sm:h-8 sm:w-8" />
            <span className="text-base sm:text-lg">{translations.totalLabel}</span>
          </div>
          <div className="flex justify-center text-3xl font-semibold leading-tight sm:text-4xl">
            {formatNumber(locale, data.totalBalance)}
          </div>
          <div className="flex-1 flex-col gap-1">
            <p className="text-xs text-gray-700 dark:text-slate-100 sm:text-sm">
              {translations.subscriptionPeriodLabel}
            </p>
            <h4 className="text-xl font-semibold sm:text-2xl">
              {subscription ? subscription.planName : translations.subscriptionInactive}
            </h4>
          </div>
          <div className="pt-2 sm:pt-0">
            <GradientButton
              title={subscription ? translations.subscriptionManage : translations.subscribePay}
              align="center"
              icon={subscription ? <icons.Settings2 /> : <icons.Bell />}
              openInNewTab={false}
              className="w-full"
              onClick={subscription ? handleManageAction : handleSubscribeAction}
            />
          </div>
        </div>
        <div className="absolute right-3 top-3 sm:right-6 sm:top-6">
          <HoverInfo
            label={translations.totalLabel}
            description={translations.summaryDescription}
          />
        </div>
      </header>

      {/* Credit Details Section */}
      <section className="relative flex flex-col gap-3 rounded-2xl border p-4 shadow-inner sm:gap-2 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base text-gray-500 dark:text-slate-100 sm:text-lg">
            {translations.bucketsTitle}
          </h3>
          {hasBuckets ? (
            <button
              type="button"
              aria-expanded={bucketExpanded}
              aria-label={bucketExpanded ? translations.hiddenDetail : translations.expandDetail}
              onClick={toggleBucketExpanded}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-transparent bg-white text-purple-600 shadow-[0_6px_20px_rgba(99,102,241,0.25)] transition-colors hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500 dark:bg-[#1b1541] dark:text-purple-100 dark:hover:text-purple-50 dark:shadow-[0_6px_22px_rgba(112,86,255,0.35)]"
            >
              {bucketExpanded ? (
                <icons.ChevronUp className="h-4 w-4" />
              ) : (
                <icons.ChevronDown className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>
        {hasBuckets ? (
          bucketExpanded ? (
            <ul className="flex flex-col gap-2">
              {buckets.map((bucket) => {
                const balanceDisplay = formatNumber(locale, bucket.balance);
                return (
                  <li
                    key={bucket.kind}
                    data-credit-kind={bucket.kind}
                    className="rounded-2xl border border-slate-200/70 bg-white/85 px-3 py-3 text-sm shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/60 sm:px-4"
                  >
                    <div className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs sm:text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="max-w-full truncate rounded-full bg-purple-50 px-2 py-1 text-xs text-purple-600 shadow-sm dark:bg-purple-500/20 dark:text-purple-100 sm:text-sm">
                          {bucket.computedLabel}
                        </span>
                      </span>
                      <span className="flex min-w-0 justify-end">
                        <span
                          className="text-right text-base font-semibold leading-tight text-gray-500 dark:text-slate-100 sm:text-lg"
                          title={balanceDisplay}
                        >
                          {balanceDisplay}
                        </span>
                      </span>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <span className="text-[11px] text-gray-500 dark:text-slate-100 sm:text-xs">
                      {translations.expiredAtLabel}: {bucket.expiresAt}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <button
              type="button"
              onClick={expandBuckets}
              
              className="w-full rounded-2xl border border-slate-200/70 bg-white/85 p-6 sm:px-4 text-sm shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/60 hover:text-purple-500"
            >
              {translations.expandDetail}
            </button>
          )
        ) : (
          <div className="w-full rounded-2xl border border-slate-200/70 bg-white/85 p-6 sm:px-4 text-sm shadow-sm transition-transform dark:border-slate-800/60 dark:bg-slate-900/60 text-center">
            {translations.bucketsEmpty}
          </div>
        )}
        <GradientButton
          title={translations.onetimeBuy}
          icon={<icons.ShoppingCart />}
          align="center"
          className="w-full text-sm sm:text-base"
          onClick={handleOnetimeAction}
        />
      </section>
    </section>
  );
}

function deriveStatus(
  expiresAt?: string,
  thresholdDays = 7,
): CreditBucketStatus {
  if (!expiresAt) {
    return 'active';
  }

  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) {
    return 'active';
  }

  const diff = differenceInDays(expires, new Date());
  if (diff < 0) {
    return 'expired';
  }
  if (diff <= thresholdDays) {
    return 'expiringSoon';
  }
  return 'active';
}

function differenceInDays(later: Date, earlier: Date): number {
  const msInDay = 86_400_000;
  return Math.floor((later.getTime() - earlier.getTime()) / msInDay);
}

interface HoverInfoProps {
  label?: string;
  description?: string;
  variant?: 'default' | 'muted';
}

function HoverInfo({ description, variant = 'default' }: HoverInfoProps) {
  if (!description) {
    return null;
  }

  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        aria-label={description}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500',
          variant === 'muted'
            ? 'border-transparent bg-slate-100 text-slate-500 hover:text-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:text-slate-100'
            : 'border-transparent bg-white text-purple-600 shadow-[0_6px_20px_rgba(99,102,241,0.25)] hover:text-purple-700 dark:bg-[#1b1541] dark:text-purple-100 dark:hover:text-purple-50 dark:shadow-[0_6px_22px_rgba(112,86,255,0.35)]',
        )}
      >
        <icons.CircleQuestionMark className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full right-full z-50 mt-3 w-max max-w-[260px] translate-x-4 rounded-xl border border-slate-200/70 bg-slate-900/95 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-xl ring-1 ring-black/30 transition-all duration-150 ease-out group-hover:-translate-y-1 group-hover:opacity-100 group-focus-within:-translate-y-1 group-focus-within:opacity-100 dark:border-slate-700/60 dark:bg-slate-800/95"
      >
        <span className="mt-1 block text-white dark:text-slate-100">
          {description}
        </span>
      </span>
    </span>
  );
}
