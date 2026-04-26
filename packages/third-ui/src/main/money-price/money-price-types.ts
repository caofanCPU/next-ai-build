import type { XCredit, XSubscription, XUser } from '../../clerk/fingerprint/types';

/**
 * Money Price Component Types
 * 价格组件类型定义
 */

// 用户状态枚举
export enum UserState {
  Anonymous = 'anonymous',
  FreeUser = 'free',
  ProUser = 'pro',
  UltraUser = 'ultra'
}

// 用户上下文
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

// 支付供应商类型
export type PaymentProvider = 'stripe' | 'apple' | 'paypal' | 'wechat' | 'alipay'  ;

// 价格计划
export interface EnhancePricePlan {
  priceId: string;
  amount: number;
  originalAmount?: number;
  discountPercent?: number;
  currency: string;
  credits?: number;
}

// 订阅产品配置
export interface SubscriptionProductConfig {
  key: string;
  plans: Record<string, EnhancePricePlan>;
}

// 积分包产品配置
export interface CreditPackProductConfig {
  key: string;
  priceId: string;
  amount: number;
  currency: string;
  credits: number;
}

// 支付供应商配置
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
  // 兼容旧结构
  products?: {
    F1: SubscriptionProductConfig;
    P2: SubscriptionProductConfig;
    U3: SubscriptionProductConfig;
  };
}

// 主配置
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

// 组件属性
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

// 交互组件属性
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
}

// 按钮组件属性
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

// 数据结构
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
