/**
 * Money Price Configuration
 * Pricing component configuration.
 */

import type { MoneyPriceConfig, PaymentProviderConfig, EnhancePricePlan } from './money-price-types';

/**
 * Get the currently active payment provider configuration.
 *
 * Security design:
 * - The utility layer extracts the active provider configuration from the config.
 * - Only the extracted result is returned; the full config structure is not exposed.
 * - Application-level wrappers hide the config object from callers.
 *
 * @param config - MoneyPriceConfig object provided by the application layer.
 * @returns The currently active payment provider configuration.
 */
export function getActiveProviderConfigUtil(config: MoneyPriceConfig): PaymentProviderConfig {
  const provider = config.activeProvider;
  return config.paymentProviders[provider];
}

// Helper: get pricing information for a specific product.
export function getProductPricing(
  productKey: 'F1' | 'P2' | 'U3',
  billingType: string,
  provider: string,
  config: MoneyPriceConfig
): EnhancePricePlan {
  const providerConfig = config.paymentProviders[provider];

  // For one-time billing, try to resolve pricing from credit packs.
  if (billingType === 'onetime') {
    const creditPacks = providerConfig.creditPackProducts;
    // Use the same product key directly: F1 -> F1, P2 -> P2, U3 -> U3.
    if (creditPacks && creditPacks[productKey]) {
      const pack = creditPacks[productKey];
      return {
        priceId: pack.priceId,
        amount: pack.amount,
        currency: pack.currency,
        credits: pack.credits
      };
    }
  }

  // Otherwise resolve pricing from subscription products.
  const products = providerConfig.subscriptionProducts || providerConfig.products;
  if (products && products[productKey] && products[productKey].plans[billingType]) {
    return products[productKey].plans[billingType];
  }

  throw new Error(`Product pricing not found for ${productKey} ${billingType}`);
}

// ============ Safe utility functions: accept only simple mapping inputs and do not expose config internals ============

/**
 * Get the credit amount for a price ID.
 *
 * Security design:
 * - The utility layer parses the config and extracts only the required data.
 * - Only the query result is returned; the full config structure is not exposed.
 * - Application-level wrappers hide the config object from callers.
 *
 * @param priceId - Price ID to query.
 * @param config - MoneyPriceConfig object provided by the application layer.
 * @returns The matching credit amount, or null.
 */
export function getCreditsFromPriceIdUtil(
  priceId: string | undefined,
  config: MoneyPriceConfig
): number | null {
  if (!priceId) {
    return null;
  }

  // Iterate through all payment providers.
  for (const provider of Object.values(config.paymentProviders)) {
    // Iterate through subscription products.
    const subscriptionProducts = (
      provider.subscriptionProducts || provider.products
    ) as Record<string, any>;

    if (subscriptionProducts) {
      for (const product of Object.values(subscriptionProducts)) {
        if (product.plans) {
          for (const planConfig of Object.values(product.plans)) {
            const plan = planConfig as any;
            if (plan.priceId === priceId && plan.credits !== undefined) {
              return plan.credits;
            }
          }
        }
      }
    }

    // Iterate through credit pack products.
    const creditPacks = provider.creditPackProducts as Record<string, any>;
    if (creditPacks) {
      for (const pack of Object.values(creditPacks)) {
        const packTyped = pack as any;
        if (packTyped.priceId === priceId && packTyped.credits !== undefined) {
          return packTyped.credits;
        }
      }
    }
  }

  return null;
}

/**
 * Get price configuration by query parameters.
 *
 * Supported query modes:
 * 1. Query directly by priceId.
 * 2. Query by plan and billingType.
 * 3. Query by plan.
 *
 * Security design:
 * - The utility layer parses the config and extracts only matching data.
 * - Only the query result is returned; the full config structure is not exposed.
 * - Application-level wrappers hide the config object from callers.
 *
 * @param priceId - Optional price ID to query.
 * @param plan - Optional plan name, such as 'P2' or 'U3'.
 * @param billingType - Optional billing type, such as 'monthly' or 'yearly'.
 * @param config - MoneyPriceConfig object provided by the application layer.
 * @returns The matching price config with derived metadata: priceName, description, and interval.
 */
export function getPriceConfigUtil(
  priceId: string | undefined,
  plan: string | undefined,
  billingType: string | undefined,
  config: MoneyPriceConfig
): (EnhancePricePlan & { priceName: string; description: string; interval?: string }) | null {
  // Iterate through all payment providers.
  for (const provider of Object.values(config.paymentProviders)) {
    // Iterate through subscription products.
    const subscriptionProducts = (
      provider.subscriptionProducts || provider.products
    ) as Record<string, any>;

    if (subscriptionProducts) {
      for (const [productKey, product] of Object.entries(subscriptionProducts)) {
        if (product.plans) {
          for (const [billingKey, planConfig] of Object.entries(product.plans)) {
            const plan_config = planConfig as any;

            // Matching order by priority.
            // 1. Exact priceId match with highest priority.
            if (priceId && plan_config.priceId === priceId) {
              return {
                ...plan_config,
                priceName: `${productKey} ${billingKey}`,
                description: `${productKey} plan - ${billingKey} billing`,
                interval: billingKey === 'yearly' ? 'year' : 'month',
              };
            }

            // 2. Match by both plan and billingType.
            if (!priceId && plan && billingType) {
              if (productKey === plan && billingKey === billingType) {
                return {
                  ...plan_config,
                  priceName: `${productKey} ${billingKey}`,
                  description: `${productKey} plan - ${billingKey} billing`,
                  interval: billingKey === 'yearly' ? 'year' : 'month',
                };
              }
            }

            // 3. Match by plan when billingType is empty.
            if (!priceId && !billingType && plan && productKey === plan) {
              return {
                ...plan_config,
                priceName: `${productKey} ${billingKey}`,
                description: `${productKey} plan - ${billingKey} billing`,
                interval: billingKey === 'yearly' ? 'year' : 'month',
              };
            }
          }
        }
      }
    }

    // Iterate through credit pack products.
    const creditPacks = provider.creditPackProducts as Record<string, any>;
    if (creditPacks) {
      for (const [packKey, pack] of Object.entries(creditPacks)) {
        const pack_typed = pack as any;

        // Credit pack match.
        if (priceId && pack_typed.priceId === priceId) {
          return {
            priceId: pack_typed.priceId,
            amount: pack_typed.amount,
            currency: pack_typed.currency,
            credits: pack_typed.credits,
            priceName: `${packKey} Credit Pack`,
            description: `${packKey} Credit Pack - One-time purchase`,
            interval: 'onetime',
          };
        }

        // Match by plan and one-time billing.
        if (!priceId && plan && billingType === 'onetime') {
          if (packKey === plan) {
            return {
              priceId: pack_typed.priceId,
              amount: pack_typed.amount,
              currency: pack_typed.currency,
              credits: pack_typed.credits,
              priceName: `${packKey} Credit Pack`,
              description: `${packKey} Credit Pack - One-time purchase`,
              interval: 'onetime',
            };
          }
        }

        // Match by plan; also resolves the first credit pack when billingType is empty.
        if (!priceId && !billingType && plan && packKey === plan) {
          return {
            priceId: pack_typed.priceId,
            amount: pack_typed.amount,
            currency: pack_typed.currency,
            credits: pack_typed.credits,
            priceName: `${packKey} Credit Pack`,
            description: `${packKey} Credit Pack - One-time purchase`,
            interval: 'onetime',
          };
        }
      }
    }
  }

  return null;
}
