import type {
  InitUserContext,
  MoneyPriceConfig,
  MoneyPriceData,
} from '../money-price/money-price-types';

export type PricingModalMode = 'subscription' | 'onetime';

export type CreditActionConfig =
  | CreditModalAction
  | CreditRedirectAction
  | CreditAuthAction
  | CreditCustomAction;

export interface CreditModalAction {
  kind: 'modal';
  mode: PricingModalMode;
}

export interface CreditRedirectAction {
  kind: 'redirect';
  url: string;
}

export interface CreditAuthAction {
  kind: 'auth';
  endpoint?: string;
  returnUrl?: string;
}

export interface CreditCustomAction {
  kind: 'custom';
  handlerKey: string;
}

export interface DeviceAwareCreditActionConfig {
  desktop?: CreditActionConfig;
  mobile?: CreditActionConfig;
}

export interface CreditCTAConfig {
  subscribe?: DeviceAwareCreditActionConfig;
  manage?: DeviceAwareCreditActionConfig;
  onetime?: DeviceAwareCreditActionConfig;
}

export type CreditBucketStatus = 'active' | 'expiringSoon' | 'expired';

export interface CreditBucket {
  /** Business-defined credit type identifier for translation mapping or analytics. */
  kind: string;
  /** Display name override; otherwise the component uses the default translation for kind. */
  label?: string;
  /** Current credit balance. */
  balance: number;
  /** Credit limit for this credit type. */
  limit: number;
  /** Optional status label for highlighting states such as expiration. */
  status?: CreditBucketStatus;
  /** Credit expiration time as a local time string, used to derive component state. */
  expiresAt?: string;
  /** Progress percentage from 0 to 100; computed from balance/limit when omitted. */
  progressPercent?: number;
  /** Additional details, such as remaining days or usage limits. */
  description?: string;
}

export interface SubscriptionInfo {
  planName: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface CreditOverviewData {
  totalBalance: number;
  buckets: CreditBucket[];
  subscription?: SubscriptionInfo;
  pricingContext?: CreditPricingContext;
  ctaBehaviors?: CreditCTAConfig;
}

export interface CreditPricingContext {
  moneyPriceData: MoneyPriceData;
  moneyPriceConfig: MoneyPriceConfig;
  checkoutApiEndpoint?: string;
  customerPortalApiEndpoint?: string;
  enableSubscriptionUpgrade?: boolean;
  initUserContext?: InitUserContext;
}
