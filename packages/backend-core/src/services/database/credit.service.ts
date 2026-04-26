import { Prisma } from '@core/db/prisma-model-type';
import type { Credit, CreditAuditLog } from '@core/db/prisma-model-type';
import { CreditType, OperationType } from '@core/db/constants';
import { freeExpiredDays } from '@core/lib/credit-init';
import { checkAndFallbackWithNonTCClient } from '@core/prisma/index';
import { creditAuditLogService } from '@core/db/creditAuditLog.service';

type CreditAmounts = {
  free?: number;
  paid?: number;
  oneTimePaid?: number;
};

type CreditLimitAdjustments = {
  free?: number;
  paid?: number;
  oneTimePaid?: number;
};

type CreditOperationOptions = {
  context: string;
  operationType: typeof OperationType[keyof typeof OperationType];
  updateMode: 'increment' | 'decrement';
  feature?: string;
  operationReferId: string;
  limitAdjustments?: CreditLimitAdjustments;
  defaultLimitAdjustmentsToAmounts?: boolean;
  ensureSufficientBalance?: boolean;
  ensureSufficientLimits?: boolean;
};

type CreditBalanceField = 'balanceFree' | 'balancePaid' | 'balanceOneTimePaid';
type CreditLimitField = 'totalFreeLimit' | 'totalPaidLimit' | 'totalOneTimePaidLimit';
type CreditWindowStartField = 'freeStart' | 'paidStart' | 'oneTimePaidStart';
type CreditWindowEndField = 'freeEnd' | 'paidEnd' | 'oneTimePaidEnd';

type CreditPurgeConfig = {
  amountKey: keyof Required<CreditAmounts>;
  balanceField: CreditBalanceField;
  limitField: CreditLimitField;
  startField: CreditWindowStartField;
  endField: CreditWindowEndField;
};

const CREDIT_PURGE_CONFIG: Record<
  typeof CreditType[keyof typeof CreditType],
  CreditPurgeConfig
> = {
  [CreditType.FREE]: {
    amountKey: 'free',
    balanceField: 'balanceFree',
    limitField: 'totalFreeLimit',
    startField: 'freeStart',
    endField: 'freeEnd',
  },
  [CreditType.PAID]: {
    amountKey: 'paid',
    balanceField: 'balancePaid',
    limitField: 'totalPaidLimit',
    startField: 'paidStart',
    endField: 'paidEnd',
  },
  [CreditType.ONE_TIME_PAID]: {
    amountKey: 'oneTimePaid',
    balanceField: 'balanceOneTimePaid',
    limitField: 'totalOneTimePaidLimit',
    startField: 'oneTimePaidStart',
    endField: 'oneTimePaidEnd',
  },
};


export class CreditService {

  private normalizeAmounts(amounts?: CreditAmounts): Required<CreditAmounts> {
    return {
      free: Math.trunc(amounts?.free ?? 0),
      paid: Math.trunc(amounts?.paid ?? 0),
      oneTimePaid: Math.trunc(amounts?.oneTimePaid ?? 0),
    };
  }

  private hasAnyChange(amounts: Required<CreditAmounts>): boolean {
    return amounts.free !== 0 || amounts.paid !== 0 || amounts.oneTimePaid !== 0;
  }

  private ensureNonNegative(amounts: Required<CreditAmounts>, context: string) {
    if (amounts.free < 0 || amounts.paid < 0 || amounts.oneTimePaid < 0) {
      throw new Error(`${context}: negative credit adjustments are not allowed`);
    }
  }

  private ensureSufficientBalance(current: Credit, deduction: Required<CreditAmounts>) {
    if (deduction.free > current.balanceFree) {
      throw new Error('Insufficient free credits');
    }
    if (deduction.paid > current.balancePaid) {
      throw new Error('Insufficient paid credits');
    }
    if (deduction.oneTimePaid > current.balanceOneTimePaid) {
      throw new Error('Insufficient one-time paid credits');
    }
  }

