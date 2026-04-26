import {
  creditService,
  CreditType,
  OperationType,
  OrderStatus,
  PaymentStatus,
  PaySupplier,
  subscriptionService,
  SubscriptionStatus,
  transactionService,
  TransactionType,
} from '@core/db/index';
import type { Subscription, Transaction } from '@core/db/prisma-model-type';
import { runInTransaction } from '@core/prisma/prisma-transaction-util';

type NullableString = string | null | undefined;

type BasicOrderContext = {
  userId: string;
  subIdKey: bigint;
  orderId: string;
  paySubscriptionId: string,
  creditsGranted: number;
  priceId?: NullableString;
  priceName?: NullableString;
  periodStart: Date | null;
  periodEnd: Date | null;
  invoiceId: string;
  hostedInvoiceUrl?: NullableString;
  invoicePdf?: NullableString;
  billingReason?: NullableString;
  paymentIntentId?: string;
  paidAt:  Date | null;
  paidEmail: string | null;
};

type RenewalOrderContext = BasicOrderContext & {
  // 续订时以Stripe的发票价格为准
  amountPaidCents: number;
  currency: string;
}

type SubscriptionCancelContext = {
  userId: string;
  subIdKey: bigint;
  orderId: string;
  canceledAt: Date;
  cancellationDetail?: string 
};

type SubscriptionRefundContext = {
  transaction: Transaction;
  subscription?: Subscription | null;
};

type OneTimeRefundContext = {
  transaction: Transaction;
};

class BillingAggregateService {

