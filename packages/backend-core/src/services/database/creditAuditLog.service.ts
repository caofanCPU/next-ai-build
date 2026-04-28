/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Prisma } from '@core/db/prisma-model-type';
import type { CreditAuditLog } from '@core/db/prisma-model-type';
import { CreditType, OperationType } from '@core/db/constants';
import { checkAndFallbackWithNonTCClient } from '@core/prisma/index';

export class CreditAuditLogService {

  // Record Credit Audit
  async recordAuditLog(data: {
    userId: string;
    feature?: string;
    operationReferId?: string;
    creditType: string;
    operationType: string;
    creditsChange: number;
  }, tx?: Prisma.TransactionClient): Promise<CreditAuditLog> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.creditAuditLog.create({
      data: {
        userId: data.userId,
        feature: data.feature,
        operationReferId: data.operationReferId,
        creditType: data.creditType,
        operationType: data.operationType,
        creditsChange: data.creditsChange,
      },
    });
  }

  // Record Credit Operation (alias for recordUsage)
  async recordCreditOperation(data: {
    userId: string;
    feature?: string;
    operationReferId?: string;
    creditType: string;
    operationType: string;
    creditsChange: number;
  }, tx?: Prisma.TransactionClient): Promise<CreditAuditLog> {
    return this.recordAuditLog(data, tx);
  }

  // Batch Record Credit Audit
  async recordBatchAudit(
    auditLogs: Prisma.CreditAuditLogCreateManyInput[],
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const result = await client.creditAuditLog.createMany({
      data: auditLogs,
    });
    return result.count;
  }

  // Get User Credit Audit History
  async getUserCreditAuditHistory(
    userId: string,
    params?: {
      creditType?: string;
      operationType?: string;
      feature?: string;
      startDate?: Date;
      endDate?: Date;
      skip?: number;
      take?: number;
      orderBy?: Prisma.CreditAuditLogOrderByWithRelationInput;
    },
    tx?: Prisma.TransactionClient
  ): Promise<{ creditAudit: CreditAuditLog[]; total: number }> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const where: Prisma.CreditAuditLogWhereInput = { userId, deleted: 0 };

    if (params?.creditType) {
      where.creditType = params.creditType;
    }

    if (params?.operationType) {
      where.operationType = params.operationType;
    }

    if (params?.feature) {
      where.feature = params.feature;
    }

    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [creditAudit, total] = await Promise.all([
      client.creditAuditLog.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 20,
        orderBy: params?.orderBy || { createdAt: 'desc' },
      }),
      client.creditAuditLog.count({ where }),
    ]);

    return { creditAudit, total };
  }

  // Get Credit Audit Record by  operationReferId
  async getCreditAuditList(operationReferId: string, tx?: Prisma.TransactionClient): Promise<CreditAuditLog[]> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.creditAuditLog.findMany({
      where: { operationReferId, deleted: 0 },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get User Credit Audit Statistics
  async getUserCreditAuditStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    tx?: Prisma.TransactionClient
  ): Promise<{
    totalConsumed: number;
    totalRecharged: number;
    freeConsumed: number;
    paidConsumed: number;
    freeRecharged: number;
    paidRecharged: number;
    featureUsage: { feature: string; credits: number }[];
  }> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const where: Prisma.CreditAuditLogWhereInput = { userId, deleted: 0 };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get all creditAudit records
    const allUsage = await client.creditAuditLog.findMany({
      where,
      select: {
        creditType: true,
        operationType: true,
        creditsChange: true,
        feature: true,
      },
    });

    // Calculate statistics
    const stats = {
      totalConsumed: 0,
      totalRecharged: 0,
      freeConsumed: 0,
      paidConsumed: 0,
      freeRecharged: 0,
      paidRecharged: 0,
      featureUsage: [] as any[],
    };

    // Calculate creditAudit statistics by feature
    const featureMap = new Map<string, number>();

    allUsage.forEach((creditAudit: any) => {
      if (creditAudit.operationType === OperationType.CONSUME) {
        stats.totalConsumed += creditAudit.creditsChange;
        if (creditAudit.creditType === CreditType.FREE) {
          stats.freeConsumed += creditAudit.creditsChange;
        } else {
          stats.paidConsumed += creditAudit.creditsChange;
        }

        if (creditAudit.feature) {
          featureMap.set(
            creditAudit.feature,
            (featureMap.get(creditAudit.feature) || 0) + creditAudit.creditsChange
          );
        }
      } else if (creditAudit.operationType === OperationType.RECHARGE) {
        stats.totalRecharged += creditAudit.creditsChange;
        if (creditAudit.creditType === CreditType.FREE) {
          stats.freeRecharged += creditAudit.creditsChange;
        } else {
          stats.paidRecharged += creditAudit.creditsChange;
        }
      }
    });

    // Convert feature creditAudit statistics to array
    stats.featureUsage = Array.from(featureMap.entries())
      .map(([feature, credits]) => ({ feature, credits }))
      .sort((a, b) => b.credits - a.credits);

    return stats;
  }

  // Get Popular Features
  async getPopularFeatures(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
    tx?: Prisma.TransactionClient
  ): Promise<{ feature: string | null; totalCredits: number; usageCount: number }[]> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const where: Prisma.CreditAuditLogWhereInput = {
      operationType: OperationType.CONSUME,
      feature: { not: null },
      deleted: 0,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const result = await client.creditAuditLog.groupBy({
      by: ['feature'],
      where,
      _sum: {
        creditsChange: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          creditsChange: 'desc',
        },
      },
      take: limit,
    });

    return result.map((item: any) => ({
      feature: item.feature,
      totalCredits: item._sum.creditsChange || 0,
      usageCount: item._count,
    }));
  }

  // Get Daily Credit Usage Trend
  async getDailyUsageTrend(
    days: number = 30,
    userId?: string,
    tx?: Prisma.TransactionClient
  ): Promise<{
    date: Date;
    consumed: number;
    recharged: number;
    free_consumed: number;
    paid_consumed: number;
    unique_users: number;
  }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const client = checkAndFallbackWithNonTCClient(tx);
    const query = `
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN operation_type = 'consume' THEN credits_used ELSE 0 END) as consumed,
        SUM(CASE WHEN operation_type = 'recharge' THEN credits_used ELSE 0 END) as recharged,
        SUM(CASE WHEN credit_type = 'free' AND operation_type = 'consume' 
            THEN credits_used ELSE 0 END) as free_consumed,
        SUM(CASE WHEN credit_type = 'paid' AND operation_type = 'consume' 
            THEN credits_used ELSE 0 END) as paid_consumed,
        COUNT(DISTINCT user_id) as unique_users
      FROM credit_usage
      WHERE created_at >= $1
        AND deleted = 0
        ${userId ? 'AND user_id = $2' : ''}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const result = userId
      ? await client.$queryRawUnsafe(query, startDate, userId)
      : await client.$queryRawUnsafe(query, startDate);

    return result as {
      date: Date;
      consumed: number;
      recharged: number;
      free_consumed: number;
      paid_consumed: number;
      unique_users: number;
    }[];
  }

  // Get Recent Credit Usage Operations
  async getRecentOperations(
    userId: string,
    limit: number = 10,
    tx?: Prisma.TransactionClient
  ): Promise<CreditAuditLog[]> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.creditAuditLog.findMany({
      where: { userId, deleted: 0 },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Soft Delete Old Credit Usage Records
  async deleteOldRecords(daysToKeep: number = 365, tx?: Prisma.TransactionClient): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const client = checkAndFallbackWithNonTCClient(tx);

    const result = await client.creditAuditLog.updateMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        deleted: 0,
      },
      data: {
        deleted: 1,
      },
    });

    return result.count;
  }

  // Get System-wide Credit Usage Statistics
  async getSystemStats(tx?: Prisma.TransactionClient): Promise<{
    totalUsers: number;
    totalOperations: number;
    totalConsumed: number;
    totalRecharged: number;
    avgDailyConsumption: number;
    avgDailyRecharge: number;
  }> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const [
      totalUsers,
      totalOperations,
      consumeStats,
      rechargeStats,
    ] = await Promise.all([
      client.creditAuditLog.groupBy({
        by: ['userId'],
        where: { deleted: 0 },
      }).then((result: any[]) => result.length),
      client.creditAuditLog.count({ where: { deleted: 0 } }),
      client.creditAuditLog.aggregate({
        where: { operationType: OperationType.CONSUME, deleted: 0 },
        _sum: { creditsChange: true },
        _count: true,
      }),
      client.creditAuditLog.aggregate({
        where: { operationType: OperationType.RECHARGE, deleted: 0 },
        _sum: { creditsChange: true },
        _count: true,
      }),
    ]);

    // Calculate operating days (from first record to now)
    const firstRecord = await client.creditAuditLog.findFirst({
      where: { deleted: 0 },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    const operatingDays = firstRecord && firstRecord.createdAt
      ? Math.ceil((Date.now() - firstRecord.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 1;

    const totalConsumed = consumeStats._sum.creditsChange || 0;
    const totalRecharged = rechargeStats._sum.creditsChange || 0;

    return {
      totalUsers,
      totalOperations,
      totalConsumed,
      totalRecharged,
      avgDailyConsumption: Math.round(totalConsumed / operatingDays),
      avgDailyRecharge: Math.round(totalRecharged / operatingDays),
    };
  }

  // Check for Duplicate Operations
  async isDuplicateOperation(
    userId: string,
    operationReferId: string,
    operationType: string,
    tx?: Prisma.TransactionClient
  ): Promise<boolean> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const count = await client.creditAuditLog.count({
      where: {
        userId,
        operationReferId,
        operationType,
        deleted: 0,
      },
    });

    return count > 0;
  }
}

export const creditAuditLogService = new CreditAuditLogService();