  private ensureSufficientLimits(current: Credit, deduction: Required<CreditLimitAdjustments>) {
    if (deduction.free > current.totalFreeLimit) {
      throw new Error('Insufficient free credit limit');
    }
    if (deduction.paid > current.totalPaidLimit) {
      throw new Error('Insufficient paid credit limit');
    }
    if (deduction.oneTimePaid > current.totalOneTimePaidLimit) {
      throw new Error('Insufficient one-time paid credit limit');
    }
  }

  private buildIncrementData(
    amounts: Required<CreditAmounts>,
    limitAdjustments?: Required<CreditLimitAdjustments>
  ): Prisma.CreditUpdateInput {
    const data: Prisma.CreditUpdateInput = {};
    if (amounts.free !== 0) {
      data.balanceFree = { increment: amounts.free };
      if (limitAdjustments && limitAdjustments.free !== 0) {
        data.totalFreeLimit = { increment: limitAdjustments.free };
      }
    }
    if (amounts.paid !== 0) {
      data.balancePaid = { increment: amounts.paid };
      if (limitAdjustments && limitAdjustments.paid !== 0) {
        data.totalPaidLimit = { increment: limitAdjustments.paid };
      }
    }
    if (amounts.oneTimePaid !== 0) {
      data.balanceOneTimePaid = { increment: amounts.oneTimePaid };
      if (limitAdjustments && limitAdjustments.oneTimePaid !== 0) {
        data.totalOneTimePaidLimit = { increment: limitAdjustments.oneTimePaid };
      }
    }
    return data;
  }

  private buildDecrementData(
    amounts: Required<CreditAmounts>,
    limitAdjustments?: Required<CreditLimitAdjustments>
  ): Prisma.CreditUpdateInput {
    const data: Prisma.CreditUpdateInput = {};
    if (amounts.free !== 0) {
      data.balanceFree = { decrement: amounts.free };
      if (limitAdjustments && limitAdjustments.free !== 0) {
        data.totalFreeLimit = { decrement: limitAdjustments.free };
      }
    }
    if (amounts.paid !== 0) {
      data.balancePaid = { decrement: amounts.paid };
      if (limitAdjustments && limitAdjustments.paid !== 0) {
        data.totalPaidLimit = { decrement: limitAdjustments.paid };
      }
    }
    if (amounts.oneTimePaid !== 0) {
      data.balanceOneTimePaid = { decrement: amounts.oneTimePaid };
      if (limitAdjustments && limitAdjustments.oneTimePaid !== 0) {
        data.totalOneTimePaidLimit = { decrement: limitAdjustments.oneTimePaid };
      }
    }
    return data;
  }

  private async executeCreditOperation(
    userId: string,
    amounts: CreditAmounts,
    options: CreditOperationOptions,
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditAuditLog[] }> {
    const normalized = this.normalizeAmounts(amounts);
    this.ensureNonNegative(normalized, options.context);

    if (!this.hasAnyChange(normalized)) {
      throw new Error(`${options.context}: no credit change specified`);
    }

    let normalizedLimitAdjustments: Required<CreditLimitAdjustments> | undefined;
    if (options.limitAdjustments || options.defaultLimitAdjustmentsToAmounts) {
      const raw = options.limitAdjustments ?? amounts;
      normalizedLimitAdjustments = this.normalizeAmounts(raw);
      this.ensureNonNegative(normalizedLimitAdjustments, `${options.context} limitAdjustments`);
    }

    const client = checkAndFallbackWithNonTCClient(tx);
    const currentCredit = await client.credit.findUnique({
      where: { userId },
    });

    if (!currentCredit) {
      throw new Error('User credits not found');
    }

    if (options.ensureSufficientBalance) {
      this.ensureSufficientBalance(currentCredit, normalized);
    }

    if (options.ensureSufficientLimits && normalizedLimitAdjustments) {
      this.ensureSufficientLimits(currentCredit, normalizedLimitAdjustments);
    }

    const data =
      options.updateMode === 'increment'
        ? this.buildIncrementData(normalized, normalizedLimitAdjustments)
        : this.buildDecrementData(normalized, normalizedLimitAdjustments);

    const credit = await client.credit.update({
      where: { userId },
      data,
    });

    const usage = await this.recordCreditAuditLog(client, userId, options.operationType, normalized, {
      feature: options.feature,
      operationReferId: options.operationReferId,
    });

    return { credit, usage };
  }

