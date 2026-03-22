/**
 * Fingerprint System Types
 * 指纹识别系统的类型定义
 */

export interface XUser {
  userId: string;
  userName: string,
  fingerprintId: string;
  clerkUserId: string,
  stripeCusId: string,
  email: string,
  status: string;
  createdAt: string;
}

export interface XCredit {
  balanceFree: number;
  totalFreeLimit: number;
  freeStart: string
  freeEnd: string
  
  balancePaid: number;
  totalPaidLimit: number;
  paidStart: string
  paidEnd: string

  balanceOneTimePaid: number;
  totalOneTimePaidLimit: number;
  oneTimePaidStart: string
  oneTimePaidEnd: string

  totalBalance: number;
}

export interface XSubscription {
  id: bigint
  userId: string
  paySubscriptionId: string | null
  orderId: string | null
  priceId: string | null
  priceName: string | null
  status: string
  creditsAllocated: number
  subPeriodStart: string
  subPeriodEnd: string
}

export interface FingerprintConfig {
  /** API endpoint for anonymous user initialization */
  apiEndpoint: string;
  /** Whether to automatically initialize the user on load */
  autoInitialize?: boolean;
}

export interface UseFingerprintResult {
  fingerprintId: string | null;
  xUser: XUser | null;
  xCredit: XCredit | null;
  xSubscription: XSubscription | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  clearError: () => void;
  initializeAnonymousUser: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

export interface FingerprintContextType extends UseFingerprintResult {}

export interface FingerprintProviderProps {
  children: React.ReactNode;
  config: FingerprintConfig;
}
// Fetch wrapper type
export interface FingerprintFetch {
  (url: string | URL | Request, init?: RequestInit): Promise<Response>;
}
