import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createCustomerPortalSession,
  createOrGetCustomer,
} from '@/lib/stripe-config';
import { ApiAuthUtils } from '@/auth/auth-utils';
import { subscriptionService } from '@/db/index';

const createCustomerPortalSchema = z
  .object({
    returnUrl: z.string().min(1).optional(),
  })
  .optional();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = createCustomerPortalSchema.parse(body);
    const returnUrlInput = parsed?.returnUrl;

    const authUtils = new ApiAuthUtils(request);
    const { user } = await authUtils.requireAuthWithUser();

    const activeSubscription = await subscriptionService.getActiveSubscription(user.userId);
    if (!activeSubscription) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 403 }
      );
    }

    const customerId = await createOrGetCustomer({
      userId: user.userId,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resolvedReturnUrl = resolveReturnUrl(returnUrlInput, baseUrl);

    const session = await createCustomerPortalSession({
      customerId,
      returnUrl: resolvedReturnUrl,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        sessionUrl: session.url,
      },
    });
  } catch (error) {
    console.error('Create customer portal error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
}

function resolveReturnUrl(returnUrl: string | undefined, baseUrl: string): string {
  if (!returnUrl) {
    return baseUrl;
  }

  try {
    return new URL(returnUrl).toString();
  } catch {
    try {
      return new URL(returnUrl, baseUrl).toString();
    } catch {
      return baseUrl;
    }
  }
}
