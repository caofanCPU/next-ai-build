'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import { GemIcon } from '@windrun-huaiin/base-ui/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@windrun-huaiin/base-ui/ui';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getActiveProviderConfigUtil } from '../money-price/money-price-config-util';
import type { MoneyPriceData, SubscriptionProductConfig } from '../money-price/money-price-types';
import { PricingModal } from '../money-price/pricing-modal';
import type { CreditPricingContext, MobileBillingSwitchBehavior, PricingModalMode } from './types';

interface CreditNavButtonProps {
  locale: string;
  totalBalance: number;
  totalLabel: string;
  mobileBillingSwitchBehavior?: MobileBillingSwitchBehavior;
  children: React.ReactNode;
}

export function CreditNavButton({
  locale,
  totalBalance,
  totalLabel,
  mobileBillingSwitchBehavior,
  children,
}: CreditNavButtonProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const closeMenu = useCallback(() => setOpen(false), []);
  const [pricingModal, setPricingModal] = useState<{
    open: boolean;
    mode: PricingModalMode;
    modalMoneyPriceData?: MoneyPriceData;
    pricingContext?: CreditPricingContext;
  }>({
    open: false,
    mode: 'subscription',
  });

  const formattedBalance = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(totalBalance),
    [locale, totalBalance],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const handleMatchChange = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : mediaQuery.matches);
    };

    handleMatchChange();
    mediaQuery.addEventListener('change', handleMatchChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMatchChange);
    };
  }, []);

  useEffect(() => {
    if (!open || !isMobile) {
      return;
    }

    const shouldIgnoreTarget = (target: Node | null) =>
      (triggerRef.current && target && triggerRef.current.contains(target)) ||
      (contentRef.current && target && contentRef.current.contains(target));

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (shouldIgnoreTarget(target)) {
        return;
      }
      closeMenu();
    };

    const handleTouchStart = (event: TouchEvent) => {
      const target = event.target as Node | null;
      if (shouldIgnoreTarget(target)) {
        return;
      }
      closeMenu();
    };

    const supportsPointer = typeof window !== 'undefined' && 'PointerEvent' in window;
    if (supportsPointer) {
      document.addEventListener('pointerdown', handlePointerDown);
    } else {
      document.addEventListener('touchstart', handleTouchStart);
    }

    return () => {
      if (supportsPointer) {
        document.removeEventListener('pointerdown', handlePointerDown);
      } else {
        document.removeEventListener('touchstart', handleTouchStart);
      }
    };
  }, [open, isMobile, closeMenu]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    if (!open || !isMobile) {
      return;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;

    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open, isMobile]);

  const openPricingModal = useCallback(
    (payload: {
      mode: PricingModalMode;
      modalMoneyPriceData: MoneyPriceData;
      pricingContext: CreditPricingContext;
    }) => {
      setPricingModal({
        open: true,
        mode: payload.mode,
        modalMoneyPriceData: payload.modalMoneyPriceData,
        pricingContext: payload.pricingContext,
      });
    },
    [],
  );

  const closePricingModal = useCallback(() => {
    setPricingModal((prev) => ({
      ...prev,
      open: false,
    }));
  }, []);

  const contextValue = useMemo(
    () => ({
      close: closeMenu,
      isMobile,
      openPricingModal,
      closePricingModal,
    }),
    [closeMenu, isMobile, openPricingModal, closePricingModal],
  );

  const isOnetimeModal = pricingModal.mode === 'onetime';
  const modalInitialBillingType = useMemo(() => {
    if (isOnetimeModal) {
      return 'onetime';
    }

    const pricingContext = pricingModal.pricingContext;
    const priceId = pricingContext?.initUserContext?.xSubscription?.priceId;
    if (!pricingContext || !priceId) {
      return undefined;
    }

    const providerConfig = getActiveProviderConfigUtil(pricingContext.moneyPriceConfig);
    const products: Record<string, SubscriptionProductConfig> =
      providerConfig.subscriptionProducts || providerConfig.products || {};
    for (const product of Object.values(products)) {
      for (const [billingType, plan] of Object.entries(product.plans)) {
        if (plan.priceId === priceId) {
          return billingType;
        }
      }
    }

    return undefined;
  }, [isOnetimeModal, pricingModal.pricingContext]);

  return (
    <CreditNavPopoverContext.Provider value={contextValue}>
      <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`${formattedBalance} ${totalLabel}`}
            className={cn(
              'group relative mx-2 sm:mx-1 inline-flex items-center gap-2 overflow-hidden rounded-full border border-slate-200 bg-white pl-2 pr-4 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
              'hover:-translate-y-0.5 hover:scale-[1.02] hover:border-transparent hover:text-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500',
            )}
            ref={triggerRef}
          >
            <span
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 bg-linear-to-bl from-indigo-200/60 via-indigo-400/90 to-purple-200/50 dark:from-indigo-300/20 dark:via-slate-400 dark:to-slate-500/50"
              aria-hidden="true"
            />
            <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-transform duration-200 group-hover:scale-110 group-hover:bg-white/20 group-hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:group-hover:bg-white/20 dark:group-hover:text-white">
              <GemIcon className="h-3.5 w-3.5" />
            </span>
            <span className="relative z-10 flex items-center">
              <span className="text-base font-semibold leading-none">
                {formattedBalance}
              </span>
              <span className="sr-only">{` ${totalLabel}`}</span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          forceMount
          sideOffset={12}
          align="end"
          className="z-50 border-0 bg-transparent p-0 shadow-none mx-4 sm:mx-2 md:mx-1"
        >
          <div
            className="w-[90vw] max-w-[90vw] max-h-[80vh] overflow-y-auto overflow-x-hidden rounded-3xl bg-transparent sm:w-[410px] sm:max-h-[90vh] sm:max-w-[95vw]"
            ref={contentRef}
          >
            {children}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      {pricingModal.modalMoneyPriceData && pricingModal.pricingContext ? (
        <PricingModal
          open={pricingModal.open}
          onOpenChange={(open) =>
            setPricingModal((prev) => ({
              ...prev,
              open,
            }))
          }
          data={pricingModal.modalMoneyPriceData}
          config={pricingModal.pricingContext.moneyPriceConfig}
          checkoutApiEndpoint={pricingModal.pricingContext.checkoutApiEndpoint}
          customerPortalApiEndpoint={pricingModal.pricingContext.customerPortalApiEndpoint}
          mobileBillingSwitchBehavior={mobileBillingSwitchBehavior}
          enableSubscriptionUpgrade={pricingModal.pricingContext.enableSubscriptionUpgrade}
          billingType={modalInitialBillingType}
          initUserContext={pricingModal.pricingContext.initUserContext}
        />
      ) : null}
    </CreditNavPopoverContext.Provider>
  );
}

interface CreditNavPopoverContextValue {
  close: () => void;
  isMobile: boolean;
  openPricingModal?: (payload: {
    mode: PricingModalMode;
    modalMoneyPriceData: MoneyPriceData;
    pricingContext: CreditPricingContext;
  }) => void;
  closePricingModal?: () => void;
}

const CreditNavPopoverContext = createContext<CreditNavPopoverContextValue | null>(null);

export function useCreditNavPopover() {
  return useContext(CreditNavPopoverContext);
}
