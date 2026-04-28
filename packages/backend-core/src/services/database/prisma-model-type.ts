export type {
  User,
  Subscription,
  Credit,
  CreditAuditLog,
  Transaction,
  Apilog,
  UserBackup,
  CoreJsonArray,
  CoreJsonObject,
  CoreJsonPrimitive,
  CoreJsonValue,
} from './core-entities';

import type { BackendCoreHostPrismaClient } from '../../prisma/prisma';
import type { CoreJsonObject, CoreJsonValue } from './core-entities';

export namespace Prisma {
  export type TransactionClient = BackendCoreHostPrismaClient;
  export type QueryEvent = {
    query: string;
    params: string;
    duration: number;
  };
  export type InputJsonValue = CoreJsonValue;
  export type InputJsonObject = CoreJsonObject;
  export type NullableJsonNullValueInput = null;
  export type UserUpdateInput = Record<string, unknown>;
  export type CreditUpdateInput = Record<string, unknown>;
  export type SubscriptionUpdateInput = Record<string, unknown>;
  export type TransactionUpdateInput = Record<string, unknown>;
  export type CreditAuditLogUncheckedCreateInput = Record<string, unknown>;
  export type CreditAuditLogCreateManyInput = Record<string, unknown>;
  export type CreditAuditLogOrderByWithRelationInput = Record<string, unknown>;
  export type CreditAuditLogWhereInput = Record<string, any>;
  export type TransactionOrderByWithRelationInput = Record<string, unknown>;
  export type TransactionWhereInput = Record<string, any>;
  export type TransactionCreateManyInput = Record<string, unknown>;
  export type UserWhereInput = Record<string, any>;
  export type UserBackupOrderByWithRelationInput = Record<string, unknown>;
  export type UserBackupWhereInput = Record<string, any>;
}
