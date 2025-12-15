'use client';

import { useClerk } from '@clerk/nextjs';
import { cn } from '@windrun-huaiin/lib/utils';
import { useRouter } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { MoneyPriceButton } from './money-price-button';
import { getActiveProviderConfigUtil, getProductPricing } from './money-price-config-util';
import {
  UserState,
  type MoneyPriceInteractiveProps,
  type UserContext
} from './money-price-types';
import { redirectToCustomerPortal } from './customer-portal';

type BillingType = string;

interface BillingOption {
  key: string;
  name: string;
  unit: string;
  discountText: string;
  subTitle?: string;
}

const PLAN_KEYS: Array<'F1' | 'P2' | 'U3'> = ['F1', 'P2', 'U3'];

export function MoneyPriceInteractive({
  data,
  config,
  checkoutApiEndpoint,
  customerPortalApiEndpoint,
  enableClerkModal = false,
  enabledBillingTypes,
  enableSubscriptionUpgrade = true,
  initialBillingType,
  disableAutoDetectBilling = false,
  initUserContext,
}: MoneyPriceInteractiveProps) {
  const { redirectToSignIn, redirectToSignUp, user: clerkUser, openSignUp } = useClerk();
  const router = useRouter();

  const providerConfig = useMemo(() => getActiveProviderConfigUtil(config), [config]);
  const billingOptions = useMemo(() => {
    const options = data.billingSwitch.options as BillingOption[];

    // 如果配置了 enabledBillingTypes，只显示配置的类型
    if (enabledBillingTypes?.length) {
      return options.filter(option => enabledBillingTypes.includes(option.key));
    }

    // 否则显示所有配置的选项
    return options;
  }, [data.billingSwitch.options, enabledBillingTypes]);
  const billingOptionMap = useMemo(() => {
    return billingOptions.reduce<Record<string, BillingOption>>((acc, option) => {
      acc[option.key] = option;
      return acc;
    }, {});
  }, [billingOptions]);
  const defaultBilling = useMemo<BillingType>(() => {
    const defaultKey = data.billingSwitch.defaultKey;

    // 如果默认值在可用选项中，使用默认值
    if (billingOptions.some(opt => opt.key === defaultKey)) {
      return defaultKey;
    }

    // 否则使用第一个可用选项
    return billingOptions[0]?.key || 'monthly';
  }, [data.billingSwitch.defaultKey, billingOptions]);

  const resolvedInitialBilling = useMemo<BillingType>(() => {
    if (
      initialBillingType &&
      billingOptions.some(option => option.key === initialBillingType)
    ) {
      return initialBillingType;
    }
    return defaultBilling;
  }, [initialBillingType, billingOptions, defaultBilling]);

  const priceIdsByCycle = useMemo(() => {
    const priceIds: Record<string, string[]> = {};

    // 为每个可用的计费类型创建价格ID数组
    billingOptions.forEach(option => {
      priceIds[option.key] = [];

      if (option.key === 'onetime') {
        // 处理积分包产品
        const creditPacks = providerConfig.creditPackProducts || {};
        Object.values(creditPacks).forEach((pack: any) => {
          priceIds[option.key].push(pack.priceId);
        });
      } else {
        // 处理订阅产品
        const products = providerConfig.subscriptionProducts || providerConfig.products || {};
        PLAN_KEYS.forEach(planKey => {
          const product = (products as any)[planKey];
          if (product && product.plans && product.plans[option.key]) {
            priceIds[option.key].push(product.plans[option.key].priceId);
          }
        });
      }
    });

    return priceIds;
  }, [providerConfig, billingOptions]);

  const serverAuthenticated = !!initUserContext?.isClerkAuthenticated && !!initUserContext?.xUser?.clerkUserId;
  const clientAuthenticated = !!clerkUser?.id;
  const isAuthenticated = serverAuthenticated || clientAuthenticated;
  const subscriptionSnapshot = initUserContext?.isClerkAuthenticated ? initUserContext?.xSubscription : null;

  const detectedBillingType = useMemo<BillingType | null>(() => {
    if (disableAutoDetectBilling) {
      return null;
    }
    if (!subscriptionSnapshot || subscriptionSnapshot.status !== 'active') {
      return null;
    }
    const priceId = subscriptionSnapshot.priceId;
    if (!priceId) {
      return null;
    }
    for (const [cycle, priceIds] of Object.entries(priceIdsByCycle)) {
      if (priceIds.includes(priceId)) {
        return cycle;
      }
    }
    return null;
  }, [
    disableAutoDetectBilling,
    subscriptionSnapshot?.status,
    subscriptionSnapshot?.priceId,
    priceIdsByCycle,
  ]);

  const initialBillingCandidate = useMemo(() => {
    if (initialBillingType) {
      return resolvedInitialBilling;
    }
    if (detectedBillingType) {
      return detectedBillingType;
    }
    return resolvedInitialBilling;
  }, [initialBillingType, resolvedInitialBilling, detectedBillingType]);

  const [billingType, setBillingType] = useState<BillingType>(initialBillingCandidate);
  const navigationLockRef = useRef(false);

  useEffect(() => {
    setBillingType(prev => (prev === initialBillingCandidate ? prev : initialBillingCandidate));
  }, [initialBillingCandidate]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const getUserState = useCallback((): UserState => {
    if (!subscriptionSnapshot || subscriptionSnapshot.status !== 'active') {
      return UserState.FreeUser;
    }

    const userPriceId = subscriptionSnapshot.priceId;
    if (!userPriceId) return UserState.FreeUser;

    const products = providerConfig.subscriptionProducts || providerConfig.products || {};

    const proPlans = (products as any).P2?.plans || {};
    const proIds = Object.values(proPlans).map((plan: any) => plan.priceId);
    if (proIds.includes(userPriceId)) {
      return UserState.ProUser;
    }

    const ultraPlans = (products as any).U3?.plans || {};
    const ultraIds = Object.values(ultraPlans).map((plan: any) => plan.priceId);
    if (ultraIds.includes(userPriceId)) {
      return UserState.UltraUser;
    }

    return UserState.FreeUser;
  }, [subscriptionSnapshot, providerConfig]);

  const userContext = useMemo<UserContext>(() => {
    return {
      isAuthenticated,
      subscriptionStatus: isAuthenticated ? getUserState() : UserState.Anonymous,
      subscriptionType: isAuthenticated ? detectedBillingType ?? undefined : undefined,
      subscriptionEndDate: isAuthenticated ? subscriptionSnapshot?.subPeriodEnd : undefined
    };
  }, [
    isAuthenticated,
    getUserState,
    detectedBillingType,
    subscriptionSnapshot?.subPeriodEnd
  ]);

  const fingerprintId = initUserContext?.fingerprintId ?? null;
  const initUserId = initUserContext?.xUser?.userId ?? null;

  const handleAuth = useCallback(() => {
    if (!enableClerkModal) {
      redirectToSignUp();
      return;
    }

    if (!fingerprintId) {
      console.warn('Not found fingerprintId! NEED CHECK!');
      
    }

    const unsafeMetadata = {
      user_id: initUserId,
      fingerprint_id: fingerprintId,
    };

    openSignUp({ unsafeMetadata });
  }, [enableClerkModal, redirectToSignUp, openSignUp, initUserId, fingerprintId]);

  const handleAction = useCallback(async (plan: string, billing: string) => {
    const isSubscriptionFlow = billing !== 'onetime';

    if (isSubscriptionFlow && !enableSubscriptionUpgrade) {
      return;
    }

    navigationLockRef.current = false;
    setIsProcessing(true);
    const markNavigating = () => {
      navigationLockRef.current = true;
    };

    try {
      const hasActiveSubscription =
        userContext.isAuthenticated &&
        (userContext.subscriptionStatus === UserState.ProUser ||
          userContext.subscriptionStatus === UserState.UltraUser);

      const shouldUsePortal = isSubscriptionFlow && hasActiveSubscription;

      if (shouldUsePortal) {
        const handled = await redirectToCustomerPortal({
          customerPortalApiEndpoint,
          redirectToSignIn,
          returnUrl: window.location.href,
        });
        if (handled) {
          markNavigating();
          return;
        }
      }

      if (!checkoutApiEndpoint) {
        markNavigating();
        router.push('/');
        return;
      }

      const pricing = getProductPricing(
        plan as 'F1' | 'P2' | 'U3',
        billing as BillingType,
        config.activeProvider,
        config
      );

      const response = await fetch(checkoutApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: pricing.priceId,
          plan,
          billingType: billing,
          provider: config.activeProvider
        })
      });

      if (response.redirected || response.status === 302 || response.status === 301) {
        markNavigating();
        window.location.href = response.url;
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Received non-JSON response, user may need to login');
        markNavigating();
        redirectToSignIn();
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || `Request failed with status ${response.status}`;
        console.error('Upgrade request failed:', errorMessage);

        if (response.status === 401 || response.status === 403) {
          markNavigating();
          redirectToSignIn();
        } else {
          alert(`Operation failed: ${errorMessage}`);
        }
        return;
      }

      if (result.success && result.data?.sessionUrl) {
        markNavigating();
        window.location.href = result.data.sessionUrl;
      } else {
        console.error('Failed to create checkout session:', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error during upgrade:', error);
    } finally {
      if (!navigationLockRef.current) {
        setIsProcessing(false);
      }
    }
  }, [
    customerPortalApiEndpoint,
    checkoutApiEndpoint,
    config,
    router,
    redirectToSignIn,
    userContext,
    enableSubscriptionUpgrade
  ]);

  // 根据当前计费类型动态选择要显示的 plans
  const currentPlans = useMemo(() => {
    if (billingType === 'onetime') {
      return data.creditsPlans || [];
    }
    return data.subscriptionPlans || [];
  }, [billingType, data.subscriptionPlans, data.creditsPlans]);

  const maxFeaturesCount = useMemo(() => {
    const featureCounts = currentPlans.map(plan => plan.features?.length || 0);
    return Math.max(config.display.minFeaturesCount || 0, ...featureCounts);
  }, [currentPlans, config.display.minFeaturesCount]);

  const getFeatureRows = useCallback((plan: any) => {
    const features = plan.features || [];
    const filled = [...features];
    while (filled.length < maxFeaturesCount) filled.push(null);
    return filled;
  }, [maxFeaturesCount]);

  const getPricingForPlan = useCallback((planKey: 'F1' | 'P2' | 'U3') => {
    return getProductPricing(
      planKey,
      billingType,
      config.activeProvider,
      config
    );
  }, [billingType, config]);

  const selectedBillingOption = billingOptionMap[billingType];
  const discountBadgeText = useMemo(() => {
    if (!selectedBillingOption?.discountText) return null;

    // 对于 onetime 模式，直接显示 discountText，不依赖 discountPercent
    if (billingType === 'onetime') {
      return selectedBillingOption.discountText;
    }

    // 对于订阅模式，查找 discountPercent 并替换
    let discountPercent: number | null = null;
    const products = providerConfig.subscriptionProducts || providerConfig.products || {};

    PLAN_KEYS.forEach(planKey => {
      const product = (products as any)[planKey];
      if (product?.plans?.[billingType]?.discountPercent) {
        discountPercent = product.plans[billingType].discountPercent;
      }
    });

    if (!discountPercent) return null;
    return selectedBillingOption.discountText.replace('{percent}', String(discountPercent));
  }, [selectedBillingOption, providerConfig, billingType]);

  // 配置移动端BillingTypeButton悬浮样式
  return (
    <>
      <div className="flex justify-center mb-6 max-md:sticky max-md:top-30 max-md:z-30 max-md:py-2 max-md:bg-transparent">
        <div className="inline-flex bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-full px-2 py-2 sm:px-3 sm:py-3 max-md:w-full max-md:max-w-[340px] max-md:mx-auto shadow-sm" data-billing-switch>
          {billingOptions.map(option => {
            const isActive = option.key === billingType;
            const buttonClasses = isActive
              ? 'text-white bg-linear-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600 rounded-full shadow-sm'
              : 'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 rounded-full';
            const showBadge = option.key === billingType && !!discountBadgeText;

            return (
              <div key={option.key} className="relative flex items-center justify-center mx-1">
                {showBadge && (
                  <span className="absolute z-10 left-1/2 -translate-x-1/2 -top-3 sm:-top-4 translate-y-[-50%] px-3 py-0.5  text-[0.625rem] sm:text-xs rounded-md bg-yellow-100 text-yellow-800 font-semibold shadow-sm whitespace-nowrap">
                    {discountBadgeText}
                  </span>
                )}
                <button
                  className={cn(
                    'text-sm md:text-base font-medium transition relative text-center z-10 px-2 sm:px-4 py-2 min-w-[100px] sm:min-w-[120px]',
                    buttonClasses
                  )}
                  type="button"
                  data-billing-button={option.key}
                  onClick={() => setBillingType(option.key as BillingType)}
                >
                  {option.name}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full">
        <div className="flex flex-wrap justify-center gap-5 md:gap-6 xl:gap-8 w-full max-w-6xl mx-auto">
        {currentPlans.map((plan: any) => {
          const planKey = plan.key as 'F1' | 'P2' | 'U3';
          if (!PLAN_KEYS.includes(planKey)) {
            console.warn(`Unknown plan key "${plan.key}" detected in pricing plans`);
            return null;
          }
          const pricing = getPricingForPlan(planKey);

          const showBillingSubtitle = plan.showBillingSubTitle !== false;
          const hasDiscount = !!pricing.discountPercent && !!pricing.originalAmount;

          // 移动端宽度样式
          return (
            <div
              key={plan.key}
              data-price-plan={planKey}
              className={cn(
                'flex flex-col bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-300 dark:border-[#7c3aed40] transition p-5 md:p-8 h-full shadow-sm dark:shadow-none w-[85vw] max-w-[360px]',
                'md:w-[clamp(280px,32vw,360px)] md:max-w-[360px] md:shrink-0',
                'hover:border-2 hover:border-purple-500',
                'focus-within:border-2 focus-within:border-purple-500'
              )}
              style={{ minHeight: maxFeaturesCount * (isTouchDevice ? 86 : 100) }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">{plan.title}</span>
                {plan.titleTags && plan.titleTags.map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 text-xs rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 font-semibold align-middle">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-col items-start w-full" data-price-container={planKey}>
                <div className="flex items-end gap-2">
                  <span className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100" data-price-value={planKey}>
                    {pricing.amount === 0 ? 'Free' : `${data.currency}${pricing.amount}`}
                  </span>
                  {pricing.amount > 0 && (
                    <span className="text-base md:text-lg text-gray-700 dark:text-gray-300 font-medium mb-1" data-price-unit={planKey}>
                      {selectedBillingOption?.unit || '/month'}
                    </span>
                  )}
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-2 min-h-[28px] mt-1">
                  {hasDiscount && (
                    <>
                      <span className="text-sm md:text-base text-gray-400 line-through" data-price-original={planKey}>
                        {data.currency}{pricing.originalAmount}
                      </span>
                      {selectedBillingOption?.discountText && (
                        <span className="px-2 py-0.5 text-[11px] md:text-xs rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 font-semibold align-middle" data-price-discount={planKey}>
                          {selectedBillingOption.discountText.replace('{percent}', String(pricing.discountPercent))}
                        </span>
                      )}
                    </>
                  )}
                  <div
                    className={cn(
                      'flex items-center gap-2 text-[11px] md:text-xs',
                      !showBillingSubtitle && 'opacity-0 select-none'
                    )}
                    data-price-subtitle={planKey}
                  >
                    {showBillingSubtitle && billingType === 'onetime' ? (
                      // OneTime 模式下的特殊处理：普通文本 + 带样式的产品副标题
                      <>
                        {selectedBillingOption?.subTitle && (
                          <span className="text-[11px] md:text-xs text-gray-700 dark:text-gray-300 font-medium">
                            {selectedBillingOption.subTitle}
                          </span>
                        )}
                        {plan.subtitle && (
                          <span className="px-2 py-0.5 text-[11px] md:text-xs rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 font-semibold align-middle">
                            +{plan.subtitle}
                          </span>
                        )}
                      </>
                    ) : (
                      // 其他模式下保持原逻辑
                      showBillingSubtitle && (
                        <span className="text-[11px] md:text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {selectedBillingOption?.subTitle || ''}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <ul className="flex-1 mb-6 mt-4 text-xs md:text-sm leading-5">
                {getFeatureRows(plan).map((feature: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 mb-2 min-h-[24px] md:min-h-[28px]" data-feature-item={`${planKey}-${i}`}>
                    {feature ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 mr-1">
                        {feature.icon ? <span>{feature.icon}</span> : <span className="font-bold">✓</span>}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full mr-1">&nbsp;</span>
                    )}
                    {feature && feature.tag && (
                      <span className="px-1 py-0.5 text-[6px] rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-semibold align-middle">
                        {feature.tag}
                      </span>
                    )}
                    {feature ? (
                      <div className="flex-1 text-gray-800 dark:text-gray-200">
                        <span>{feature.description}</span>
                        {feature.tooltip && (
                          <span className="block text-[11px] text-gray-500 dark:text-gray-400 mt-1">{feature.tooltip}</span>
                        )}
                      </div>
                    ) : (
                      <span>&nbsp;</span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="flex-1" />

              <MoneyPriceButton
                planKey={planKey}
                userContext={userContext}
                billingType={billingType}
                onAuth={handleAuth}
                onAction={handleAction}
                texts={data.buttonTexts}
                isProcessing={isProcessing}
                isInitLoading={false}
                enableSubscriptionUpgrade={enableSubscriptionUpgrade}
              />
            </div>
          );
        })}
        </div>
      </div>
    </>
  );
}