  private async recordCreditAuditLog(
    client: Prisma.TransactionClient,
    userId: string,
    operationType: string,
    amounts: Required<CreditAmounts>,
    options: {
      feature?: string;
      operationReferId: string;
    }
  ): Promise<CreditAuditLog[]> {
    const auditPayload: Prisma.CreditAuditLogUncheckedCreateInput[] = [];

    if (amounts.free > 0) {
      auditPayload.push({
        userId,
        feature: options.feature,
        operationReferId: options.operationReferId,
        creditType: CreditType.FREE,
        operationType,
        creditsChange: amounts.free,
      });
    }

    if (amounts.paid > 0) {
      auditPayload.push({
        userId,
        feature: options.feature,
        operationReferId: options.operationReferId,
        creditType: CreditType.PAID,
        operationType,
        creditsChange: amounts.paid,
      });
    }

    if (amounts.oneTimePaid > 0) {
      auditPayload.push({
        userId,
        feature: options.feature,
        operationReferId: options.operationReferId,
        creditType: CreditType.ONE_TIME_PAID,
        operationType,
        creditsChange: amounts.oneTimePaid,
      });
    }

    if (auditPayload.length === 0) {
      return [];
    }

    const audits: CreditAuditLog[] = [];
    for (const payload of auditPayload) {
      const auditlog = await client.creditAuditLog.create({ data: payload });
      audits.push(auditlog);
    }

    return audits;
  }

  // Initialize User Credits, use upsert for easy handle anonymous upgrade to register
  async initializeCreditWithFree(
    init: {
      userId: string,
      feature: string,
      creditType: string,
      operationType: string,
      operationReferId: string,
      creditsChange: number,
    }, 
    tx?: Prisma.TransactionClient
  ): Promise<Credit> {
    const now = new Date();
    const freeStart = now;
    const freeEnd = new Date(now);
    freeEnd.setDate(freeEnd.getDate() + freeExpiredDays);
    freeEnd.setHours(23, 59, 59, 999);
    const normalized = this.normalizeAmounts({ free: init.creditsChange });
    this.ensureNonNegative(normalized, 'initializeCredit');
    const client = checkAndFallbackWithNonTCClient(tx);

    // 这里使用upsert语义是为了代码复用，处理匿名初始化和匿名->注册的初始化
    const credit =  await client.credit.upsert({
      where: {
        userId: init.userId
      },
      update: {
        balanceFree: normalized.free,
        totalFreeLimit: normalized.free,
        freeStart: freeStart,
        freeEnd: freeEnd,
      },
      create: {
        userId: init.userId,
        balanceFree: normalized.free,
        totalFreeLimit: normalized.free,
        freeStart: freeStart,
        freeEnd: freeEnd,
      },
    });

    await creditAuditLogService.recordCreditOperation( init, tx );

    return credit;
  }

  async payFailedWatcher(
    data: {
      userId: string,
      feature: string,
      creditType: string,
      operationType: string,
      operationReferId: string
      creditsChange: number,
    }, 
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    await creditAuditLogService.recordAuditLog( data, tx );
    console.warn('payFailedWatcher completed');
  }


