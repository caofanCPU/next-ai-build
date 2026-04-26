import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { validateStripeWebhook } from '@core/lib/stripe-config';
import Stripe from 'stripe';
import { Apilogger } from '@core/db/apilog.service';
import { handleStripeEvent } from '@core/stripe/webhook-handler';

// Disable body parsing, need raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 1. Get raw request body and signature
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    // 2. Validate webhook signature
    const event = validateStripeWebhook(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`Received webhook event: ${event.type} | ID: ${event.id}`);

    // 3. Log incoming webhook and capture log ID for later updates
    const logId = await Apilogger.logStripeIncoming(event.type, event.id, event);

    try {
      // 4. Handle the event
      await handleStripeEvent(event);

      // 5. Update log with success response
      const processingResult = {
        success: true,
        message: 'Event processed successfully'
      };

      Apilogger.updateResponse(logId, processingResult);

      return NextResponse.json({ received: true });
    } catch (handlerError) {
      console.error('Stripe webhook processing error:', handlerError);

      const errorResult = {
        success: false,
        error:
          handlerError instanceof Error
            ? handlerError.message
            : 'Unknown error',
        stack: handlerError instanceof Error ? handlerError.stack : undefined,
      };

      Apilogger.updateResponse(logId, errorResult);

      return NextResponse.json(
        { error: 'Webhook processing failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Webhook error:', error);

    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
