export {
  prisma,
  createPrismaClient,
  configureBackendCorePrisma,
  getBackendCorePrisma,
  checkAndFallbackWithNonTCClient,
} from './prisma';
export type { BackendCorePrismaClient, BackendCoreHostPrismaClient } from './prisma';
export { runInTransaction } from './prisma-transaction-util';
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
} from '../services/database/core-entities';
export type { Prisma } from '../services/database/prisma-model-type';
