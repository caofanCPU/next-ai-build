/* eslint-disable @typescript-eslint/no-explicit-any */

import { billingAggregateService } from '@core/aggregate/billing.aggregate.service';
import {
  Apilogger,
  BillingReason,
  OrderStatus,
  PaymentStatus,
  subscriptionService,
  transactionService,
  TransactionType
} from '@core/db/index';
import { Transaction } from '@core/db/prisma-model-type';
import { oneTimeExpiredDays } from '@core/lib/credit-init';
import { getCreditsFromPriceId } from '@core/lib/money-price-config';
import { fetchPaymentId, getStripe } from '@core/lib/stripe-config';
import Stripe from 'stripe';
import { viewLocalTime } from '@windrun-huaiin/lib/utils';

const mapPaymentStatus = (
  status?: Stripe.Checkout.Session['payment_status'] | null
): PaymentStatus => {
  switch (status) {
    case 'paid':
      return PaymentStatus.PAID;
    case 'no_payment_required':
      return PaymentStatus.NO_PAYMENT_REQUIRED;
    case 'unpaid':
    default:
      return PaymentStatus.UN_PAID;
  }
};

const isPaymentSettled = (paymentStatus: PaymentStatus) =>
  paymentStatus === PaymentStatus.PAID || paymentStatus === PaymentStatus.NO_PAYMENT_REQUIRED;

/**
 * Main event handler - routes events to specific handlers
 */
export async function handleStripeEvent(event: Stripe.Event) {
  console.log(`Processing Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      // ===== Checkout Events =====
      case 'checkout.session.completed':
        return await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);

      case 'checkout.session.async_payment_succeeded':
        return await handleAsyncPaymentSucceeded(event.data.object as Stripe.Checkout.Session);

      case 'checkout.session.async_payment_failed':
        return await handleAsyncPaymentFailed(event.data.object as Stripe.Checkout.Session);

      // ===== Invoice Events (Subscription renewals) =====
      case 'invoice.paid':
        return await handleInvoicePaid(event.data.object as Stripe.Invoice);

      case 'invoice.payment_failed':
        return await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);

      // ===== Subscription Events =====
      case 'customer.subscription.created':
        return await handleSubscriptionCreated(event.data.object as Stripe.Subscription);

      case 'customer.subscription.updated':
        return await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);

      case 'customer.subscription.deleted':
        return await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);

      // ===== Payment Intent Events (One-time payments) =====
      case 'payment_intent.succeeded':
        console.log(`Payment Intent succeeded: ${(event.data.object as Stripe.PaymentIntent).id}`);
        // Usually handled by checkout.session.completed
        return;

      case 'payment_intent.payment_failed':
        console.log(`Payment Intent failed: ${(event.data.object as Stripe.PaymentIntent).id}`);
        return;

      // ===== Refund Events =====
      case 'charge.refunded':
        return await handleChargeRefunded(event.data.object as Stripe.Charge);

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error processing event ${event.type}:`, error);
    throw error;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`Checkout session completed: ${session.id}`);

  // 1. Get transaction by session ID or order ID
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    throw new Error('Missing order_id in session metadata');
  }

  const transaction = await transactionService.findByOrderId(orderId);
  if (!transaction) {
    throw new Error(`Transaction not found: ${orderId}`);
  }

  if (transaction.orderStatus === OrderStatus.SUCCESS) {
    throw new Error(`Transaction already processed successfully: ${transaction.orderId}, skipping.`);
  }

  // Stripe docs: checkout.session.completed fires even when payment is pending for async methods
  // https://stripe.com/docs/payments/checkout/one-time#webhooks
  const paymentStatus = mapPaymentStatus(session.payment_status);

  if (!isPaymentSettled(paymentStatus)) {
    console.log( `Checkout session ${session.id} payment incomplete (status=${session.payment_status}), awaiting async confirmation.`
    );

    if (
      transaction.orderStatus === OrderStatus.CREATED ||
      transaction.orderStatus === OrderStatus.PENDING_UNPAID
    ) {
      await transactionService.updateStatus(orderId, OrderStatus.PENDING_UNPAID, {
        payUpdatedAt: new Date(),
        paymentStatus,
      });
    }
    return;
  }

  // 2. Route based on transaction type
  if (transaction.type === TransactionType.SUBSCRIPTION) {
    // For subscriptions, store session info and wait for invoice.paid
    return await handleSubscriptionCheckoutInit(session, transaction);
  } 
  return await handleOneTimeCheckout(session, transaction, paymentStatus);
}

