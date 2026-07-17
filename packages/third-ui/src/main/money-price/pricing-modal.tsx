'use client';

import { XIcon } from '@windrun-huaiin/base-ui/icons';
import { themeMainBgColor } from '@windrun-huaiin/base-ui/lib';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@windrun-huaiin/base-ui/ui';
import { cn } from '@windrun-huaiin/lib/utils';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { dialogThemedOverlayClass } from '../alert-dialog/dialog-styles';
import { MoneyPriceInteractive } from './money-price-interactive';
import type {
  InitUserContext,
  MoneyPriceConfig,
  MoneyPriceData,
} from './money-price-types';

export interface OpenPricingModalOptions {
  billingType?: string;
}

export interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: MoneyPriceData;
  config: MoneyPriceConfig;
  billingType?: string;
  checkoutApiEndpoint?: string;
  customerPortalApiEndpoint?: string;
  enableClerkModal?: boolean;
  enabledBillingTypes?: string[];
  mobileBillingSwitchBehavior?: 'sticky' | 'static';
  enableSubscriptionUpgrade?: boolean;
  initUserContext?: InitUserContext;
  isInitLoading?: boolean;
}

export interface PricingModalProviderProps
  extends Omit<PricingModalProps, 'open' | 'onOpenChange' | 'billingType'> {
  children: ReactNode;
  pricingContextEndpoint?: string;
}

interface PricingModalContextValue {
  openPricingModal: (options?: OpenPricingModalOptions) => void;
  closePricingModal: () => void;
  isPricingModalOpen: boolean;
}

const emptyInitUserContext: InitUserContext = {
  fingerprintId: null,
  xUser: null,
  xCredit: null,
  xSubscription: null,
  isClerkAuthenticated: false,
};

const PricingModalContext = createContext<PricingModalContextValue | null>(null);

function normalizeEnabledBillingTypes(
  data: MoneyPriceData,
  enabledBillingTypes: string[] | undefined,
) {
  const availableKeys = data.billingSwitch.options.map((option) => option.key);
  const configuredKeys = enabledBillingTypes?.length ? enabledBillingTypes : availableKeys;

  return Array.from(
    new Set(
      configuredKeys
        .map((billingType) => billingType.trim())
        .filter((billingType) => availableKeys.includes(billingType)),
    ),
  );
}

function resolveBillingType({
  data,
  enabledBillingTypes,
  requestedBillingType,
}: {
  data: MoneyPriceData;
  enabledBillingTypes?: string[];
  requestedBillingType?: string;
}) {
  const enabledKeys = normalizeEnabledBillingTypes(data, enabledBillingTypes);

  if (requestedBillingType && enabledKeys.includes(requestedBillingType)) {
    return requestedBillingType;
  }

  if (enabledKeys.includes(data.billingSwitch.defaultKey)) {
    return data.billingSwitch.defaultKey;
  }

  return enabledKeys[0] ?? data.billingSwitch.options[0]?.key;
}

