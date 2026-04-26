import { creditService, subscriptionService, userService } from '@core/db';
import { UserStatus } from '@core/db/constants';
import type { Credit, Subscription, User } from '@core/db/prisma-model-type';
import { freeAmount } from '@core/lib/credit-init';
import { runInTransaction } from '@core/prisma/prisma-transaction-util';
import { CreditType, OperationType } from '@core/db/constants';
import { Prisma } from '@core/db/prisma-model-type';

const ANONYMOUS_INIT_LOCK_NAMESPACE = 92831;

type AnonymousInitContext = {
  user: User;
  credit: Credit | null;
  subscription: Subscription | null;
  isNewUser: boolean;
  totalUsersOnDevice: number;
  hasAnonymousUser: boolean;
};

class AnonymousAggregateService {
  private async lockFingerprintInit(
    tx: Prisma.TransactionClient,
    fingerprintId: string,
  ): Promise<void> {
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(
        ${Prisma.raw(String(ANONYMOUS_INIT_LOCK_NAMESPACE))},
        hashtext(${fingerprintId})
      )
    `;
  }

  private async findLatestUserContextByFingerprintId(
    fingerprintId: string,
    tx: Prisma.TransactionClient,
  ): Promise<AnonymousInitContext | null> {
    const existingUsers = await userService.findListByFingerprintId(fingerprintId, tx);
    if (existingUsers.length === 0) {
      return null;
    }

    const latestUser = existingUsers[0];
    const [credit, subscription] = await Promise.all([
      creditService.getCredit(latestUser.userId, tx),
      subscriptionService.getActiveSubscription(latestUser.userId, tx),
    ]);

    return {
      user: latestUser,
      credit,
      subscription,
      isNewUser: false,
      totalUsersOnDevice: existingUsers.length,
      hasAnonymousUser: true,
    };
  }

  private async createAnonymousUser(
    fingerprintId: string,
    tx: Prisma.TransactionClient,
    options?: { sourceRef?: Prisma.InputJsonValue; },
  ): Promise<AnonymousInitContext> {
    const newUser = await userService.createUser(
      {
        fingerprintId,
        sourceRef: options?.sourceRef,
        status: UserStatus.ANONYMOUS,
      },
      tx,
    );

    const credit = await creditService.initializeCreditWithFree(
      {
        userId: newUser.userId,
        feature: 'anonymous_user_init',
        creditType: CreditType.FREE,
        operationType: OperationType.SYS_GIFT,
        operationReferId: newUser.userId,
        creditsChange: freeAmount,
      },
      tx,
    );

    await subscriptionService.initializeSubscription(newUser.userId, tx);

    return {
      user: newUser,
      credit,
      subscription: null,
      isNewUser: true,
      totalUsersOnDevice: 1,
      hasAnonymousUser: true,
    };
  }

  async getOrCreateByFingerprintId(
    fingerprintId: string,
    options?: { sourceRef?: Prisma.InputJsonValue; },
  ): Promise<AnonymousInitContext> {
    return runInTransaction(async (tx) => {
      await this.lockFingerprintInit(tx, fingerprintId);

      const existingContext = await this.findLatestUserContextByFingerprintId(fingerprintId, tx);
      if (existingContext) {
        return existingContext;
      }

      return this.createAnonymousUser(fingerprintId, tx, options);
    }, 'anonymous_get_or_create_by_fingerprint_id');
  }
}

export const anonymousAggregateService = new AnonymousAggregateService();