async function handleSubscriptionCheckoutInit(
  session: Stripe.Checkout.Session,
  transaction: Transaction,
) {
  console.log(`Processing subscription checkout: ${session.id}`);

  // 1. Get subscription ID from session
  if (!session.subscription) {
    throw new Error('No subscription ID in checkout session');
  }

  const subscriptionId = session.subscription as string;
  const stripe = getStripe();

  // ===== STEP 1: FETCH EXTERNAL API DATA (BEFORE TRANSACTION) =====
  // 2. Get COMPLETE Stripe subscription details including billing period
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Extract billing period from subscription items (NOT from top-level subscription object)
  // The current_period_start/end are on SubscriptionItem, not on Subscription
  const subscriptionItem = stripeSubscription.items?.data?.[0];
  if (!subscriptionItem) {
    throw new Error( `No subscription items found for subscription ${subscriptionId}` );
  }

  const currentPeriodStart = subscriptionItem.current_period_start;
  const currentPeriodEnd = subscriptionItem.current_period_end;

  if (!currentPeriodStart || !currentPeriodEnd) {
    throw new Error( `Invalid subscription period from Stripe API: start=${currentPeriodStart}, end=${currentPeriodEnd}` );
  }

  const subPeriodStart = new Date(currentPeriodStart * 1000);
  const subPeriodEnd = new Date(currentPeriodEnd * 1000);

  // Log the Stripe API response with correct data structure
  const logId = await Apilogger.logStripeOutgoing(
    'stripe.subscriptions.retrieve',
    { subscriptionId },
    {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      subPeriodStart: subPeriodStart,
      subPeriodEnd: subPeriodEnd,
      subscriptionItemCount: stripeSubscription.items?.data?.length || 0,
    }
  );
  Apilogger.updateResponse(logId, stripeSubscription);

  console.log('Subscription checkout completed, just log:', {
    id: subscriptionId,
    orderId: transaction.orderId,
    status: stripeSubscription.status,
    periodStart: viewLocalTime(subPeriodStart),
    periodEnd: viewLocalTime(subPeriodEnd),
  });
}

