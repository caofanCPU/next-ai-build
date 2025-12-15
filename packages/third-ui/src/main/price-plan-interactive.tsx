/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@windrun-huaiin/lib/utils';

// Import interfaces from the main component
interface BillingOption {
  key: string;
  discount: number;
}

interface Prices {
  [key: string]: number | string;
}

interface PricePlanAppConfig {
  billingOptions: BillingOption[];
  prices: Prices;
  minPlanFeaturesCount: number;
}

interface PricePlanData {
  title: string;
  subtitle: string;
  billingSwitch: {
    options: Array<{
      key: string;
      name: string;
      unit: string;
      discountText: string;
      subTitle?: string;
    }>;
    defaultKey: string;
  };
  plans: Array<any>;
  currency: string;
  pricePlanConfig: PricePlanAppConfig;
}

export function PricePlanInteractive({ data }: { data: PricePlanData }) {
  const [billingKey, setBillingKey] = useState(data.billingSwitch.defaultKey);
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    content: string;
    x: number;
    y: number;
  }>({ show: false, content: '', x: 0, y: 0 });
  
  const router = useRouter();

  useEffect(() => {
    // Progressive enhancement: Add billing switch functionality
    const monthlyButton = document.querySelector('[data-billing-button="monthly"]') as HTMLButtonElement;
    const yearlyButton = document.querySelector('[data-billing-button="yearly"]') as HTMLButtonElement;
    
    const handleBillingSwitch = (newBillingKey: string) => {
      setBillingKey(newBillingKey);
      updatePrices(newBillingKey);
      updateDiscountInfo(newBillingKey);
      updateButtonStyles(newBillingKey);
    };

    if (monthlyButton) {
      monthlyButton.addEventListener('click', () => handleBillingSwitch('monthly'));
    }
    if (yearlyButton) {
      yearlyButton.addEventListener('click', () => handleBillingSwitch('yearly'));
    }

    // Add tooltip functionality
    data.plans.forEach((plan: any) => {
      plan.features?.forEach((feature: any, i: number) => {
        if (feature?.tooltip) {
          const tooltipTrigger = document.querySelector(`[data-tooltip-trigger="${plan.key}-${i}"]`) as HTMLElement;
          if (tooltipTrigger) {
            const handleMouseEnter = (e: MouseEvent) => {
              setTooltip({
                show: true,
                content: feature.tooltip,
                x: e.clientX,
                y: e.clientY
              });
            };
            
            const handleMouseMove = (e: MouseEvent) => {
              setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
            };
            
            const handleMouseLeave = () => {
              setTooltip(prev => ({ ...prev, show: false }));
            };

            tooltipTrigger.addEventListener('mouseenter', handleMouseEnter);
            tooltipTrigger.addEventListener('mousemove', handleMouseMove);
            tooltipTrigger.addEventListener('mouseleave', handleMouseLeave);
          }
        }
      });
    });

    // Add plan button functionality
    data.plans.forEach((plan: any) => {
      const planButton = document.querySelector(`[data-plan-button="${plan.key}"]`) as HTMLButtonElement;
      if (planButton && !plan.button?.disabled) {
        planButton.addEventListener('click', () => {
          router.push('/');
        });
      }
    });

    // Cleanup
    return () => {
      if (monthlyButton) {
        const newButton = monthlyButton.cloneNode(true);
        monthlyButton.parentNode?.replaceChild(newButton, monthlyButton);
      }
      if (yearlyButton) {
        const newButton = yearlyButton.cloneNode(true);
        yearlyButton.parentNode?.replaceChild(newButton, yearlyButton);
      }
      
      // Cleanup tooltip events
      data.plans.forEach((plan: any) => {
        plan.features?.forEach((_feature: any, i: number) => {
          const tooltipTrigger = document.querySelector(`[data-tooltip-trigger="${plan.key}-${i}"]`) as HTMLElement;
          if (tooltipTrigger) {
            const newTrigger = tooltipTrigger.cloneNode(true);
            tooltipTrigger.parentNode?.replaceChild(newTrigger, tooltipTrigger);
          }
        });
      });
    };
  }, [data, router]);

  const updatePrices = (newBillingKey: string) => {
    const currentBilling = data.pricePlanConfig.billingOptions.find((opt: any) => opt.key === newBillingKey) || data.pricePlanConfig.billingOptions[0];
    const currentBillingDisplay = data.billingSwitch.options.find((opt: any) => opt.key === newBillingKey) || data.billingSwitch.options[0];

    data.plans.forEach((plan: any) => {
      const priceContainer = document.querySelector(`[data-price-container="${plan.key}"]`) as HTMLElement;
      const priceValue = data.pricePlanConfig.prices[plan.key];
      
      if (priceContainer) {
        // Update price display based on new billing
        const priceValueElement = document.querySelector(`[data-price-value="${plan.key}"]`) as HTMLElement;
        const priceUnitElement = document.querySelector(`[data-price-unit="${plan.key}"]`) as HTMLElement;
        const priceOriginalElement = document.querySelector(`[data-price-original="${plan.key}"]`) as HTMLElement;
        const priceDiscountElement = document.querySelector(`[data-price-discount="${plan.key}"]`) as HTMLElement;
        const priceSubtitleElement = document.querySelector(`[data-price-subtitle="${plan.key}"]`) as HTMLElement;

        if (typeof priceValue !== 'number' || isNaN(priceValue)) {
          // Non-numeric price
          if (priceValueElement) priceValueElement.textContent = String(priceValue);
          if (priceSubtitleElement) priceSubtitleElement.textContent = plan.showBillingSubTitle === false ? '' : (currentBillingDisplay?.subTitle || '');
        } else {
          // Numeric price
          const originValue = Number(priceValue);
          const discount = currentBilling.discount;
          const hasDiscount = discount !== 0;
          const saleValue = originValue * (1 - discount);
          const formatPrice = (v: number) => Number(v.toFixed(2)).toString();
          const showNaN = saleValue < 0;

          if (priceValueElement) {
            priceValueElement.textContent = `${data.currency}${showNaN ? 'NaN' : (hasDiscount ? formatPrice(saleValue) : formatPrice(originValue))}`;
          }
          if (priceUnitElement) {
            priceUnitElement.textContent = currentBillingDisplay.unit || '';
          }

          // Handle discount display
          if (hasDiscount) {
            if (priceOriginalElement) {
              priceOriginalElement.textContent = `${data.currency}${showNaN ? 'NaN' : formatPrice(originValue)}`;
              priceOriginalElement.style.display = 'inline';
            }
            if (priceDiscountElement && currentBillingDisplay.discountText) {
              const discountText = currentBillingDisplay.discountText.replace('{percent}', String(Math.round(Math.abs(discount) * 100)));
              priceDiscountElement.textContent = discountText;
              priceDiscountElement.style.display = 'inline';
            }
          } else {
            if (priceOriginalElement) priceOriginalElement.style.display = 'none';
            if (priceDiscountElement) priceDiscountElement.style.display = 'none';
          }

          if (priceSubtitleElement) {
            priceSubtitleElement.textContent = plan.showBillingSubTitle === false ? '' : (currentBillingDisplay?.subTitle || '');
          }
        }
      }
    });
  };

  const updateDiscountInfo = (newBillingKey: string) => {
    const discountInfoElement = document.querySelector('[data-discount-info]') as HTMLElement;
    if (discountInfoElement) {
      const opt = data.billingSwitch.options.find((opt: any) => opt.key === newBillingKey);
      const bOpt = data.pricePlanConfig.billingOptions.find((opt: any) => opt.key === newBillingKey);
      
      if (opt && bOpt && opt.discountText && bOpt.discount !== 0) {
        const discountText = opt.discountText.replace('{percent}', String(Math.round(Math.abs(bOpt.discount) * 100)));
        discountInfoElement.innerHTML = `
          <span class="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 font-semibold align-middle text-center inline-flex items-center justify-center whitespace-nowrap">
            ${discountText}
          </span>
        `;
      } else {
        discountInfoElement.innerHTML = '';
      }
    }
  };

  const updateButtonStyles = (newBillingKey: string) => {
    const monthlyButton = document.querySelector('[data-billing-button="monthly"]') as HTMLElement;
    const yearlyButton = document.querySelector('[data-billing-button="yearly"]') as HTMLElement;

    if (monthlyButton) {
      if (newBillingKey === 'monthly') {
        monthlyButton.className = cn(
          'min-w-[120px] px-6 py-2 font-medium transition text-lg relative',
          'text-white bg-linear-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600 rounded-full shadow-sm'
        );
      } else {
        monthlyButton.className = cn(
          'min-w-[120px] px-6 py-2 font-medium transition text-lg relative',
          'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 rounded-full'
        );
      }
    }

    if (yearlyButton) {
      if (newBillingKey === 'yearly') {
        yearlyButton.className = cn(
          'min-w-[120px] px-6 py-2 font-medium transition text-lg relative',
          'text-white bg-linear-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600 rounded-full shadow-sm'
        );
      } else {
        yearlyButton.className = cn(
          'min-w-[120px] px-6 py-2 font-medium transition text-lg relative',
          'text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 rounded-full'
        );
      }
    }
  };

  // Tooltip component
  const Tooltip = ({ show, content, x, y }: typeof tooltip) => {
    if (!show) return null;
    const style: React.CSSProperties = {
      position: 'fixed',
      left: Math.max(8, x),
      top: Math.max(8, y),
      zIndex: 9999,
      maxWidth: 200,
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      whiteSpace: 'pre-line',
    };
    return (
      <div 
        style={style}
        className="bg-gray-700 dark:bg-gray-200 text-gray-100 dark:text-gray-800 text-xs leading-relaxed px-3 py-2 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600 backdrop-blur-sm"
      >
        {content}
      </div>
    );
  };

  return <Tooltip {...tooltip} />;
}