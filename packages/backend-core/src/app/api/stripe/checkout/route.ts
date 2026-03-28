import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createCheckoutSession,
  createOrGetCustomer,
  ActiveSubscriptionExistsError,
} from '@/lib/stripe-config';
import {
  transactionService,
  TransactionType,
  OrderStatus,
  PaySupplier,
  PaymentStatus
} from '@/db/index';
import { ApiAuthUtils } from '@/auth/auth-utils';
import { getPriceConfig } from '@/lib/money-price-config';

// Request validation schema
const createCheckoutSchema = z.object({
  priceId: z.string().min(1, 'PriceID is required'),
  plan: z.string().min(1, 'Plan is required'),
  billingType: z.string().min(1, 'BillingType is required'),
  provider: z.string().min(1, 'Provider is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { priceId, plan, billingType, provider } = createCheckoutSchema.parse(body);

    console.log(`Create Checkout: ${priceId} | ${plan} | ${billingType} | ${provider}`);

    // Use unified authentication to get user info
    const authUtils = new ApiAuthUtils(request);
    const { user } = await authUtils.requireAuthWithUser();

    // Validate price configuration
    const priceConfig = getPriceConfig(priceId, plan, billingType, provider);
    if (!priceConfig) {
      return NextResponse.json(
        { error: 'Invalid price configuration' },
        { status: 400 }
      );
    }

    // Create or get Stripe customer
    const customerId = await createOrGetCustomer({
      userId: user.userId,
    });

    // Generate order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Default URLs if not provided
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const defaultSuccessUrl = `${baseUrl}`;
    const defaultCancelUrl = `${baseUrl}`;

    // Create Stripe checkout session with interval for dynamic mode

    const basciParams = {
      priceId,
      customerId,
      clientReferenceId: user.userId,
      successUrl: defaultSuccessUrl,
      cancelUrl: defaultCancelUrl,
      interval: priceConfig.interval, // ✅ Pass interval to auto-determine mode
      metadata: {
        order_id: orderId,
        user_id: user.userId,
        price_name: priceConfig.priceName,
        credits_granted: priceConfig.credits?.toString() || '',
      }
    }

    const subscriptionData = {
      metadata: {
        order_id: orderId,
        user_id: user.userId,
      },
    };
    const session = await createCheckoutSession(basciParams,subscriptionData);

    // Create transaction record with session info
    const orderType = priceConfig.interval && priceConfig.interval !== 'onetime' ? TransactionType.SUBSCRIPTION : TransactionType.ONE_TIME;
    await transactionService.createTransaction({
      userId: user.userId,
      orderId,
      orderStatus: OrderStatus.CREATED,
      paymentStatus: PaymentStatus.UN_PAID,
      paySupplier: PaySupplier.STRIPE,
      paySessionId: session.id,
      priceId,
      priceName: priceConfig.priceName,
      amount: priceConfig.amount,
      currency: priceConfig.currency,
      type: orderType,
      creditsGranted: priceConfig.credits,
      orderDetail: priceConfig.description,
      paidEmail: null
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        sessionUrl: session.url,
        orderId,
        priceConfig: {
          priceName: priceConfig.priceName,
          amount: priceConfig.amount,
          currency: priceConfig.currency,
          credits: priceConfig.credits,
          description: priceConfig.description,
        },
      },
    });

  } catch (error) {
    console.error('Create checkout error:', error);

    if (error instanceof ActiveSubscriptionExistsError) {
      return NextResponse.json(
        {
          error: 'Active subscription exists',
          detail: 'Please use the customer portal to manage your existing subscription.',
        },
        { status: 409 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