async function handleOneTimeCheckout(
  session: Stripe.Checkout.Session,
  transaction: Transaction,
  paymentStatus: PaymentStatus
) {
  console.log(`Processing one-time payment checkout: ${session.id}`);
  // 1. Calculate one-time credit expiration
  const now = new Date();
  const oneTimePaidStart = now;
  const oneTimePaidEnd = new Date(now);
  oneTimePaidEnd.setDate(oneTimePaidEnd.getDate() + oneTimeExpiredDays);
  oneTimePaidEnd.setHours(23, 59, 59, 999);

  await billingAggregateService.completeOneTimeCheckout(
    {
      userId: transaction.userId,
      orderId: transaction.orderId,
      creditsGranted: transaction.creditsGranted || 0,
      paymentStatus,
      payTransactionId: session.payment_intent as string,
      paidEmail: session.customer_details?.email,
      paidAt: oneTimePaidStart,
      oneTimePaidStart,
      oneTimePaidEnd,
    }
  );

  console.log(`One-time payment completed: ${transaction.orderId}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`Invoice paid: ${invoice.id}`);

  // ===== STEP 1: EXTRACT AND VALIDATE DATA FROM INVOICE (BEFORE TRANSACTION) =====
  // 1. Get subscription details from invoice parent
  const parentDetails = (invoice as any).parent?.subscription_details;
  if (!parentDetails?.subscription) {
    throw new Error('Invoice not associated with subscription, skipping');
  }
  
  // 2. Check billing reason to determine payment type
  const isInitialPayment = invoice.billing_reason === BillingReason.SUBSCRIPTION_CREATE;
  const isRenewal = invoice.billing_reason === BillingReason.SUBSCRIPTION_CYCLE;
  
  // Only handle initial payments and renewals
  if (!isInitialPayment && !isRenewal) {
    throw new Error(`Unhandled invoice billing_reason: ${invoice.billing_reason}, skipping`);
  }
  
  // 3. Extract subscription period from invoice line items
  const lineItem = invoice.lines?.data?.[0];
  if (!lineItem) {
    throw new Error(`No line items found in invoice ${invoice.id}`);
  }
  
  const periodStart = (lineItem as any).period?.start;
  const periodEnd = (lineItem as any).period?.end;
  if (!periodStart || !periodEnd) {
    throw new Error( `Invalid period in invoice line: start=${periodStart}, end=${periodEnd}. Invoice ID: ${invoice.id}`
    );
  }
  const subPeriodStart = new Date(periodStart * 1000);
  const subPeriodEnd = new Date(periodEnd * 1000);
  
  const subscriptionMetadata = parentDetails.metadata || {};
  const orderId = subscriptionMetadata.order_id;
  if (!orderId) {
    throw new Error( `No order_id in subscription metadata for initial invoice ${invoice.id}. ` + `Skipping invoice URL update.` );
  }
  const transaction = await transactionService.findByOrderId(orderId);
  if (!transaction) {
    throw new Error(`Transaction not found for order_id: ${orderId}`);
  } 
  
  const subscriptionId = parentDetails.subscription;
  
  const userId = transaction.userId;
  const paymentIntentId = await fetchPaymentId(invoice.id)
  
  const invoicePaidAt = invoice.status_transitions?.paid_at;
  const paidAt = invoicePaidAt ? new Date(invoicePaidAt * 1000) : new Date();
  const paidEmail = invoice.customer_email;

  console.log('Invoice paid event key-info:', {
    invoiceId: invoice.id,
    subscriptionId,
    paymentIntentId,
    billingReason: invoice.billing_reason,
    isInitialPayment,
    paidEmail,
    paidAt: viewLocalTime(paidAt),
    periodStart: viewLocalTime(subPeriodStart),
    periodEnd: viewLocalTime(subPeriodEnd),
  });

  if (isInitialPayment) {
    // 首次订阅校验
    const nonActiveSubscription = await subscriptionService.getNonActiveSubscription(userId);
    if (!nonActiveSubscription) {
      throw new Error(`Subscription status is ACTIVE for user ${userId}, forbidden to re-active!`);
    }

    await billingAggregateService.recordSubscriptionInitPayment(
      {
        userId,
        subIdKey: nonActiveSubscription.id,
        orderId,
        paySubscriptionId: subscriptionId,
        creditsGranted: transaction.creditsGranted || 0,
        priceId: transaction.priceId,
        priceName: transaction.priceName,
        periodStart: subPeriodStart,
        periodEnd: subPeriodEnd,
        invoiceId: invoice.id,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        billingReason: invoice.billing_reason,
        paymentIntentId,
        paidAt,
        paidEmail
      }
    );

    console.log(`Initial invoice recorded for transaction: ${orderId}`);
    return;
  }

  if (isRenewal) {
    // 续订时，一定要查到订阅记录
    const subscription = await subscriptionService.findByPaySubscriptionId(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription not found for renewal: ${subscriptionId}`);
    }

    const renewalOrderId = `order_renew_${invoice.id}`;
    const existingOrder = await transactionService.findByOrderId(renewalOrderId);
    if (existingOrder) {
      throw new Error(`Renewal invoice ${invoice.id} already processed as ${existingOrder.orderId}, skipping.`);
    }

    // Get credits from current price configuration (handles plan upgrades/downgrades)
    // 优先从配置中取，取不到就以上个周期的为准作为Fallback，后续有问题再人工补偿，优先保证能用
    // 只要配置正确，这里就不会出错！
    const creditsForRenewal = subscription.priceId
      ? getCreditsFromPriceId(subscription.priceId)
      : subscription.creditsAllocated;

    const renewalCredits = creditsForRenewal || subscription.creditsAllocated;

    await billingAggregateService.recordSubscriptionRenewalPayment(
      {
        userId,
        subIdKey: subscription.id,
        orderId: renewalOrderId,
        paySubscriptionId: subscriptionId,
        creditsGranted: renewalCredits,
        priceId: subscription.priceId,
        priceName: subscription.priceName,
        periodStart: subPeriodStart,
        periodEnd: subPeriodEnd,
        invoiceId: invoice.id,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        billingReason: invoice.billing_reason,
        paymentIntentId,
        paidAt: paidAt,
        paidEmail,
        amountPaidCents: invoice.amount_paid,
        currency: invoice.currency,
      }
    );

    console.log(`Invoice renewal paid event completed, and invoiceId: ${invoice.id}, subscriptionId: ${subscription.id}, orderId: ${renewalOrderId}`);
    return;
  }
}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  const subscriptionId = stripeSubscription.id;
  console.log(`Subscription deleted: ${subscriptionId}`);

  const userCanceledAt = stripeSubscription.canceled_at;
  if (!userCanceledAt) {
    throw new Error( `Invalid period in invoice line: canceldAt=${userCanceledAt}, subscriptionId=${subscriptionId}` );
  }

  const subscription = await subscriptionService.findByPaySubscriptionId(subscriptionId);
  if (!subscription) {
    throw new Error(`Subscription id invalid: ${subscriptionId}`);
  }

  const orderId = subscription.orderId;
  if (!orderId) {
    throw new Error(`Subscription's orderId is NULL: ${subscriptionId}`);
  }

  const transaction = await transactionService.findByOrderId(orderId);
  if (!transaction) {
    throw new Error(`Subscription's orderId is illegal: subscriptionId=${subscriptionId}, orderId=${orderId}`);
  }

  const canceledAt =  new Date(userCanceledAt * 1000);
  const cancellationDetail = stripeSubscription.cancellation_details ? JSON.stringify(stripeSubscription.cancellation_details) : undefined;
  await billingAggregateService.processSubscriptionCancel(
    {
      userId: subscription.userId,
      subIdKey: subscription.id,
      orderId,
      canceledAt,
      cancellationDetail
    }
  );
  
  console.log(`Subscription status updated to canceled: ${subscription.id}`);
}

