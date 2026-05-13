// Database Field Enums
// Keep in sync with DB CHECK constraints

export const UserStatus = {
  // Anonymous user
  ANONYMOUS: 'anonymous',
  // Registered user
  REGISTERED: 'registered',
  // Frozen by admin intervention
  FROZEN: 'frozen',
  // Soft-deleted user data that must not be reused
  DELETED: 'deleted',
} as const;

export const SubscriptionStatus = {
  // Initial or post-cancellation state
  INCOMPLETE: 'incomplete',
  // Trial subscription period
  TRIALING: 'trialing',
  // Active subscription
  ACTIVE: 'active',
  // Past-due subscription
  PAST_DUE: 'past_due',
  // Canceled subscription
  CANCELED: 'canceled',
} as const;

export const OrderStatus = {
  // Initial state
  CREATED: 'created',
  // Intermediate state, awaiting payment; may be triggered by a payment failure event
  PENDING_UNPAID: 'pending_unpaid',
  // Intermediate or final state; payment succeeded and may later become refunded or canceled
  SUCCESS: 'success',
  // Intermediate or final state; checkout or payment failed and may later become refunded or canceled
  FAILED: 'failed',
  // Final state, refunded
  REFUNDED: 'refunded',
  // Final state, canceled
  CANCELED: 'canceled',
} as const;

export const TransactionType = {
  // Subscription order
  SUBSCRIPTION: 'subscription',
  // One-time payment order
  ONE_TIME: 'one_time',
} as const;

export const CreditType = {
  // Subscription credits
  PAID: 'paid',
  // One-time paid credits
  ONE_TIME_PAID: 'one_time_paid',
  // Free credits
  FREE: 'free',
} as const;

export const OperationType = {
  // System-granted credits
  SYS_GIFT: 'system_gift',
  // User credit consumption
  CONSUME: 'consume',
  // User credit recharge
  RECHARGE: 'recharge',
  // Admin credit freeze
  FREEZE: 'freeze',
  // Admin credit unfreeze
  UNFREEZE: 'unfreeze',
  // Admin credit increase
  ADJUST_INCREASE: 'adjust_increase',
  // Admin credit decrease
  ADJUST_DECREASE: 'adjust_decrease',
  // Credit purge triggered by an event or expiration
  PURGE: 'purge',
} as const;

// Payment provider types
export const PaySupplier = {
  STRIPE: 'Stripe',
  APPLE: 'Apple',
  PAYPAL: 'Paypal',
} as const;

export const BillingReason = {
  // Initial subscription
  SUBSCRIPTION_CREATE: 'subscription_create',
  // Subscription renewal
  SUBSCRIPTION_CYCLE: 'subscription_cycle',
} as const;

export const PaymentStatus = {
  // Paid
  PAID: 'paid',
  // Pending payment
  UN_PAID: 'un_paid',
  // No payment required
  NO_PAYMENT_REQUIRED: 'no_payment_required',
} as const;


// Type Definitions
export type UserStatus = typeof UserStatus[keyof typeof UserStatus];
export type SubscriptionStatus = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];
export type TransactionType = typeof TransactionType[keyof typeof TransactionType];
export type CreditType = typeof CreditType[keyof typeof CreditType];
export type OperationType = typeof OperationType[keyof typeof OperationType];
export type PaySupplier = typeof PaySupplier[keyof typeof PaySupplier];
export type BillingReason = typeof BillingReason[keyof typeof BillingReason];
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

// Validation Functions
export const isValidUserStatus = (status: string): status is UserStatus => {
  return Object.values(UserStatus).includes(status as UserStatus);
};

export const isValidSubscriptionStatus = (status: string): status is SubscriptionStatus => {
  return Object.values(SubscriptionStatus).includes(status as SubscriptionStatus);
};

export const isValidOrderStatus = (status: string): status is OrderStatus => {
  return Object.values(OrderStatus).includes(status as OrderStatus);
};

export const isValidTransactionType = (type: string): type is TransactionType => {
  return Object.values(TransactionType).includes(type as TransactionType);
};

export const isValidCreditType = (type: string): type is CreditType => {
  return Object.values(CreditType).includes(type as CreditType);
};

export const isValidOperationType = (type: string): type is OperationType => {
  return Object.values(OperationType).includes(type as OperationType);
};

export const isValidPaySupplier = (supplier: string): supplier is PaySupplier => {
  return Object.values(PaySupplier).includes(supplier as PaySupplier);
};

export const isValidBillingReason = (reason: string): reason is BillingReason => {
  return Object.values(BillingReason).includes(reason as BillingReason);
};

export const isValidPaymentStatus = (status: string): status is PaymentStatus => {
  return Object.values(PaymentStatus).includes(status as PaymentStatus);
};
