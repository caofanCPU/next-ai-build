import type { XCredit, XSubscription, XUser } from '../../clerk/fingerprint/types';

/**
 * Money Price Component Types
 * Pricing component type definitions.
 */

// User status enum.
export enum UserState {
  Anonymous = 'anonymous',
  FreeUser = 'free',
  ProUser = 'pro',
  UltraUser = 'ultra'
}

// User context.
export interface UserContext {
  isAuthenticated: boolean;
  subscriptionStatus: UserState;
  subscriptionType?: string;
  subscriptionEndDate?: string;
}

export interface InitUserContext {
  fingerprintId: string | null;
  xUser: XUser | null;
  xCredit: XCredit | null;
  xSubscription: XSubscription | null;
  isClerkAuthenticated?: boolean;
}

// Payment provider type.
export type PaymentProvider = 'stripe' | 'apple' | 'paypal' | 'wechat' | 'alipay'  ;

// Price plan.
export interface EnhancePricePlan {
  priceId: string;
  amount: number;
  originalAmount?: number;
  discountPercent?: number;
  currency: string;
  credits?: number;
}

// Subscription product configuration.
export interface SubscriptionProductConfig {
  key: string;
  plans: Record<string, EnhancePricePlan>;
}

// Credit pack product configuration.
export interface CreditPackProductConfig {
  key: string;
  priceId: string;
  amount: number;
  currency: string;
  credits: number;
}

// Payment provider configuration.
export interface PaymentProviderConfig {
  provider: PaymentProvider;
  enabled: boolean;
  subscriptionProducts?: {
    F1: SubscriptionProductConfig;
    P2: SubscriptionProductConfig;
    U3: SubscriptionProductConfig;
  };
  creditPackProducts?: {
    F1: CreditPackProductConfig;
    P2: CreditPackProductConfig;
    U3: CreditPackProductConfig;
  };
  // Backward-compatible legacy shape.
  products?: {
    F1: SubscriptionProductConfig;
    P2: SubscriptionProductConfig;
    U3: SubscriptionProductConfig;
  };
}

// Main configuration.
export interface MoneyPriceConfig {
  paymentProviders: {
    [provider: string]: PaymentProviderConfig;
  };
  activeProvider: string;
  display: {
    currency: string;
    locale: string;
    minFeaturesCount: number;
  };
}

// Component props.
export interface MoneyPriceProps {
  locale: string;
  config: MoneyPriceConfig;
  className?: string;
  checkoutApiEndpoint?: string;
  customerPortalApiEndpoint?: string;
  enableClerkModal?: boolean;
  sectionClassName?: string;
  enabledBillingTypes?: string[];
  enableSubscriptionUpgrade?: boolean;
  initUserContext?: InitUserContext;
  initialBillingType?: string;
}

// Interactive component props.
export interface MoneyPriceInteractiveProps {
  data: MoneyPriceData;
  config: MoneyPriceConfig;
  checkoutApiEndpoint?: string;
  customerPortalApiEndpoint?: string;
  enableClerkModal?: boolean;
  enabledBillingTypes?: string[];
  enableSubscriptionUpgrade?: boolean;
  initialBillingType?: string;
  disableAutoDetectBilling?: boolean;
  initUserContext?: InitUserContext;
  isInitLoading?: boolean;
}

// Button component props.
export interface MoneyPriceButtonProps {
  planKey: 'F1' | 'P2' | 'U3';
  userContext: UserContext;
  billingType: string;
  onAuth: () => void;
  onAction: (plan: string, billingType: string) => void | Promise<void>;
  texts: {
    buyCredits: string;
    getStarted: string;
    getPro: string;
    getUltra: string;
    currentPlan: string;
    upgrade: string;
  };
  isProcessing?: boolean;
  isAnyProcessing?: boolean;
  isInitLoading: boolean;
  enableSubscriptionUpgrade?: boolean;
}

export type MoneyPriceAnimeTone = 'theme' | 'rainbow' | 'mono' | 'warm' | 'cool';
export type MoneyPriceStrictDiffAnime = Record<string, MoneyPriceAnimeTone | null | undefined>;

// Data structures.
export interface MoneyPriceData {
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
  subscriptionPlans: Array<{
    key: string;
    title: string;
    animeTone?: MoneyPriceAnimeTone;
    strictDiffAnime?: MoneyPriceStrictDiffAnime;
    showBillingSubTitle?: boolean;
    titleTags?: string[];
    features?: Array<{
      description: string;
      icon?: string;
      tag?: string;
      tooltip?: string;
    }>;
  }>;
  creditsPlans: Array<{
    key: string;
    title: string;
    subtitle?: string;
    animeTone?: MoneyPriceAnimeTone;
    strictDiffAnime?: MoneyPriceStrictDiffAnime;
    showBillingSubTitle?: boolean;
    titleTags?: string[];
    features?: Array<{
      description: string;
      icon?: string;
      tag?: string;
      tooltip?: string;
    }>;
  }>;
  buttonTexts: {
    buyCredits: string;
    getStarted: string;
    getPro: string;
    getUltra: string;
    currentPlan: string;
    upgrade: string;
  };
  currency: string;
}