async function handleAsyncPaymentSucceeded(session: Stripe.Checkout.Session) {
  console.log(`Async payment succeeded: ${session.id}`);
  const stripe = getStripe();

  // Retrieve the latest session state to ensure payment_status is up to date
  const latestSession = await stripe.checkout.sessions.retrieve(session.id);

  return await handleCheckoutCompleted(latestSession);
}

async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session) {
  console.log(`Async payment failed: ${session.id}`);

  const orderId = session.metadata?.order_id;
  if (!orderId) {
    throw new Error(`Transaction orderId is NULL for async payment failure`);
  }

  const transaction = await transactionService.findByOrderId(orderId);
  if (!transaction) {
    throw new Error(`Transaction not found for async payment failure, orderId=${orderId}`);
  }

  if (transaction.orderStatus === OrderStatus.SUCCESS) {
    throw new Error( `Received async payment failed for already successful order ${orderId}, skipping.` );
  }

  await transactionService.updateStatus(orderId, OrderStatus.FAILED, {
    payUpdatedAt: new Date(),
    paymentStatus: PaymentStatus.UN_PAID,
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Invoice payment-failed event: ${invoice.id}`);

  const parentDetails = (invoice as any).parent?.subscription_details;
  if (!parentDetails?.subscription) {
    throw new Error('Invoice not associated with subscription, skipping');
  }

  const isInitialPayment = invoice.billing_reason === BillingReason.SUBSCRIPTION_CREATE;
  const isRenewal = invoice.billing_reason === BillingReason.SUBSCRIPTION_CYCLE;
  
  // Only handle initial payments and renewals
  if (!isInitialPayment && !isRenewal) {
    throw new Error(`Unhandled invoice billing_reason: ${invoice.billing_reason}, skipping`);
  }
  
  const subscriptionId = parentDetails.subscription;
  const subscriptionMetadata = parentDetails.metadata || {};

  // 支付ID
  const paymentIntentId = await fetchPaymentId(invoice.id)

  console.log('Invoice payment failed event key-info:', {
    invoiceId: invoice.id,
    subscriptionId,
    paymentIntentId,
    billingReason: invoice.billing_reason,
    isInitialPayment
  });

  const paidEmail = invoice.customer_email;

  const orderId = subscriptionMetadata.order_id;
  if (!orderId) {
    throw new Error( `No order_id in subscription metadata for failed initial invoice ${invoice.id}. ` + `Skipping payment failure update.` );
  }

  const transaction = await transactionService.findByOrderId(orderId);
  if (!transaction) {
    throw new Error(`Transaction not found for order_id: ${orderId}`);
  }

  // ===== CASE 1: Initial subscription payment failed =====
  if (isInitialPayment) {
    await billingAggregateService.recordInitialPaymentFailure(
      {
        orderId: transaction.orderId,
        invoiceId: invoice.id,
        paymentIntentId: paymentIntentId,
        detail: 'Initial subscription payment failed',
      }
    );
    console.log(`Initial subscription payment-failed event updated for order: ${orderId}`);
    return;
  }

  // ===== CASE 2: Subscription renewal payment failed =====
  if (isRenewal) {
    // For renewals, we need the subscription to get user info
    const subscription = await subscriptionService.findByPaySubscriptionId(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription not found for renewal payment-failed event, and invoice ${invoice.id}`);
    }

    const failedOrderId = `order_renew_failed_${invoice.id}`;
    const existingFailureOrder = await transactionService.findByOrderId(failedOrderId);
    if (existingFailureOrder) {
      throw new Error(`Renewal payment-failure event for invoice ${invoice.id} already recorded as ${failedOrderId}, skipping.`);
    }

    await billingAggregateService.recordRenewalPaymentFailure(
      {
        userId: subscription.userId,
        subIdKey: subscription.id,
        orderId: failedOrderId,
        paySubscriptionId: subscriptionId,
        creditsGranted: 0,
        priceId: subscription.priceId,
        priceName: subscription.priceName,
        periodStart: null,
        periodEnd: null,
        invoiceId: invoice.id,
        billingReason: invoice.billing_reason,
        paymentIntentId,
        amountPaidCents: invoice.amount_due,
        currency: invoice.currency,
        paidAt: null,
        paidEmail
      }
    );

    console.log(`Invoice renewal  payment-failed event completed,  and invoiceId: ${invoice.id}, recorded: ${subscription.id}, orderId: ${failedOrderId}`);
    return;
  }
  
}