  // Get User Credits
  async getCredit(userId: string, tx?: Prisma.TransactionClient): Promise<Credit | null> {
    const client = checkAndFallbackWithNonTCClient(tx);

    const credit = await client.credit.findUnique({
      where: { userId },
    });

    if (!credit) {
      return null;
    }

    // Guard query result: if a credit block has no end time or is already expired, treat its balance as 0
    const now = new Date();
    const protectedCredit: Credit = { ...credit };

    if (!credit.freeEnd || now >= credit.freeEnd) {
      protectedCredit.balanceFree = 0;
    }

    if (!credit.paidEnd || now >= credit.paidEnd) {
      protectedCredit.balancePaid = 0;
    }

    if (!credit.oneTimePaidEnd || now >= credit.oneTimePaidEnd) {
      protectedCredit.balanceOneTimePaid = 0;
    }

    return protectedCredit;
  }

  // Get Total Credit Balance
  async getTotalBalance(userId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const credits = await this.getCredit(userId, tx);
    if (!credits) return 0;
    return credits.balanceFree + credits.balancePaid + credits.balanceOneTimePaid;
  }

  // Recharge Credits (Transactional)
  async rechargeCredit(
    userId: string,
    amounts: CreditAmounts,
    options: {
      operationReferId: string;
      feature?: string;
      limitAdjustments?: CreditLimitAdjustments;
    },
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditAuditLog[] }> {
    return this.executeCreditOperation(
      userId,
      amounts,
      {
        context: 'rechargeCredit',
        operationType: OperationType.RECHARGE,
        updateMode: 'increment',
        feature: options.feature,
        operationReferId: options.operationReferId,
        limitAdjustments: options.limitAdjustments,
        defaultLimitAdjustmentsToAmounts: options.limitAdjustments === undefined,
      },
      tx
    );
  }

  // Consume Credits (Transactional)
  async consumeCredit(
    userId: string,
    amounts: CreditAmounts,
    options: {
      feature: string;
      operationReferId: string;
    },
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditAuditLog[] }> {
    return this.executeCreditOperation(
      userId,
      amounts,
      {
        context: 'consumeCredit',
        operationType: OperationType.CONSUME,
        updateMode: 'decrement',
        feature: options.feature,
        operationReferId: options.operationReferId,
        ensureSufficientBalance: true,
      },
      tx
    );
  }

  // Freeze Credits
  async freezeCredit(
    userId: string,
    amounts: CreditAmounts,
    reason: string,
    operationReferId: string,
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditAuditLog[] }> {
    return this.executeCreditOperation(
      userId,
      amounts,
      {
        context: 'freezeCredit',
        operationType: OperationType.FREEZE,
        operationReferId,
        updateMode: 'decrement',
        feature: reason,
        ensureSufficientBalance: true,
      },
      tx
    );
  }

  // Unfreeze Credits
  async unfreezeCredit(
    userId: string,
    amounts: CreditAmounts,
    reason: string,
    operationReferId: string,
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditAuditLog[] }> {
    return this.executeCreditOperation(
      userId,
      amounts,
      {
        context: 'unfreezeCredit',
        operationType: OperationType.UNFREEZE,
        operationReferId,
        updateMode: 'increment',
        feature: reason,
      },
      tx
    );
  }

  // Refund Credits
  async refundCredit(
    userId: string,
    amounts: CreditAmounts,
    operationReferId: string,
    options: {
      feature?: string;
      limitAdjustments?: CreditLimitAdjustments;
    } = {},
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditAuditLog[] }> {
    return this.executeCreditOperation(
      userId,
      amounts,
      {
        context: 'refundCredit',
        operationType: OperationType.CONSUME,
        updateMode: 'decrement',
        feature: options.feature ?? 'Refund',
        operationReferId,
        limitAdjustments: options.limitAdjustments,
        defaultLimitAdjustmentsToAmounts: options.limitAdjustments === undefined,
        ensureSufficientBalance: true,
        ensureSufficientLimits: true,
      },
      tx
    );
  }

