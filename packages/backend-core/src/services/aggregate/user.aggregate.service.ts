import { CreditType, OperationType, UserStatus } from '@core/db/constants';
import { creditService, subscriptionService, userService } from '@core/db/index';
import type { Credit, Prisma, User } from '@core/db/prisma-model-type';
import { freeAmount, freeRegisterAmount } from '@core/lib/credit-init';
import { runInTransaction } from '@core/prisma/prisma-transaction-util';


export class UserAggregateService {

  async initAnonymousUser(
    fingerprintId: string,
    options?: { sourceRef?: Prisma.InputJsonValue; }
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
   * 创建新的注册用户
   *
   * 初始化步骤（与 credit 平行）：
   * 1. 创建 User 记录
   * 2. 初始化 Credit 记录（免费积分）
   * 3. 初始化 Subscription 记录（占位符，status=INCOMPLETE）
   * 4. 记录 CreditUsage（审计）
   *
   * 后续当用户通过 Stripe 订阅时：
   * - session.completed 或 invoice.paid 会 UPDATE subscription 记录
   * - 不需要 CREATE，只需 UPDATE 确保逻辑一致
   */
  async createNewRegisteredUser(
    clerkUserId: string,
    email?: string,
    fingerprintId?: string,
    userName?: string,
    sourceRef?: Prisma.InputJsonValue,
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
      );

      await subscriptionService.initializeSubscription(newUser.userId, tx);
      return { newUser, credit };
    });
  }

  // 注意积分审查日志的处理
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

      // 先清空匿名积分并审计日志留痕
      await creditService.purgeFreeCredit(userId, 'user_registered_purge', userId, tx);
      // 再初始化完成注册获得免费积分
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
      // 根据clerkUserId查找用户
      const user = await userService.findByClerkUserId(clerkUserId, tx);
      if (!user) {
        console.log(`User with clerkUserId ${clerkUserId} not found`);
        return null;
      }
      const userId = user.userId;
      // 更改用户状态，保留user信息尤其是FingerprintId，防止反复注册薅羊毛
      await userService.unregister(user.userId);
      // 清空积分
      await creditService.purgeCredit(userId, 'soft_delete_user', userId, tx);
      
      const subscription = await subscriptionService.getActiveSubscription(userId, tx);
      if (subscription) {
        // 如果有订阅信息，则要更新
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
