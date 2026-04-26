'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import { themeButtonGradientClass, themeButtonGradientHoverClass } from '@windrun-huaiin/base-ui/lib';
import { UserState, type MoneyPriceButtonProps } from './money-price-types';
import React, { useState } from 'react';


export function MoneyPriceButton({
  planKey,
  userContext,
  billingType,
  onAuth,
  onAction,
  texts,
  isProcessing = false,
  isAnyProcessing = false,
  isInitLoading = false,
  enableSubscriptionUpgrade = true
}: MoneyPriceButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (isInitLoading) {
    return (
      <div
        className="w-full h-11 md:h-12 mt-4 md:mt-auto rounded-full bg-gray-200/80 dark:bg-gray-700/50 animate-pulse"
        aria-hidden="true"
        data-plan-button-placeholder={planKey}
      />
    );
  }

  const { isAuthenticated, subscriptionStatus } = userContext;
  const subscriptionBilling = userContext.subscriptionType;
  const planTier = planKey;
  const planBilling = billingType;

  const getPlanRank = (tier: 'F1' | 'P2' | 'U3', billing: string) => {
    if (tier === 'F1') return 0;
    if (tier === 'P2') return billing === 'monthly' ? 1 : 3;
    if (tier === 'U3') return billing === 'monthly' ? 2 : 4;
    return 0;
  };

  // OneTime 模式的按钮配置
  const getOnetimeButtonConfig = () => {
    // 匿名用户：所有卡片都显示登录按钮
    if (!isAuthenticated) {
      return {
        text: texts.getStarted,
        onClick: onAuth,
        disabled: false,
        hidden: false
      };
    }

    if (subscriptionStatus === UserState.Anonymous) {
        // 已登录但状态未知 → 视为 FreeUser
        console.warn('Clerk is authed OK but user is anonymous!');
        return { text: '', disabled: true, hidden: true };
    }

    // 登录用户：OneTime 模式下所有卡片都显示购买积分按钮
    return {
      text: texts.buyCredits || texts.upgrade,
      onClick: () => onAction(planKey, billingType),
      disabled: false,
      hidden: false
    };
  };

  // 订阅模式的按钮配置
  const getSubscriptionButtonConfig = () => {
    // 匿名用户
    if (!isAuthenticated) {
      const getButtonText = () => {
        switch (planKey) {
          case 'F1':
            return texts.getStarted;
          case 'P2':
            return texts.getPro;
          case 'U3':
            return texts.getUltra;
          default:
            return texts.getStarted;
        }
      };

      return {
        text: getButtonText(),
        onClick: onAuth,
        disabled: false,
        hidden: false
      };
    }

    // 已登录用户
    switch (subscriptionStatus) {
      case UserState.FreeUser: {
        if (planTier === 'F1') {
          return {
            text: texts.currentPlan,
            disabled: true,
            hidden: false
          };
        }
        return {
          text: texts.upgrade,
          onClick: () => onAction(planTier, planBilling),
          disabled: false,
          hidden: false
        };
      }

      case UserState.ProUser: {
        // 不允许降级到 Free
        if (planTier === 'F1') {
          return { hidden: true };
        }

        const currentBilling = subscriptionBilling === 'yearly' ? 'yearly' : 'monthly';
        const currentRank = getPlanRank('P2', currentBilling);

        if (planTier === 'P2') {
          const targetRank = getPlanRank('P2', planBilling);

          if (planBilling === currentBilling) {
            return {
              text: texts.currentPlan,
              disabled: true,
              hidden: false
            };
          }

          if (targetRank > currentRank) {
            return {
              text: texts.upgrade,
              onClick: () => onAction('P2', planBilling),
              disabled: false,
              hidden: false
            };
          }

          return { hidden: true };
        }

        if (planTier === 'U3') {
          const targetRank = getPlanRank('U3', planBilling);
          if (targetRank > currentRank) {
            return {
              text: texts.upgrade,
              onClick: () => onAction('U3', planBilling),
              disabled: false,
              hidden: false
            };
          }

          return { hidden: true };
        }
        
        return { hidden: true };
      }

      case UserState.UltraUser: {
        const currentBilling = subscriptionBilling === 'yearly' ? 'yearly' : 'monthly';
        const currentRank = getPlanRank('U3', currentBilling);

        if (planTier === 'F1') {
          return { hidden: true };
        }

        if (planTier === 'P2') {
          const targetRank = getPlanRank('P2', planBilling);
          if (targetRank > currentRank) {
            return {
              text: texts.upgrade,
              onClick: () => onAction('P2', planBilling),
              disabled: false,
              hidden: false
            };
          }
          return { hidden: true };
        }

        if (planTier === 'U3') {
          const targetRank = getPlanRank('U3', planBilling);

          if (planBilling === currentBilling) {
            return {
              text: texts.currentPlan,
              disabled: true,
              hidden: false
            };
          }

          if (targetRank > currentRank) {
            return {
              text: texts.upgrade,
              onClick: () => onAction('U3', planBilling),
              disabled: false,
              hidden: false
            };
          }
        }

        return { hidden: true };
      }

      default:
        // 已登录但状态未知 → 视为 FreeUser
        console.warn('Clerk is authed OK but user is anonymous!');
        return { text: '', disabled: true, hidden: true };
    }
  };

  // 主要的按钮配置函数
  const getButtonConfig = () => {
    if (billingType === 'onetime') {
      return getOnetimeButtonConfig();
    }
    return getSubscriptionButtonConfig();
  };

  const config = getButtonConfig();
  
  if (config.hidden) return null;

  const hasActiveSubscription =
    subscriptionStatus === UserState.ProUser ||
    subscriptionStatus === UserState.UltraUser;

  if (
    !enableSubscriptionUpgrade &&
    billingType !== 'onetime' &&
    hasActiveSubscription &&
    config.text === texts.upgrade &&
    typeof config.onClick === 'function'
  ) {
    return null;
  }

  const isCurrentButtonBusy = isLoading || isProcessing;
  const isDisabled = config.disabled || isCurrentButtonBusy || isAnyProcessing;
  const displayText = isCurrentButtonBusy ? 'Processing...' : config.text;
  const isDisabledByConfigOnly = config.disabled && !isCurrentButtonBusy && !isAnyProcessing;

  const handleClick = async (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }

    if (config.onClick) {
      e.preventDefault();
      setIsLoading(true);
      
      try {
        const result = config.onClick();
        // Handle both sync and async functions
        await Promise.resolve(result);
      } catch (error) {
        console.error('MoneyPriceButton onClick error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const buttonClassName = cn(
    'w-full h-11 md:h-12 px-5 md:px-8 mt-4 md:mt-auto inline-flex items-center justify-center text-white text-sm md:text-base font-bold tracking-wide shadow-md hover:shadow-lg transition-all duration-300 rounded-full',
    isDisabledByConfigOnly
      ? 'bg-gray-400 cursor-not-allowed'
      : themeButtonGradientClass,
    !isDisabledByConfigOnly && !isCurrentButtonBusy && !isAnyProcessing &&
      themeButtonGradientHoverClass,
    (isCurrentButtonBusy || isAnyProcessing) && !isDisabledByConfigOnly && 'opacity-70 cursor-not-allowed'
  );

  return (
    <button
      className={buttonClassName}
      disabled={isDisabled}
      onClick={handleClick}
      type="button"
      data-plan-button={planKey}
    >
      {displayText}
    </button>
  );
}
