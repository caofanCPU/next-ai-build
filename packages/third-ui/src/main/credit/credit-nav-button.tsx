'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
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
import { MoneyPriceInteractive } from '../money-price/money-price-interactive';
import type { MoneyPriceData } from '../money-price/money-price-types';
import type { CreditPricingContext, PricingModalMode } from './types';

interface CreditNavButtonProps {
  locale: string;
  totalBalance: number;
  totalLabel: string;
  children: React.ReactNode;
}

export function CreditNavButton({
  locale,
  totalBalance,
  totalLabel,
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
              <icons.Gem className="h-3.5 w-3.5" />
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
        <AlertDialog
          open={pricingModal.open}
          onOpenChange={(open) =>
            setPricingModal((prev) => ({
              ...prev,
              open,
            }))
          }
        >
          <AlertDialogContent className="mt-5 sm:mt-6 md:mt-10 lg:mt-15 w-[95vw] max-w-[1200px] overflow-hidden border border-slate-200 bg-white p-0 shadow-[0_32px_90px_rgba(15,23,42,0.25)] ring-1 ring-black/5 dark:border-white/12 dark:bg-[#0f1222] dark:shadow-[0_40px_120px_rgba(0,0,0,0.6)] dark:ring-white/10">
            <AlertDialogHeader className="flex flex-row items-center justify-between border-b border-slate-200 px-6 pt-4 pb-1 dark:border-slate-800">
              <AlertDialogTitle asChild>
                <div className="flex flex-wrap items-baseline gap-3 text-slate-900 dark:text-white">
                  <span className="text-2xl font-semibold leading-tight">
                    {pricingModal.modalMoneyPriceData.title}
                  </span>
                  {pricingModal.modalMoneyPriceData.subtitle ? (
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-300">
                      {pricingModal.modalMoneyPriceData.subtitle}
                    </span>
                  ) : null}
                </div>
              </AlertDialogTitle>
              <button
                type="button"
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-400 hover:text-gray-400 dark:text-white/80 dark:hover:bg-white/80 dark:hover:text-white/80"
                onClick={closePricingModal}
              >
                <icons.X className="h-6 w-6" />
              </button>
            </AlertDialogHeader>
            <div className="max-h-[60vh] sm:max-h-[80vh] overflow-y-auto px-4 pt-2 pb-6">
              <div className="mx-auto w-full">
                <MoneyPriceInteractive
                  key={pricingModal.mode}
                  data={pricingModal.modalMoneyPriceData}
                  config={pricingModal.pricingContext.moneyPriceConfig}
                  checkoutApiEndpoint={pricingModal.pricingContext.checkoutApiEndpoint}
                  customerPortalApiEndpoint={pricingModal.pricingContext.customerPortalApiEndpoint}
                  enableSubscriptionUpgrade={pricingModal.pricingContext.enableSubscriptionUpgrade}
                  initialBillingType={isOnetimeModal ? 'onetime' : undefined}
                  disableAutoDetectBilling={isOnetimeModal}
                  initUserContext={pricingModal.pricingContext.initUserContext}
                />
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>
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