async function handleSubscriptionCreated(stripeSubscription: Stripe.Subscription) {
  console.log(`Subscription created: ${stripeSubscription.id}`);
  // Usually handled by checkout.session.completed
}

/**
 * Handle subscription updated  TODO
 */
async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  console.log(`Subscription updated: ${stripeSubscription.id}`);
  const orderId = stripeSubscription.metadata?.order_id
  if (!orderId) {
    throw new Error('Missing order_id in session metadata');
  }

  // Extract period timestamps from subscription items (NOT from top-level subscription object)
  const subscriptionItem = stripeSubscription.items?.data?.[0];

  if (!subscriptionItem) {
    throw new Error(`No subscription items found for ${stripeSubscription.id}, reject!`);
  }

  const subscription = await subscriptionService.findByPaySubscriptionId(stripeSubscription.id);
  if (!subscription) {
    throw new Error(`Subscription not found in DB: ${stripeSubscription.id}`);
  }

  const isUserCancel = stripeSubscription.cancellation_details?.reason === 'cancellation_requested'
  
  // Use period from subscription item if available
  const currentPeriodStart = subscriptionItem.current_period_start;
  const currentPeriodEnd = subscriptionItem.current_period_end;

  await billingAggregateService.syncSubscriptionFromStripe(
    {
      subscription,
      status: stripeSubscription.status,
      periodStart: new Date(currentPeriodStart * 1000),
      periodEnd: new Date(currentPeriodEnd * 1000),
      orderId,
      isUserCancel
    }
  );

  console.log(`Subscription updated in DB: ${subscription.id}`);
}


async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log(`Charge refunded: ${charge.id}`);

  // Find transaction by payment intent
  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;

  if (!paymentIntentId) {
    throw new Error("PaymentId is illegal NULL");
  };

  const transaction = await transactionService.findByPayTransactionId(paymentIntentId);
  if (!transaction) {
    throw new Error(`Transaction not found for paymentId: ${paymentIntentId}`);
  };

  if (transaction.orderStatus === OrderStatus.REFUNDED) {
    throw new Error(`Transaction already marked refunded: ${transaction.orderId}, skipping.`);
  }

  if (transaction.type === TransactionType.SUBSCRIPTION) {
    const subscription = transaction.paySubscriptionId
      ? await subscriptionService.findByPaySubscriptionId(transaction.paySubscriptionId)
      : null;

    await billingAggregateService.processSubscriptionRefund(
      {
        transaction,
        subscription,
      }
    );

    console.log(`Subscription refund processed for transaction: ${transaction.orderId}`);
    return;
  }

  if (transaction.type === TransactionType.ONE_TIME) {
    await billingAggregateService.processOneTimeRefund({ transaction });

    console.log(`One-time refund processed for transaction: ${transaction.orderId}`);
    return;
  }
  // for other type, not available
  await transactionService.update(
    transaction.orderId,
    {
      orderStatus: OrderStatus.REFUNDED,
      paymentStatus: PaymentStatus.UN_PAID,
      payUpdatedAt: new Date(),
    }
  );

  console.log(`Refund processed for transaction without credit adjustments: ${transaction.orderId}`);
}