  async recordSubscriptionInitPayment(
    context: BasicOrderContext
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      const now = new Date();
      // 订阅截止时间统一为到期日最后1s
      const originSubPeriodEnd = context.periodEnd;
      const specialEnd = originSubPeriodEnd ? new Date(originSubPeriodEnd.setHours(23, 59, 59, 999)) : originSubPeriodEnd;
      const updatedSubscription = await subscriptionService.updateSubscription(
        context.subIdKey,
        {
          status: SubscriptionStatus.ACTIVE,
          orderId: context.orderId ?? undefined,
          paySubscriptionId: context.paySubscriptionId,
          priceId: context.priceId ?? undefined,
          priceName: context.priceName ?? undefined,
          creditsAllocated: context.creditsGranted || 0,
          subPeriodStart: context.periodStart,
          subPeriodEnd: specialEnd,
          updatedAt: now,
        },
        tx
      );


      await transactionService.update(
        context.orderId,
        {
          orderStatus: OrderStatus.SUCCESS,
          paymentStatus: PaymentStatus.PAID,
          paySubscriptionId: context.paySubscriptionId,
          subPeriodStart: context.periodStart,
          subPeriodEnd: context.periodEnd,
          payInvoiceId: context.invoiceId,
          hostedInvoiceUrl: context.hostedInvoiceUrl ?? undefined,
          invoicePdf: context.invoicePdf ?? undefined,
          billingReason: context.billingReason ?? undefined,
          payTransactionId: context.paymentIntentId ?? undefined,
          paidEmail: context.paidEmail ?? undefined,
          paidAt: context.paidAt,
          payUpdatedAt: now,
        },
        tx
      );

      if (context.creditsGranted > 0) {
        await creditService.rechargeCredit(
          context.userId,
          { paid: context.creditsGranted },
          {
            feature: TransactionType.SUBSCRIPTION,
            operationReferId: context.orderId,
          },
          tx
        );
      }

      await tx.credit.update({
        where: { userId: context.userId },
        data: {
          paidStart: context.periodStart,
          paidEnd: context.periodEnd,
        },
      });

      return updatedSubscription;
    })
  }


  async completeOneTimeCheckout(
    params: {
      userId: string;
      orderId: string;
      creditsGranted: number;
      paymentStatus: PaymentStatus;
      payTransactionId: string;
      paidAt: Date;
      paidEmail?: NullableString;
      oneTimePaidStart: Date;
      oneTimePaidEnd: Date;
    }
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      const now = new Date();

      await transactionService.update(
        params.orderId,
        {
          orderStatus: OrderStatus.SUCCESS,
          paymentStatus: params.paymentStatus,
          payTransactionId: params.payTransactionId,
          paidAt: now,
          paidEmail: params.paidEmail ?? undefined,
          payUpdatedAt: now,
        },
        tx
      );

      if (params.creditsGranted > 0) {
        await creditService.rechargeCredit(
          params.userId,
          { oneTimePaid: params.creditsGranted },
          {
            feature: TransactionType.ONE_TIME,
            operationReferId: params.orderId,
          },
          tx
        );
      }

      await tx.credit.update({
        where: { userId: params.userId },
        data: {
          oneTimePaidStart: params.oneTimePaidStart,
          oneTimePaidEnd: params.oneTimePaidEnd,
        },
      });
    });
  }

  async recordInitialInvoiceDetails(
    params: {
      orderId: string;
      invoiceId: string;
      paymentIntentId: string,
      hostedInvoiceUrl?: NullableString;
      invoicePdf?: NullableString;
      billingReason?: NullableString;
    }
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      await transactionService.update(
        params.orderId,
        {
          payInvoiceId: params.invoiceId,
          payTransactionId: params.paymentIntentId,
          hostedInvoiceUrl: params.hostedInvoiceUrl ?? undefined,
          invoicePdf: params.invoicePdf ?? undefined,
          billingReason: params.billingReason ?? undefined,
          payUpdatedAt: new Date(),
        },
        tx
      );
    });
  }

  async recordSubscriptionRenewalPayment(
    context: RenewalOrderContext
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      await transactionService.createTransaction(
        {
          userId: context.userId,
          orderId: context.orderId,
          orderStatus: OrderStatus.SUCCESS,
          paymentStatus: PaymentStatus.PAID,
          paySupplier: PaySupplier.STRIPE,
          paySubscriptionId: context.paySubscriptionId ?? undefined,
          subPeriodStart: context.periodStart ?? undefined,
          subPeriodEnd: context.periodEnd ?? undefined,
          payInvoiceId: context.invoiceId,
          hostedInvoiceUrl: context.hostedInvoiceUrl ?? undefined,
          invoicePdf: context.invoicePdf ?? undefined,
          billingReason: context.billingReason ?? undefined,
          payTransactionId: context.paymentIntentId ?? undefined,
          priceId: context.priceId ?? undefined,
          priceName: context.priceName ?? undefined,
          type: TransactionType.SUBSCRIPTION,
          amount: context.amountPaidCents / 100,
          currency: context.currency.toUpperCase(),
          creditsGranted: context.creditsGranted,
          paidAt: context.paidAt ?? undefined,
          paidEmail: context.paidEmail,
          payUpdatedAt: new Date(),
        },
        tx
      );
      // 订阅截止时间统一为到期日最后1s
      const originSubPeriodEnd = context.periodEnd;
      const specialEnd = originSubPeriodEnd ? new Date(originSubPeriodEnd.setHours(23, 59, 59, 999)) : originSubPeriodEnd;

      await subscriptionService.updateSubscription(
        context.subIdKey,
        {
          status: SubscriptionStatus.ACTIVE,
          orderId: context.orderId,
          subPeriodStart: context.periodStart,
          subPeriodEnd: specialEnd,
          updatedAt: new Date(),
        },
        tx
      );

      if (context.creditsGranted > 0) {
        await creditService.rechargeCredit(
          context.userId,
          { paid: context.creditsGranted },
          {
            feature: `${TransactionType.SUBSCRIPTION}_renewal`,
            operationReferId: context.orderId,
          },
          tx
        );
      }

      await tx.credit.update({
        where: { userId: context.userId },
        data: {
          paidStart: context.periodStart,
          paidEnd: context.periodEnd,
        },
      });
    });
  }

  async recordInitialPaymentFailure(
    params: {
      orderId: string;
      invoiceId: string;
      paymentIntentId: string;
      detail?: string;
    }
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      await transactionService.updateStatus(
        params.orderId,
        OrderStatus.FAILED,
        {
          paymentStatus: PaymentStatus.UN_PAID,
          payInvoiceId: params.invoiceId,
          payTransactionId: params.paymentIntentId,
          payUpdatedAt: new Date(),
          paidDetail: params.detail ?? undefined,
          orderDetail: params.detail ?? undefined,
        },
        tx
      );
    });
  }

  async recordRenewalPaymentFailure(
    context: RenewalOrderContext
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      await transactionService.createTransaction(
        {
          userId: context.userId,
          orderId: context.orderId,
          orderStatus: OrderStatus.FAILED,
          paymentStatus: PaymentStatus.UN_PAID,
          paySupplier: PaySupplier.STRIPE,
          paySubscriptionId: context.paySubscriptionId ?? undefined,
          payInvoiceId: context.invoiceId,
          billingReason: context.billingReason ?? undefined,
          payTransactionId: context.paymentIntentId ?? undefined,
          priceId: context.priceId ?? undefined,
          priceName: context.priceName ?? undefined,
          type: TransactionType.SUBSCRIPTION,
          amount: context.amountPaidCents / 100,
          currency: context.currency.toUpperCase(),
          creditsGranted: 0,
          paidAt: context.paidAt ?? undefined,
          paidEmail: context.paidEmail,
          payUpdatedAt: new Date(),
          orderDetail: 'Subscription renewal payment failed',
        },
        tx
      );

      await creditService.payFailedWatcher(
        {
          userId: context.userId,
          feature: `${TransactionType.SUBSCRIPTION}_renewal_failed`,
          operationReferId: context.orderId,
          creditType: CreditType.PAID,
          operationType: OperationType.RECHARGE,
          creditsChange: 0,
        },
        tx
      );

      await subscriptionService.updateSubscription(
        context.subIdKey,
        {
          status: SubscriptionStatus.PAST_DUE,
          orderId: context.orderId,
          updatedAt: new Date(),
        },
        tx
      );
    });
  }

  async syncSubscriptionFromStripe(
    params: {
      subscription: Subscription;
      status: string;
      periodStart: Date;
      periodEnd: Date;
      orderId: string,
      isUserCancel: boolean
    }
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      if (params.isUserCancel) {
          // 记录用户取消订阅的时间信息
          await transactionService.update(
            params.orderId,
            {
              subLastTryCancelAt: new Date(),
            },
            tx
          );
      }
      await subscriptionService.updateSubscription(
        params.subscription.id,
        {
          status: params.status,
          subPeriodStart: params.periodStart,
          subPeriodEnd: params.periodEnd,
          updatedAt: new Date(),
        },
        tx
      );
    });
  }

  async processSubscriptionCancel(
    context: SubscriptionCancelContext
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      // 更新订单, 记录取消信息
      await transactionService.update(
        context.orderId,
        {
          subPeriodCanceledAt: context.canceledAt,
          subCancellationDetail: context.cancellationDetail ?? undefined
        },
        tx
      )
      // 更新订阅信息
      await subscriptionService.updateStatus(context.subIdKey, SubscriptionStatus.CANCELED, tx);

      // 清理积分并留痕
      await creditService.purgePaidCredit(context.userId, 'cancel_subscription_purge', context.orderId, tx);
    })
  }
  

  async processSubscriptionRefund(
    context: SubscriptionRefundContext
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      const now = new Date();

      await transactionService.update(
        context.transaction.orderId,
        {
          orderStatus: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.UN_PAID,
          payUpdatedAt: now,
        },
        tx
      );

      const subscription =
        context.subscription ??
        (context.transaction.paySubscriptionId
          ? await subscriptionService.findByPaySubscriptionId(context.transaction.paySubscriptionId, tx)
          : null);

      if (subscription) {
        await subscriptionService.updateSubscription(
          subscription.id,
          {
            status: SubscriptionStatus.CANCELED,
            updatedAt: now,
          },
          tx
        );
      }

      const credit = await creditService.getCredit(context.transaction.userId, tx);
      const paidBalance = Math.max(credit?.balancePaid ?? 0, 0);

      if (paidBalance > 0) {
        await creditService.consumeCredit(
          context.transaction.userId,
          { paid: paidBalance },
          {
            feature: OrderStatus.REFUNDED,
            operationReferId: context.transaction.orderId,
          },
          tx
        );
      }
    });
  }

  async processOneTimeRefund(
    context: OneTimeRefundContext
  ): Promise<void> {
    await runInTransaction(async (tx) => {
      const now = new Date();

      await transactionService.update(
        context.transaction.orderId,
        {
          orderStatus: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.UN_PAID,
          payUpdatedAt: now,
        },
        tx
      );

      const credit = await creditService.getCredit(context.transaction.userId, tx);
      const currentBalance = Math.max(credit?.balanceOneTimePaid ?? 0, 0);
      const granted = Math.max(context.transaction.creditsGranted ?? 0, 0);
      const amountToConsume = Math.min(currentBalance, granted);

      if (amountToConsume > 0) {
        await creditService.consumeCredit(
          context.transaction.userId,
          { oneTimePaid: amountToConsume },
          {
            feature: OrderStatus.REFUNDED,
            operationReferId: context.transaction.orderId,
          },
          tx
        );
      }
    });
  }
}

export const billingAggregateService = new BillingAggregateService();
