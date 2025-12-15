import Stripe from 'stripe';
import { Apilogger, userService, subscriptionService } from '../services/database/index';

// Stripe Configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

// Helper function to validate webhook signature
export const validateStripeWebhook = (
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event => {
  return stripe.webhooks.constructEvent(payload, signature, secret);
};

export interface BasicCheckoutSessionParams {
  priceId: string;
  customerId?: string;
  clientReferenceId: string; // user_id
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  // ✅ New: Auto-determine mode based on interval
  interval?: string; // 'month' | 'year' | 'onetime' | undefined
  // ✅ New: Subscription metadata for webhook processing
  
}

// Helper function to create checkout session
export const createCheckoutSession = async (
  params: BasicCheckoutSessionParams,
  subscriptionData?: Stripe.Checkout.SessionCreateParams.SubscriptionData
): Promise<Stripe.Checkout.Session> => {
  const {
    priceId,
    customerId,
    clientReferenceId,
    successUrl,
    cancelUrl,
    metadata,
    interval
  } = params;

  // ✅ Dynamic mode determination: subscription if interval is not 'onetime'
  const mode: 'subscription' | 'payment' = interval && interval !== 'onetime' ? 'subscription' : 'payment';
  const isSubscriptionMode = mode === 'subscription';

  if (isSubscriptionMode) {
    if (!subscriptionData) { 
      throw new Error('Subscription data is required for subscription mode');
    }
    const activeSubscription = await subscriptionService.getActiveSubscription(clientReferenceId);
    if (activeSubscription) {
      throw new ActiveSubscriptionExistsError();
    }
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode, // ✅ Dynamic mode
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: clientReferenceId,
    metadata: {
      ...metadata,
      mode, // Record mode for webhook processing
    },
  };

  // Add customer if provided
  if (customerId) {
    sessionParams.customer = customerId;
  }

  // One-time payment specific configuration
  if (isSubscriptionMode) {
    // 在这里注入订单元数据，以保证后续事件处理能根据订单去匹配处理，只能在订阅模式里设置数据，否则Stripe报错
    sessionParams.subscription_data = subscriptionData;
  } else {
    // One-time payments don't create invoices
    sessionParams.invoice_creation = {
      enabled: false, 
    };
  }

  // Create log record with request
  const logId = await Apilogger.logStripeOutgoing('createCheckoutSession', params);

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Update log record with response
    Apilogger.updateResponse(logId, {
      session_id: session.id,
      url: session.url,
      mode: session.mode
    });

    return session;
  } catch (error) {
    // Update log record with error
    Apilogger.updateResponse(logId, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// 根据发票ID去查支付ID
export const fetchPaymentId = async (invoiceId: string ): Promise<string> => {
  const fullInvoice = await stripe.invoices.retrieve(invoiceId, {
    expand: ['payments']
  });
  const payment = fullInvoice.payments?.data[0];
  const paymentIntentInfo = payment?.payment?.payment_intent;
  const paymentIntentId = typeof paymentIntentInfo === 'string' ? paymentIntentInfo : (paymentIntentInfo as Stripe.PaymentIntent)?.id;
  return paymentIntentId;
}

// Helper function to create or retrieve customer
export const createOrGetCustomer = async (params: {
  userId: string;
}): Promise<string> => {
  const { userId } = params;

  const user = await userService.findByUserId(userId);

  if (!user) {
    throw new Error(`User not found for userId: ${userId}`);
  }

  const setStripeCustomerId = async (stripeCusId: string | null) => {
    try {
      await userService.updateStripeCustomerId(userId, stripeCusId);
    } catch (error) {
      console.error('Failed to update stripe customer id', { userId, stripeCusId, error });
    }
  };

  if (user.stripeCusId) {
    try {
      const customer = await stripe.customers.retrieve(user.stripeCusId);
      if ('deleted' in customer) {
        await setStripeCustomerId(null);
      } else {
        return customer.id;
      }
    } catch (error) {
      await setStripeCustomerId(null);
      console.warn('Failed to retrieve Stripe customer, fallback to lookup by email', {
        userId,
        stripeCusId: user.stripeCusId,
        error,
      });
    }
  }

  if (user.email) {
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      const stripeCustomer = existingCustomers.data[0];
      if (!user.stripeCusId || user.stripeCusId !== stripeCustomer.id) {
        await setStripeCustomerId(stripeCustomer.id);
      }
      return stripeCustomer.id;
    }
  }

  // 创建新客户
  const customerParams: Stripe.CustomerCreateParams = {
    metadata: {
      user_id: userId,
    },
  };

  if (user.email) {
    customerParams.email = user.email;
  }
  const derivedName = user.email ? user.email.split('@')[0] : undefined;
  if (derivedName) {
    customerParams.name = derivedName;
  }

  // Create log record with request
  const logId = await Apilogger.logStripeOutgoing('createCustomer', {
    userId,
    email: customerParams.email,
    name: customerParams.name,
  });
  
  try {
    const customer = await stripe.customers.create(customerParams);
    await setStripeCustomerId(customer.id);
    
    // Update log record with response
    Apilogger.updateResponse(logId, {
      customer_id: customer.id,
      email: customer.email
    });
    
    return customer.id;
  } catch (error) {
    // Update log record with error
    Apilogger.updateResponse(logId, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// Helper function to update subscription
export const updateSubscription = async (params: {
  subscriptionId: string;
  priceId: string;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}): Promise<Stripe.Subscription> => {
  const { subscriptionId, priceId, prorationBehavior = 'create_prorations' } = params;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Create log record with request
  const logId = await Apilogger.logStripeOutgoing('updateSubscription', params);
  
  try {
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: prorationBehavior,
    });
    
    // Update log record with response
    Apilogger.updateResponse(logId, {
      subscription_id: updatedSubscription.id,
      status: updatedSubscription.status
    });
    
    return updatedSubscription;
  } catch (error) {
    // Update log record with error
    Apilogger.updateResponse(logId, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

export const createCustomerPortalSession = async (params: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> => {
  const logId = await Apilogger.logStripeOutgoing('createCustomerPortalSession', params);

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });

    Apilogger.updateResponse(logId, {
      session_id: session.id,
      url: session.url,
    });

    return session;
  } catch (error) {
    Apilogger.updateResponse(logId, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// Helper function to cancel subscription
export const cancelSubscription = async (
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> => {
  // Create log record with request
  const logId = await Apilogger.logStripeOutgoing('cancelSubscription', {
    subscriptionId,
    cancelAtPeriodEnd
  });
  
  try {
    let result: Stripe.Subscription;
    
    if (cancelAtPeriodEnd) {
      result = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      result = await stripe.subscriptions.cancel(subscriptionId);
    }
    
    // Update log record with response
    Apilogger.updateResponse(logId, {
      subscription_id: result.id,
      status: result.status,
      cancel_at_period_end: result.cancel_at_period_end
    });
    
    return result;
  } catch (error) {
    // Update log record with error
    Apilogger.updateResponse(logId, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

export class ActiveSubscriptionExistsError extends Error {
  constructor() {
    super('ACTIVE_SUBSCRIPTION_EXISTS');
    this.name = 'ActiveSubscriptionExistsError';
  }
}
