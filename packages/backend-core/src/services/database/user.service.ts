/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Prisma } from '@core/db/prisma-model-type';
import type { CoreJsonValue, User } from '@core/db/prisma-model-type';
import { UserStatus } from '@core/db/constants';
import { checkAndFallbackWithNonTCClient } from '@core/prisma/index';

export interface UpdateUserInput {
  fingerprintId?: string | null;
  sourceRef?: CoreJsonValue | null;
  clerkUserId?: string | null;
  stripeCusId?: string | null;
  email?: string | null;
  userName?: string | null;
  status?: string;
}

function toPrismaJsonValue(value: CoreJsonValue | null | undefined) {
  return value === undefined ? undefined : value;
}

export class UserService {

  // Create user
  async createUser(data: {
    fingerprintId?: string;
    sourceRef?: CoreJsonValue;
    clerkUserId?: string;
    stripeCusId?: string;
    email?: string;
    userName?: string;
    status?: string;
  }, tx?: Prisma.TransactionClient): Promise<User> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.create({
      data: {
        fingerprintId: data.fingerprintId,
        sourceRef: toPrismaJsonValue(data.sourceRef),
        clerkUserId: data.clerkUserId,
        stripeCusId: data.stripeCusId,
        email: data.email,
        userName: data.userName,
        status: data.status || UserStatus.ANONYMOUS,
      },
    });
  }

  // Find user by ID
  async findByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<User | null> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.findUnique({
      where: { userId },
    });
  }

  // Find user by email
  async findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<User | null> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.findFirst({
      where: { email },
    });
  }

  // Find users by Fingerprint ID, fp_id can be used for multi user_ids
  async findListByFingerprintId(fingerprintId: string, tx?: Prisma.TransactionClient): Promise<User[]> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.findMany({
      where: { 
        fingerprintId, 
        status: {
          not: UserStatus.DELETED
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Find user by Clerk user ID
  async findByClerkUserId(clerkUserId: string, tx?: Prisma.TransactionClient): Promise<User | null> {
    const client = checkAndFallbackWithNonTCClient(tx);

    // DB的部分索引与这里的状态查询相对应，因而可以使用findUnique
    return await client.user.findUnique({
      where: { 
        clerkUserId,
        status: {
          not: UserStatus.DELETED
        }
       }
    });
  }

  // Update user
  async updateUser(
    userId: string,
    data: UpdateUserInput,
    tx?: Prisma.TransactionClient
  ): Promise<User> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.update({
      where: { userId },
      data: {
        ...data,
        sourceRef: toPrismaJsonValue(data.sourceRef),
      },
    });
  }

  async updateStripeCustomerId(
    userId: string,
    stripeCusId: string | null,
    tx?: Prisma.TransactionClient
  ): Promise<User> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.update({
      where: { userId },
      data: { stripeCusId },
    });
  }

  // Upgrade anonymous user to registered user
  async upgradeToRegistered(
    userId: string,
    data: {
      email: string;
      clerkUserId: string;
      userName?: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<User> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.update({
      where: { userId },
      data: {
        email: data.email,
        clerkUserId: data.clerkUserId,
        userName: data.userName || undefined,
        status: UserStatus.REGISTERED,
      },
    });
  }

  async unregister(userId: string, tx?: Prisma.TransactionClient): Promise<User> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.user.update({
      where: { userId },
      data: {
        status: UserStatus.DELETED,
      },
    });
  }

  // Get user list
  async listUsers(params: {
    skip?: number;
    take?: number;
    status?: string;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }, tx?: Prisma.TransactionClient): Promise<{ users: User[]; total: number }> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const { skip = 0, take = 10, status, orderBy = { createdAt: 'desc' } } = params;

    const where: Prisma.UserWhereInput = status ? { status } : {};

    const [users, total] = await Promise.all([
      client.user.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      client.user.count({ where }),
    ]);

    return { users, total };
  }

  // 批量创建匿名用户
  async createBatchAnonymousUsers(
    fingerprintIds: string[],
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const data = fingerprintIds.map((fingerprintId) => ({
      fingerprintId,
      status: UserStatus.ANONYMOUS,
    }));

    const result = await client.user.createMany({
      data,
      skipDuplicates: true,
    });

    return result.count;
  }

  // Check if user exists
  async exists(userId: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const count = await client.user.count({
      where: { userId },
    });
    return count > 0;
  }

  // Get user statistics
  async getUserStats(tx?: Prisma.TransactionClient): Promise<{
    total: number;
    anonymous: number;
    registered: number;
    frozen: number;
    deleted: number;
  }> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const [total, anonymous, registered, frozen, deleted] = await Promise.all([
      client.user.count(),
      client.user.count({ where: { status: UserStatus.ANONYMOUS } }),
      client.user.count({ where: { status: UserStatus.REGISTERED } }),
      client.user.count({ where: { status: UserStatus.FROZEN } }),
      client.user.count({ where: { status: UserStatus.DELETED } }),
    ]);

    return { total, anonymous, registered, frozen, deleted };
  }
}

export const userService = new UserService();