export function PricingModal({
  open,
  onOpenChange,
  data,
  config,
  billingType,
  checkoutApiEndpoint,
  customerPortalApiEndpoint,
  enableClerkModal = false,
  enabledBillingTypes,
  mobileBillingSwitchBehavior,
  enableSubscriptionUpgrade = true,
  initUserContext,
  isInitLoading = false,
}: PricingModalProps) {
  const resolvedBillingType = useMemo(
    () =>
      resolveBillingType({
        data,
        enabledBillingTypes,
        requestedBillingType: billingType,
      }),
    [billingType, data, enabledBillingTypes],
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <AlertDialogContent
          className={cn(
            'mt-5 sm:mt-6 md:mt-10 lg:mt-15 w-[95vw] max-w-[1200px] overflow-hidden border border-slate-200 p-0 shadow-[0_32px_90px_rgba(15,23,42,0.25)] ring-1 ring-black/5 dark:border-white/12 dark:shadow-[0_40px_120px_rgba(0,0,0,0.6)] dark:ring-white/10',
            themeMainBgColor,
          )}
          overlayClassName={dialogThemedOverlayClass}
        >
          <AlertDialogHeader className="flex flex-row items-center justify-between border-b border-slate-200 px-6 pt-4 pb-1 dark:border-slate-800">
            <AlertDialogTitle asChild>
              <div className="flex flex-wrap items-baseline gap-3 text-slate-900 dark:text-white">
                <span className="text-2xl font-semibold leading-tight">
                  {data.title}
                </span>
                {data.subtitle ? (
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-300">
                    {data.subtitle}
                  </span>
                ) : null}
              </div>
            </AlertDialogTitle>
            <button
              type="button"
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-400 hover:text-gray-400 dark:text-white/80 dark:hover:bg-white/80 dark:hover:text-white/80"
              onClick={() => onOpenChange(false)}
            >
              <XIcon className="h-6 w-6" />
            </button>
          </AlertDialogHeader>
          <div className="max-h-[60vh] overflow-y-auto px-4 pt-2 pb-6 sm:max-h-[80vh]">
            <div className="mx-auto w-full">
              <MoneyPriceInteractive
                key={resolvedBillingType ?? 'default'}
                data={data}
                config={config}
                checkoutApiEndpoint={checkoutApiEndpoint}
                customerPortalApiEndpoint={customerPortalApiEndpoint}
                enableClerkModal={enableClerkModal}
                enabledBillingTypes={enabledBillingTypes}
                mobileBillingSwitchBehavior={mobileBillingSwitchBehavior}
                enableSubscriptionUpgrade={enableSubscriptionUpgrade}
                initialBillingType={resolvedBillingType}
                disableAutoDetectBilling={resolvedBillingType === 'onetime'}
                initUserContext={initUserContext}
                isInitLoading={isInitLoading}
              />
            </div>
          </div>
        </AlertDialogContent>
      ) : null}
    </AlertDialog>
  );
}

export function PricingModalProvider({
  children,
  pricingContextEndpoint,
  initUserContext: initUserContextProp,
  isInitLoading: isInitLoadingProp = false,
  ...modalProps
}: PricingModalProviderProps) {
  const [open, setOpen] = useState(false);
  const [requestedBillingType, setRequestedBillingType] = useState<string | undefined>();
  const [loadedInitUserContext, setLoadedInitUserContext] = useState<InitUserContext>(
    initUserContextProp ?? emptyInitUserContext,
  );
  const [isContextLoading, setIsContextLoading] = useState(false);
  const loadedContextRef = useRef(!!initUserContextProp);

  useEffect(() => {
    if (initUserContextProp) {
      loadedContextRef.current = true;
      setLoadedInitUserContext(initUserContextProp);
    }
  }, [initUserContextProp]);

  const loadPricingContext = useCallback(async () => {
    if (!pricingContextEndpoint || loadedContextRef.current) {
      return;
    }

    setIsContextLoading(true);
    try {
      const response = await fetch(pricingContextEndpoint, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        return;
      }

      const nextContext = (await response.json()) as InitUserContext;
      loadedContextRef.current = true;
      setLoadedInitUserContext(nextContext);
    } catch (error) {
      console.warn('[PricingModalProvider] Failed to load pricing context', error);
    } finally {
      setIsContextLoading(false);
    }
  }, [pricingContextEndpoint]);

  const openPricingModal = useCallback(
    (options?: OpenPricingModalOptions) => {
      setRequestedBillingType(options?.billingType);
      setOpen(true);
      void loadPricingContext();
    },
    [loadPricingContext],
  );

  const closePricingModal = useCallback(() => {
    setOpen(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      openPricingModal,
      closePricingModal,
      isPricingModalOpen: open,
    }),
    [closePricingModal, open, openPricingModal],
  );

  return (
    <PricingModalContext.Provider value={contextValue}>
      {children}
      <PricingModal
        {...modalProps}
        open={open}
        onOpenChange={setOpen}
        billingType={requestedBillingType}
        initUserContext={initUserContextProp ?? loadedInitUserContext}
        isInitLoading={isInitLoadingProp || isContextLoading}
      />
    </PricingModalContext.Provider>
  );
}

export function usePricingModal() {
  const context = useContext(PricingModalContext);

  if (!context) {
    throw new Error('usePricingModal must be used within PricingModalProvider.');
  }

  return context;
}
