import { SubscriptionStatus } from '@core/db/constants';
import { checkAndFallbackWithNonTCClient } from '@core/prisma/index';
import type { Prisma, Subscription } from '@core/db/prisma-model-type';

export class SubscriptionService {

  /**
   * Initialize a placeholder subscription record for new users
   * This allows Stripe webhook handlers to UPDATE instead of CREATE,
   * ensuring consistent logic across all subscription scenarios.
   *
   * The record will be updated once the user subscribes via Stripe.
   *
   * @param userId - The user ID to initialize subscription for
   * @returns The created placeholder subscription record
   */
  async initializeSubscription(userId: string, tx?: Prisma.TransactionClient): Promise<Subscription> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.subscription.create({
      data: {
        userId,
        status: SubscriptionStatus.INCOMPLETE,
        creditsAllocated: 0,
      },
    });
  }

  // Create a new subscription
  async createSubscription(data: {
    userId: string;
    orderId: string;
    paySubscriptionId?: string;
    priceId?: string;
    priceName?: string;
    status?: string;
    creditsAllocated: number;
    subPeriodStart?: Date;
    subPeriodEnd?: Date;
  }, tx?: Prisma.TransactionClient): Promise<Subscription> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.subscription.create({
      data: {
        userId: data.userId,
        orderId: data.orderId,
        paySubscriptionId: data.paySubscriptionId,
        priceId: data.priceId,
        priceName: data.priceName,
        status: data.status || SubscriptionStatus.INCOMPLETE,
        creditsAllocated: data.creditsAllocated,
        subPeriodStart: data.subPeriodStart,
        subPeriodEnd: data.subPeriodEnd,
      }
    });
  }

  // Find subscription by pay subscription ID
  async findByPaySubscriptionId(
    paySubscriptionId: string,
    tx?: Prisma.TransactionClient
  ): Promise<Subscription | null> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.subscription.findFirst({
      where: { paySubscriptionId, deleted: 0 }
    });
  }

  // Get user's active subscription
  async getActiveSubscription(userId: string, tx?: Prisma.TransactionClient): Promise<Subscription | null> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.subscription.findUnique({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        deleted: 0
      }
    });
  }

  async getNonActiveSubscription(userId: string, tx?: Prisma.TransactionClient): Promise<Subscription | null> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.subscription.findUnique({
      where: {
        userId,
        status: { not: SubscriptionStatus.ACTIVE },
        deleted: 0
      }
    });
  }


  // Update subscription
  async updateSubscription(
    id: bigint,
    data: Prisma.SubscriptionUpdateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Subscription> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.subscription.update({
      where: { id },
      data,
    });
  }

  // Update subscription status
  async updateStatus(
    id: bigint,
    status: string,
    tx?: Prisma.TransactionClient
  ): Promise<Subscription> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.subscription.update({
      where: { id },
      data: { status },
    });
  }

  // Update subscription period
  async updatePeriod(
    id: bigint,
    subPeriodStart: Date,
    subPeriodEnd: Date,
    tx?: Prisma.TransactionClient
  ): Promise<Subscription> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.subscription.update({
      where: { id },
      data: {
        subPeriodStart,
        subPeriodEnd,
      },
    });
  }

  // Cancel subscription
  async cancelSubscription(
    id: bigint,
    cancelAtPeriodEnd: boolean = true,
    tx?: Prisma.TransactionClient
  ): Promise<Subscription> {
    const updateData: Prisma.SubscriptionUpdateInput = {
      status: SubscriptionStatus.CANCELED,
    };

    if (!cancelAtPeriodEnd) {
      updateData.subPeriodEnd = new Date();
    }

    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.subscription.update({
      where: { id },
      data: updateData,
    });
  }

  // Renew subscription
  async renewSubscription(
    id: bigint,
    newPeriodEnd: Date,
    creditsToAdd?: number,
    tx?: Prisma.TransactionClient
  ): Promise<Subscription> {
    const client = checkAndFallbackWithNonTCClient(tx);

    const subscription = await client.subscription.findFirst({
      where: { id },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return await client.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        subPeriodStart: subscription.subPeriodEnd || new Date(),
        subPeriodEnd: newPeriodEnd,
        creditsAllocated: creditsToAdd
          ? subscription.creditsAllocated + creditsToAdd
          : subscription.creditsAllocated,
      },
    });
  }

  // Soft Delete subscription
  async deleteSubscription(id: bigint, tx?: Prisma.TransactionClient): Promise<void> {
    const client = checkAndFallbackWithNonTCClient(tx);

    await client.subscription.update({
      where: { id },
      data: { deleted: 1, status: SubscriptionStatus.INCOMPLETE },
    });
  }

  // Get expiring subscriptions (within 7 days)
  async getExpiringSubscriptions(days: number = 7, tx?: Prisma.TransactionClient): Promise<Subscription[]> {
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        deleted: 0,
        subPeriodEnd: {
          gte: now,
          lte: expiryDate,
        },
      }
    });
  }

  // Get expired subscriptions
  async getExpiredSubscriptions(tx?: Prisma.TransactionClient): Promise<Subscription[]> {
    const client = checkAndFallbackWithNonTCClient(tx);

    return await client.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        deleted: 0,
        subPeriodEnd: {
          lt: new Date(),
        },
      }
    });
  }

  // Update expired subscriptions status
  async updateExpiredSubscriptions(tx?: Prisma.TransactionClient): Promise<number> {
    const client = checkAndFallbackWithNonTCClient(tx);

    const result = await client.subscription.updateMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        deleted: 0,
        subPeriodEnd: {
          lt: new Date(),
        },
      },
      data: {
        status: SubscriptionStatus.PAST_DUE,
      },
    });

    return result.count;
  }

  // Get subscription statistics
  async getSubscriptionStats(tx?: Prisma.TransactionClient): Promise<{
    total: number;
    active: number;
    canceled: number;
    pastDue: number;
    incomplete: number;
    trialing: number;
    revenue: number;
  }> {
    const client = checkAndFallbackWithNonTCClient(tx);
    const [total, active, canceled, pastDue, incomplete, trialing] =
      await Promise.all([
        client.subscription.count({ where: { deleted: 0 } }),
        client.subscription.count({
          where: { status: SubscriptionStatus.ACTIVE, deleted: 0 }
        }),
        client.subscription.count({
          where: { status: SubscriptionStatus.CANCELED, deleted: 0 }
        }),
        client.subscription.count({
          where: { status: SubscriptionStatus.PAST_DUE, deleted: 0 }
        }),
        client.subscription.count({
          where: { status: SubscriptionStatus.INCOMPLETE, deleted: 0 }
        }),
        client.subscription.count({
          where: { status: SubscriptionStatus.TRIALING, deleted: 0 }
        }),
      ]);

    // Calculate active subscription revenue (need to combine with transaction table)
    const activeSubscriptions = await client.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE, deleted: 0 },
      select: { paySubscriptionId: true },
    });

    let revenue = 0;
    if (activeSubscriptions.length > 0) {
      const transactions = await client.transaction.findMany({
        where: {
          paySubscriptionId: {
            in: activeSubscriptions
              .map(s => s.paySubscriptionId)
              .filter(Boolean) as string[],
          },
          orderStatus: 'success',
        },
        select: { amount: true },
      });

      revenue = transactions.reduce((sum, t) =>
        sum + (t.amount ? parseFloat(t.amount.toString()) : 0), 0
      );
    }

    return { total, active, canceled, pastDue, incomplete, trialing, revenue };
  }
}

export const subscriptionService = new SubscriptionService();
