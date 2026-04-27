/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Prisma } from '@core/db/prisma-model-type';
import type { UserBackup } from '@core/db/prisma-model-type';
import { checkAndFallbackWithNonTCClient, type BackendCorePrismaClient } from '@core/prisma/index';

export class UserBackupService {

  // Create user backup
  async createBackup(data: {
    originalUserId: string;
    fingerprintId?: string;
    clerkUserId?: string;
    stripeCusId?: string,
    email?: string;
    userName?: string,
    status?: string;
    backupData?: any;
  }, tx?: Prisma.TransactionClient): Promise<UserBackup> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.userBackup.create({
      data: {
        originalUserId: data.originalUserId,
        fingerprintId: data.fingerprintId,
        clerkUserId: data.clerkUserId,
        stripeCusId: data.stripeCusId,
        email: data.email,
        userName: data.userName,
        status: data.status,
        backupData: data.backupData,
      },
    });
  }

  // Backup user basic data
  async backupUserData(userId: string, tx?: Prisma.TransactionClient): Promise<UserBackup> {
    const client = checkAndFallbackWithNonTCClient(tx);
    // Get user basic data
    const userData = await client.user.findUnique({
      where: { userId },
    });

    if (!userData) {
      throw new Error('User not found');
    }

    // Create backup record
    return await this.createBackup({
      originalUserId: userData.userId,
      fingerprintId: userData.fingerprintId || undefined,
      clerkUserId: userData.clerkUserId || undefined,
      email: userData.email || undefined,
      status: userData.status,
      backupData: {
        id: userData.id.toString(),
        userId: userData.userId,
        fingerprintId: userData.fingerprintId,
        clerkUserId: userData.clerkUserId,
        email: userData.email,
        status: userData.status,
        createdAt: userData.createdAt?.toISOString(),
        updatedAt: userData.updatedAt?.toISOString(),
      },
    }, tx);
  }

  // Find backup by original user ID
  async findByOriginalUserId(
    originalUserId: string,
    tx?: Prisma.TransactionClient
  ): Promise<UserBackup[]> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.userBackup.findMany({
      where: { originalUserId, deleted: 0 },
      orderBy: { deletedAt: 'desc' },
    });
  }

  // Find backup by email
  async findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<UserBackup[]> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.userBackup.findMany({
      where: { email, deleted: 0 },
      orderBy: { deletedAt: 'desc' },
    });
  }

  // Find backup by Fingerprint ID
  async findByFingerprintId(
    fingerprintId: string,
    tx?: Prisma.TransactionClient
  ): Promise<UserBackup[]> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.userBackup.findMany({
      where: { fingerprintId, deleted: 0 },
      orderBy: { deletedAt: 'desc' },
    });
  }

  // Find backup by Clerk user ID
  async findByClerkUserId(
    clerkUserId: string,
    tx?: Prisma.TransactionClient
  ): Promise<UserBackup[]> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.userBackup.findMany({
      where: { clerkUserId, deleted: 0 },
      orderBy: { deletedAt: 'desc' },
    });
  }

  // Find backup by backup ID
  async getBackupById(id: bigint, tx?: Prisma.TransactionClient): Promise<UserBackup | null> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.userBackup.findFirst({
      where: { id, deleted: 0 },
    });
  }

  // Restore user data from backup
  async restoreUserData(backupId: bigint, tx?: Prisma.TransactionClient): Promise<{ user: unknown }> {
    const backup = await this.getBackupById(backupId, tx);
    if (!backup) {
      throw new Error('Backup not found');
    }

    const backupData = backup.backupData as any;
    if (!backupData) {
      throw new Error('No backup data available');
    }

    const restore = async (client: Prisma.TransactionClient | BackendCorePrismaClient) => {
      const user = await client.user.create({
        data: {
          fingerprintId: backupData.fingerprintId,
          clerkUserId: backupData.clerkUserId,
          email: backupData.email,
          status: backupData.status,
        },
      });

      return {
        user,
      };
    };

    return restore(checkAndFallbackWithNonTCClient(tx)) ;
  }

  // List backups
  async listBackups(params: {
    skip?: number;
    take?: number;
    startDate?: Date;
    endDate?: Date;
    orderBy?: Prisma.UserBackupOrderByWithRelationInput;
  }, tx?: Prisma.TransactionClient): Promise<{ backups: UserBackup[]; total: number }> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const where: Prisma.UserBackupWhereInput = { deleted: 0 };

    if (params.startDate || params.endDate) {
      where.deletedAt = {};
      if (params.startDate) where.deletedAt.gte = params.startDate;
      if (params.endDate) where.deletedAt.lte = params.endDate;
    }

    const [backups, total] = await Promise.all([
      client.userBackup.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 20,
        orderBy: params.orderBy || { deletedAt: 'desc' },
      }),
      client.userBackup.count({ where }),
    ]);

    return { backups, total };
  }

  // Soft Delete old backups (data cleanup)
  async deleteOldBackups(daysToKeep: number = 90, tx?: Prisma.TransactionClient): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const client = checkAndFallbackWithNonTCClient(tx);

    const result = await client.userBackup.updateMany({
      where: {
        deletedAt: {
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

  // Get backup statistics
  async getBackupStats(tx?: Prisma.TransactionClient): Promise<{
    totalBackups: number;
    last24Hours: number;
    last7Days: number;
    last30Days: number;
    avgBackupSize: number;
  }> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalBackups,
      last24Hours,
      last7Days,
      last30Days,
    ] = await Promise.all([
      client.userBackup.count({ where: { deleted: 0 } }),
      client.userBackup.count({
        where: { deletedAt: { gte: oneDayAgo }, deleted: 0 },
      }),
      client.userBackup.count({
        where: { deletedAt: { gte: sevenDaysAgo }, deleted: 0 },
      }),
      client.userBackup.count({
        where: { deletedAt: { gte: thirtyDaysAgo }, deleted: 0 },
      }),
    ]);

    // Calculate average backup size (simplified calculation)
    const sampleBackups = await client.userBackup.findMany({
      where: { deleted: 0 },
      take: 100,
      select: { backupData: true },
    });

    const avgBackupSize = sampleBackups.length > 0
      ? sampleBackups.reduce((sum: number, backup: { backupData: unknown }) => {
        const size = JSON.stringify(backup.backupData || {}).length;
        return sum + size;
      }, 0) / sampleBackups.length
      : 0;

    return {
      totalBackups,
      last24Hours,
      last7Days,
      last30Days,
      avgBackupSize: Math.round(avgBackupSize),
    };
  }

  // Export backup data as JSON
  async exportBackup(backupId: bigint, tx?: Prisma.TransactionClient): Promise<string> {
    const backup = await this.getBackupById(backupId, tx);
    if (!backup) {
      throw new Error('Backup not found');
    }

    return JSON.stringify(backup, null, 2);
  }

  // Batch backup users (for scheduled backup tasks)
  async batchBackupUsers(userIds: string[], tx?: Prisma.TransactionClient): Promise<number> {
    let successCount = 0;

    for (const userId of userIds) {
      try {
        await this.backupUserData(userId, tx);
        successCount++;
      } catch (error) {
        console.error(`Failed to backup user ${userId}:`, error);
      }
    }

    return successCount;
  }
}

export const userBackupService = new UserBackupService();
