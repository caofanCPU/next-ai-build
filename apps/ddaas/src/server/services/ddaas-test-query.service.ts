import '@/server/prisma';
import { userService } from '@core/services/database';
import type { PrismaClient } from '@app-prisma';
import type { Prisma, User } from '@core/prisma';

type DdaasDbClient = PrismaClient | Prisma.TransactionClient;

export class DdaasTestQueryService {
  async findCoreUserByUserId(
    userId: string,
    _db?: DdaasDbClient,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    return userService.findByUserId(userId, tx);
  }
}

export const ddaasTestQueryService = new DdaasTestQueryService();