  // Batch Update Credits (Admin Operation)
  async adjustCredit(
    userId: string,
    operationReferId: string,
    adjustments: {
      balanceFree?: number;
      balancePaid?: number;
      balanceOneTimePaid?: number;
      totalFreeLimit?: number;
      totalPaidLimit?: number;
      totalOneTimePaidLimit?: number;
    },
    tx?: Prisma.TransactionClient
  ): Promise<Credit> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const currentCredit = await client.credit.findUnique({
      where: { userId },
    });
    if (!currentCredit) {
      throw new Error('User credits not found');
    }

    const nextBalanceFree = adjustments.balanceFree ?? currentCredit.balanceFree;
    const nextBalancePaid = adjustments.balancePaid ?? currentCredit.balancePaid;
    const nextBalanceOneTimePaid =
      adjustments.balanceOneTimePaid ?? currentCredit.balanceOneTimePaid;
    const nextTotalFreeLimit = adjustments.totalFreeLimit ?? currentCredit.totalFreeLimit;
    const nextTotalPaidLimit = adjustments.totalPaidLimit ?? currentCredit.totalPaidLimit;
    const nextTotalOneTimePaidLimit =
      adjustments.totalOneTimePaidLimit ?? currentCredit.totalOneTimePaidLimit;

    if (
      nextBalanceFree < 0 ||
      nextBalancePaid < 0 ||
      nextBalanceOneTimePaid < 0 ||
      nextTotalFreeLimit < 0 ||
      nextTotalPaidLimit < 0 ||
      nextTotalOneTimePaidLimit < 0
    ) {
      throw new Error('adjustCredit: credit values cannot be negative');
    }

    const increaseDiff = this.normalizeAmounts({
      free: Math.max(nextBalanceFree - currentCredit.balanceFree, 0),
      paid: Math.max(nextBalancePaid - currentCredit.balancePaid, 0),
      oneTimePaid: Math.max(
        nextBalanceOneTimePaid - currentCredit.balanceOneTimePaid,
        0
      ),
    });

    const decreaseDiff = this.normalizeAmounts({
      free: Math.max(currentCredit.balanceFree - nextBalanceFree, 0),
      paid: Math.max(currentCredit.balancePaid - nextBalancePaid, 0),
      oneTimePaid: Math.max(
        currentCredit.balanceOneTimePaid - nextBalanceOneTimePaid,
        0
      ),
    });

    const credit = await client.credit.update({
      where: { userId },
      data: {
        balanceFree: nextBalanceFree,
        balancePaid: nextBalancePaid,
        balanceOneTimePaid: nextBalanceOneTimePaid,
        totalFreeLimit: nextTotalFreeLimit,
        totalPaidLimit: nextTotalPaidLimit,
        totalOneTimePaidLimit: nextTotalOneTimePaidLimit,
      },
    });

    if (this.hasAnyChange(increaseDiff)) {
      await this.recordCreditAuditLog(client, userId, OperationType.ADJUST_INCREASE, increaseDiff, {
        feature: 'admin_adjust',
        operationReferId
      });
    }

    if (this.hasAnyChange(decreaseDiff)) {
      await this.recordCreditAuditLog(client, userId, OperationType.ADJUST_DECREASE, decreaseDiff, {
        feature: 'admin_adjust',
        operationReferId
      });
    }

