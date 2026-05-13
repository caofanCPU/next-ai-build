import { CreditType, OperationType, UserStatus } from '@core/db/constants';
import { creditService, subscriptionService, userService } from '@core/db/index';
import type { CoreJsonValue, Credit, Prisma, User } from '@core/db/prisma-model-type';
import { freeAmount, freeRegisterAmount } from '@core/lib/credit-init';
import { runInTransaction } from '@core/prisma/prisma-transaction-util';


export class UserAggregateService {

  async initAnonymousUser(
    fingerprintId: string,
    options?: { sourceRef?: CoreJsonValue; }
  ): Promise<{ newUser: User; credit: Credit; }> {
    return runInTransaction(async (tx) => {
      const newUser = await userService.createUser(
        {
          fingerprintId,
          sourceRef: options?.sourceRef,
          status: UserStatus.ANONYMOUS,
        },
        tx
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
        tx
      );

      await subscriptionService.initializeSubscription(newUser.userId, tx);

      return { newUser, credit };
    });
  }

  /**
   * Create a new registered user
   *
   * Initialization steps (parallel to credit):
   * 1. Create User record
   * 2. Initialize Credit record (free credits)
   * 3. Initialize Subscription record (placeholder, status=INCOMPLETE)
   * 4. Record CreditUsage (audit)
   *
   * When the user subscribes via Stripe later:
   * - session.completed or invoice.paid will UPDATE the subscription record
   * - No CREATE needed, only UPDATE to ensure logical consistency
   */
  async createNewRegisteredUser(
    clerkUserId: string,
    email?: string,
    fingerprintId?: string,
    userName?: string,
    sourceRef?: CoreJsonValue,
  ): Promise<{ newUser: User; credit: Credit; }> {
    return runInTransaction(async (tx) => {
      const newUser = await userService.createUser(
        {
          clerkUserId,
          email,
          fingerprintId,
          userName,
          sourceRef,
          status: UserStatus.REGISTERED,
        },
        tx
      );

      const credit = await creditService.initializeCreditWithFree(
        {
          userId: newUser.userId,
          feature: 'user_registration_init',
          creditType: CreditType.FREE,
          operationType: OperationType.SYS_GIFT,
          operationReferId: newUser.userId,
          creditsChange: freeRegisterAmount,
        },
        tx
      );

      await subscriptionService.initializeSubscription(newUser.userId, tx);
      return { newUser, credit };
    });
  }

  // Note: Handle credit review logs
  async upgradeToRegistered(
    userId: string,
    email: string,
    clerkUserId: string,
    userName?: string,
  ): Promise<{ updateUser: User; credit: Credit; }> {
    return runInTransaction(async (tx) => {
      const updateUser = await userService.upgradeToRegistered(
        userId,
        {
          email,
          clerkUserId,
          userName
        },
        tx
      );

      // Clear anonymous credits first and audit for traceability
      await creditService.purgeFreeCredit(userId, 'user_registered_purge', userId, tx);
      // Then initialize free credits upon successful registration
      const credit = await creditService.initializeCreditWithFree(
        {
          userId: updateUser.userId,
          feature: 'user_registration_init',
          creditType: CreditType.FREE,
          operationType: OperationType.SYS_GIFT,
          operationReferId: userId,
          creditsChange: freeRegisterAmount,
        }, 
        tx
      );
      
      return { updateUser: updateUser, credit: credit };
    });
  }

  async handleUserUnregister(clerkUserId: string): Promise<string | null> { 
    return runInTransaction(async (tx) => {
      // query DB user
      const user = await userService.findByClerkUserId(clerkUserId, tx);
      if (!user) {
        console.log(`User with clerkUserId ${clerkUserId} not found`);
        return null;
      }
      const userId = user.userId;
      // Update user status and retain user info (especially FingerprintId) to prevent repeated registration abuse
      await userService.unregister(user.userId, tx);
      // Clear credits
      await creditService.purgeCredit(userId, 'soft_delete_user', userId, tx);
      
      const subscription = await subscriptionService.getActiveSubscription(userId, tx);
      if (subscription) {
        // Update subscription info if it exists
        await subscriptionService.cancelSubscription(subscription.id, true, tx);
      }

      return user.userId;
    });
  }

  private async findUserWithRelations(
    userId: string,
    tx: Prisma.TransactionClient
  ) {
    return tx.user.findUnique({
      where: { userId },
      include: {
        credit: true,
        subscription: true,
        transactions: true,
        creditAuditLogs: true,
      },
    });
  }
}

export const userAggregateService = new UserAggregateService();
