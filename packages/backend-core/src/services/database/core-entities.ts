export type CoreJsonPrimitive = string | number | boolean | null;
export type CoreJsonValue = CoreJsonPrimitive | CoreJsonObject | CoreJsonArray;
export interface CoreJsonObject {
  [key: string]: CoreJsonValue | undefined;
}
export interface CoreJsonArray extends Array<CoreJsonValue> {}

export interface User {
  id: bigint;
  userId: string;
  status: string;
  fingerprintId: string | null;
  clerkUserId: string | null;
  stripeCusId: string | null;
  email: string | null;
  userName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  sourceRef: CoreJsonValue | null;
}

export interface Subscription {
  id: bigint;
  userId: string;
  status: string;
  paySubscriptionId: string | null;
  orderId: string | null;
  priceId: string | null;
  priceName: string | null;
  creditsAllocated: number;
  subPeriodStart: Date | null;
  subPeriodEnd: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  deleted: number;
}

export interface Credit {
  id: bigint;
  userId: string;
  balanceFree: number;
  totalFreeLimit: number;
  freeStart: Date | null;
  freeEnd: Date | null;
  balancePaid: number;
  totalPaidLimit: number;
  paidStart: Date | null;
  paidEnd: Date | null;
  balanceOneTimePaid: number;
  totalOneTimePaidLimit: number;
  oneTimePaidStart: Date | null;
  oneTimePaidEnd: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Transaction {
  id: bigint;
  userId: string;
  orderId: string;
  orderStatus: string;
  orderCreatedAt: Date | null;
  orderExpiredAt: Date | null;
  orderUpdatedAt: Date | null;
  type: string | null;
  paySupplier: string | null;
  paySessionId: string | null;
  payTransactionId: string | null;
  paySubscriptionId: string | null;
  subPeriodStart: Date | null;
  subPeriodEnd: Date | null;
  subLastTryCancelAt: Date | null;
  subPeriodCanceledAt: Date | null;
  subCancellationDetail: string | null;
  priceId: string | null;
  priceName: string | null;
  amount: unknown;
  currency: string | null;
  creditsGranted: number | null;
  payInvoiceId: string | null;
  paymentStatus: string;
  billingReason: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  orderDetail: string | null;
  paidEmail: string | null;
  paidAt: Date | null;
  paidDetail: string | null;
  payUpdatedAt: Date | null;
  deleted: number;
}

export interface CreditAuditLog {
  id: bigint;
  userId: string;
  creditsChange: number;
  feature: string | null;
  creditType: string;
  operationType: string;
  operationReferId: string | null;
  createdAt: Date | null;
  deleted: number;
}

export interface UserBackup {
  id: bigint;
  originalUserId: string;
  status: string | null;
  fingerprintId: string | null;
  clerkUserId: string | null;
  stripeCusId: string | null;
  email: string | null;
  userName: string | null;
  backupData: CoreJsonValue | null;
  deletedAt: Date | null;
  createdAt: Date | null;
  deleted: number;
}

export interface Apilog {
  id: bigint;
  apiType: string;
  methodName: string;
  summary: string | null;
  request: string | null;
  response: string | null;
  createdAt: Date | null;
}