    return credit;
  }

  private async purgeCreditsByTypes(
    userId: string,
    reason: string,
    operationReferId: string,
    types: Array<typeof CreditType[keyof typeof CreditType]>,
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditAuditLog[] }> {
    const uniqueTypes = Array.from(new Set(types));
    if (uniqueTypes.length === 0) {
      throw new Error('purgeCreditsByTypes: no credit types specified');
    }

    const client = checkAndFallbackWithNonTCClient(tx);
    const currentCredit = await client.credit.findUnique({ where: { userId }, });

    if (!currentCredit) {
      throw new Error('User credits not found');
    }

    const deduction: CreditAmounts = {};
    const updateData: Record<string, unknown> = {};

    for (const type of uniqueTypes) {
      const config = CREDIT_PURGE_CONFIG[type];
      if (!config) {
        throw new Error(`Unsupported credit type: ${type as string}`);
      }

      deduction[config.amountKey] = currentCredit[config.balanceField];

      updateData[config.balanceField] = 0;
      updateData[config.limitField] = 0;
      updateData[config.startField] = null;
      updateData[config.endField] = null;
    }

    const normalizedDeduction = this.normalizeAmounts(deduction);
    const credit = await client.credit.update({
      where: { userId },
      data: updateData as Prisma.CreditUpdateInput,
    });

    // 强制留痕，即使是积分变化为0也记录，操作留痕
    const usage = await this.recordCreditAuditLog(client, userId, OperationType.PURGE, normalizedDeduction, { feature: reason, operationReferId })

    return { credit, usage };
  }

  async purgePaidCredit(
    userId: string,
    reason: string,
    operationReferId: string,
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditAuditLog[] }> {
    return this.purgeCreditsByTypes(userId, reason, operationReferId, [CreditType.PAID], tx);
  }

  async purgeFreeCredit(
    userId: string,
    reason: string,
    operationReferId: string,
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditAuditLog[] }> {
    return this.purgeCreditsByTypes(userId, reason, operationReferId, [CreditType.FREE], tx);
  }

  async purgeCredit(
    userId: string,
    reason: string,
    operationReferId:string,
    tx?: Prisma.TransactionClient
  ): Promise<{ credit: Credit; usage: CreditAuditLog[] }> {
    return this.purgeCreditsByTypes(
      userId,
      reason,
      operationReferId,
      [CreditType.FREE, CreditType.PAID, CreditType.ONE_TIME_PAID],
      tx
    );
  }

  // Get Users with Low Credit Balance
  async getLowBalanceUsers(threshold: number = 10, tx?: Prisma.TransactionClient): Promise<Credit[]> {
    const client = checkAndFallbackWithNonTCClient(tx);

    const query = Prisma.sql`
      SELECT * FROM credits 
      WHERE (balance_free + balance_paid + balance_onetime_paid) < ${threshold}
      ORDER BY (balance_free + balance_paid + balance_onetime_paid) ASC
    `;

    return await client.$queryRaw<Credit[]>(query);
  }

  // Get Credit Statistics
  async getCreditStats(tx?: Prisma.TransactionClient): Promise<{
    totalUsers: number;
    totalFreeBalance: number;
    totalPaidBalance: number;
    totalOneTimePaidBalance: number;
    avgFreeBalance: number;
    avgPaidBalance: number;
    avgOneTimePaidBalance: number;
    zeroBalanceUsers: number;
  }> {
    const client = checkAndFallbackWithNonTCClient(tx);

    const stats = await client.credit.aggregate({
      _count: true,
      _sum: {
        balanceFree: true,
        balancePaid: true,
        balanceOneTimePaid: true,
      },
      _avg: {
        balanceFree: true,
        balancePaid: true,
        balanceOneTimePaid: true,
      },
    });

    const zeroBalanceUsers = await client.credit.count({
      where: {
        AND: [
          { balanceFree: 0 },
          { balancePaid: 0 },
          { balanceOneTimePaid: 0 },
        ],
      },
    });

    return {
      totalUsers: stats._count,
      totalFreeBalance: stats._sum.balanceFree || 0,
      totalPaidBalance: stats._sum.balancePaid || 0,
      totalOneTimePaidBalance: stats._sum.balanceOneTimePaid || 0,
      avgFreeBalance: Math.round(stats._avg.balanceFree || 0),
      avgPaidBalance: Math.round(stats._avg.balancePaid || 0),
      avgOneTimePaidBalance: Math.round(stats._avg.balanceOneTimePaid || 0),
      zeroBalanceUsers,
    };
  }

  // Check if User has Enough Credits
  async hasEnoughCredits(userId: string, amount: number, tx?: Prisma.TransactionClient): Promise<boolean> {
    const totalBalance = await this.getTotalBalance(userId, tx);
    return totalBalance >= amount;
  }
}

export const creditService = new CreditService();
