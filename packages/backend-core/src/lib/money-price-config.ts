import {
  MoneyPriceConfig,
  PaymentProviderConfig,
  EnhancePricePlan,
  getActiveProviderConfigUtil,
  getCreditsFromPriceIdUtil,
  getPriceConfigUtil
} from '@windrun-huaiin/third-ui/main/server'

export const moneyPriceConfig: MoneyPriceConfig = {
  paymentProviders: {
    stripe: {
      provider: 'stripe',
      enabled: true,
      // Subscription products
      subscriptionProducts: {
        F1: {
          key: 'F1',
          plans: {
            monthly: {
              priceId: 'free',
              amount: 0,
              currency: 'usd',
              credits: 0
            },
            yearly: {
              priceId: 'free',
              amount: 0,
              currency: 'usd',
              credits: 0
            }
          }
        },
        P2: {
          key: 'P2',
          plans: {
            monthly: {
              priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_PRO_MONTHLY_AMOUNT!), // 10
              currency: process.env.STRIPE_PRO_MONTHLY_CURRENCY!,
              credits: Number(process.env.STRIPE_PRO_MONTHLY_CREDITS!)
            },
            yearly: {
              priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_PRO_YEARLY_AMOUNT!),
              originalAmount: Number(process.env.STRIPE_PRO_MONTHLY_AMOUNT!), // 10,
              discountPercent: Number(process.env.STRIPE_PRO_DISCOUNT_PERCENT),
              currency: process.env.STRIPE_PRO_YEARLY_CURRENCY!,
              credits: Number(process.env.STRIPE_PRO_YEARLY_CREDITS!) 
            }
          }
        },
        U3: {
          key: 'U3',
          plans: {
            monthly: {
              priceId: process.env.STRIPE_ULTRA_MONTHLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_ULTRA_MONTHLY_AMOUNT!), 
              currency: process.env.STRIPE_ULTRA_MONTHLY_CURRENCY!,
              credits: Number(process.env.STRIPE_ULTRA_MONTHLY_CREDITS!) 
            },
            yearly: {
              priceId: process.env.STRIPE_ULTRA_YEARLY_PRICE_ID!,
              amount: Number(process.env.STRIPE_ULTRA_YEARLY_AMOUNT!), 
              originalAmount: Number(process.env.STRIPE_ULTRA_MONTHLY_AMOUNT!), 
              discountPercent: Number(process.env.STRIPE_ULTRA_DISCOUNT_PERCENT),
              currency: process.env.STRIPE_ULTRA_YEARLY_CURRENCY!,
              credits: Number(process.env.STRIPE_ULTRA_YEARLY_CREDITS!) 
            }
          }
        }
      },
      // Credit pack products
      creditPackProducts: {
        F1: {
          key: 'F1',
          priceId: process.env.STRIPE_ONE_TIME_LESS_PRICE_ID!,
          amount: Number(process.env.STRIPE_ONE_TIME_LESS_AMOUNT!),
          currency: process.env.STRIPE_ONE_TIME_LESS_CURRENCY!,
          credits: Number(process.env.STRIPE_ONE_TIME_LESS_CREDITS!)
        },
        P2: {
          key: 'P2',
          priceId: process.env.STRIPE_ONE_TIME_MID_PRICE_ID!,
          amount: Number(process.env.STRIPE_ONE_TIME_MID_AMOUNT!),
          currency: process.env.STRIPE_ONE_TIME_MID_CURRENCY!,
          credits: Number(process.env.STRIPE_ONE_TIME_MID_CREDITS!)
        },
        U3: {
          key: 'U3',
          priceId: process.env.STRIPE_ONE_TIME_MORE_PRICE_ID!,
          amount: Number(process.env.STRIPE_ONE_TIME_MORE_AMOUNT!),
          currency: process.env.STRIPE_ONE_TIME_MORE_CURRENCY!,
          credits: Number(process.env.STRIPE_ONE_TIME_MORE_CREDITS!)
        }
      }
    }
  },
  
  activeProvider: process.env.ACTIVE_PAYMENT_PROVIDER || 'stripe',
  
  display: {
    currency: '$',
    locale: 'en',
    minFeaturesCount: 4
  }
};

// ============ Application-level wrappers that hide moneyPriceConfig details ============

/**
 * Get the currently active payment provider configuration.
 *
 * Security design:
 * - Wrapper functions keep moneyPriceConfig private.
 * - Utility functions extract the active provider configuration from the config.
 * - External callers can access only this wrapper, not the full config object.
 *
 * @returns The currently active payment provider configuration.
 */
export function getActiveProviderConfig(): PaymentProviderConfig {
  return getActiveProviderConfigUtil(moneyPriceConfig);
}

/**
 * Get the credit amount for a price ID.
 *
 * Security design:
 * - Wrapper functions keep moneyPriceConfig private.
 * - Utility functions parse the config and extract the result.
 * - External callers can access only this wrapper, not the full config object.
 *
 * @param priceId - Price ID to query.
 * @param _provider - Reserved for backward compatibility; currently unused.
 * @returns The matching credit amount, or null.
 */
export function getCreditsFromPriceId(priceId?: string, _provider?: string): number | null {
  return getCreditsFromPriceIdUtil(priceId, moneyPriceConfig);
}

/**
 * Get price configuration by query parameters.
 *
 * Supported query modes:
 * 1. By priceId: getPriceConfig(priceId='price_xxx')
 * 2. By plan and billingType: getPriceConfig(undefined, 'P2', 'monthly')
 * 3. By plan: getPriceConfig(undefined, 'P2')
 *
 * Security design:
 * - Wrapper functions keep moneyPriceConfig private.
 * - Utility functions parse the config and extract the matching result.
 * - External callers can access only this wrapper, not the full config object.
 *
 * @param priceId - Optional price ID to query.
 * @param plan - Optional plan name, such as 'P2' or 'U3'.
 * @param billingType - Optional billing type, such as 'monthly' or 'yearly'.
 * @param _provider - Reserved for backward compatibility; currently unused.
 * @returns The matching price config with derived metadata: priceName, description, and interval.
 */
export function getPriceConfig(
  priceId?: string,
  plan?: string,
  billingType?: string,
  _provider?: string
): (EnhancePricePlan & { priceName: string; description: string; interval?: string }) | null {
  return getPriceConfigUtil(priceId, plan, billingType, moneyPriceConfig);
}
