# Part 4: Stripe集成与API设计

本文档详细说明了每个 Stripe webhook 事件对应的数据库表操作。
使用测试卡号：
- 成功：`4242 4242 4242 4242`
- 拒绝：`4000 0000 0000 0002`
- 3D 验证：`4000 0025 0000 3155`

## 1. Stripe配置升级

### 1.1 现有配置分析
```typescript
// apps/ddaas/src/lib/stripe-config.ts (当前版本)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',  // ✅ 正确
});

export const createCheckoutSession = async (params) => {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',  // ❌ 硬编码，需要动态支持
    // ...
  };
  // ...
};
```

**问题**：
1. `mode` 硬编码为 `subscription`
2. 缺少 `payment` 模式支持
3. 缺少模式选择逻辑

### 1.2 升级后的配置

#### 1.2.1 动态模式支持
```typescript
// apps/ddaas/src/lib/stripe-config.ts (新版本)
import Stripe from 'stripe';
import { Apilogger } from '@/db/index';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

// Webhook配置
export const STRIPE_WEBHOOK_EVENTS = [
  // Checkout事件（订阅和一次性支付都会触发）
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',

  // Invoice事件（仅订阅模式）
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',

  // Subscription事件
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',

  // Payment Intent事件（仅一次性支付）
  'payment_intent.succeeded',
  'payment_intent.payment_failed',

  // Refund事件
  'charge.refunded',
] as const;

// Webhook签名验证
export const validateStripeWebhook = (
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event => {
  return stripe.webhooks.constructEvent(payload, signature, secret);
};
```

#### 1.2.2 升级createCheckoutSession（支持动态模式）
```typescript
// apps/ddaas/src/lib/stripe-config.ts

export interface CreateCheckoutSessionParams {
  priceId: string;
  customerId?: string;
  clientReferenceId: string;  // user_id
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  // ✅ 新增：根据interval自动判断模式
  interval?: string;  // 'month' | 'year' | 'onetime' | undefined
}

export const createCheckoutSession = async (
  params: CreateCheckoutSessionParams
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

  // ✅ 动态判断模式：根据interval判断
  const mode: 'subscription' | 'payment' =
    interval && interval !== 'onetime' ? 'subscription' : 'payment';

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode,  // ✅ 动态模式
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
      mode,  // 记录模式方便Webhook处理
    },
  };

  // 如果有客户ID，添加到session
  if (customerId) {
    sessionParams.customer = customerId;
  }

  // 一次性支付模式特殊配置
  if (mode === 'payment') {
    sessionParams.invoice_creation = {
      enabled: false,  // 一次性支付不创建invoice
    };
  }

  // 日志记录
  const logId = await Apilogger.logStripeOutgoing('createCheckoutSession', params);

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);

    // 更新日志
    await Apilogger.updateResponse(logId, {
      session_id: session.id,
      url: session.url,
      mode: session.mode
    });

    return session;
  } catch (error) {
    await Apilogger.updateResponse(logId, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};
```

---

## 2. API接口设计

### 2.1 统一订阅/一次性支付接口（推荐）

基于现有代码，`/api/stripe/checkout` 已经通过 `getPriceConfig` 的 `interval` 字段自动判断类型，**无需分离接口**。

#### 2.1.1 接口定义
```typescript
// POST /api/stripe/checkout
// 同时支持订阅和一次性支付

interface CreatePaymentRequest {
  priceId: string;           // Stripe价格ID
  plan: string;              // 计划键：F1/P2/U3
  billingType: string;       // 计费类型：monthly/yearly/onetime
  provider: string;          // 支付供应商：stripe/paypal
}

interface CreatePaymentResponse {
  success: boolean;
  data: {
    sessionId: string;
    sessionUrl: string;
    orderId: string;
    priceConfig: {
      priceName: string;
      amount: number;
      currency: string;
      credits: number;
      description: string;
    };
  };
}
```

#### 2.1.2 完整实现（参考现有代码风格）
```typescript
// apps/ddaas/src/app/api/stripe/checkout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createCheckoutSession,
  createOrGetCustomer,
} from '@/lib/stripe-config';
import {
  transactionService,
  TransactionType,
  OrderStatus,
  PaySupplier
} from '@/services/database';
import { ApiAuthUtils } from '@/auth/auth-utils';
import { getPriceConfig } from '@/lib/money-price-config';

// ✅ Request validation schema - 使用zod
const createPaymentSchema = z.object({
  priceId: z.string().min(1, 'PriceID is required'),
  plan: z.string().min(1, 'Plan is required'),
  billingType: z.string().min(1, 'BillingType is required'),
  provider: z.string().min(1, 'Provider is required'),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const { priceId, plan, billingType, provider } = createPaymentSchema.parse(body);

    console.log(`Create Payment: ${priceId} | ${plan} | ${billingType} | ${provider}`);

    // 2. ✅ 使用统一认证工具获取用户信息
    const authUtils = new ApiAuthUtils(request);
    const { user } = await authUtils.requireAuthWithUser();

    // 3. Validate price configuration
    const priceConfig = getPriceConfig(priceId, plan, billingType, provider);
    if (!priceConfig) {
      return NextResponse.json(
        { error: 'Invalid price configuration' },
        { status: 400 }
      );
    }

    // 4. Create or get Stripe customer
    const customer = await createOrGetCustomer({
      email: user.email || undefined,
      userId: user.userId,
      name: user.email ? user.email.split('@')[0] : undefined,
    });

    // 5. Generate order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // 6. Setup redirect URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const defaultSuccessUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancelUrl = `${baseUrl}/pricing`;

    // 7. ✅ Create Stripe checkout session (自动判断模式)
    const session = await createCheckoutSession({
      priceId,
      customerId: customer.id,
      clientReferenceId: user.userId,
      successUrl: defaultSuccessUrl,
      cancelUrl: defaultCancelUrl,
      interval: priceConfig.interval,  // ✅ 关键：传入interval自动判断模式
      metadata: {
        order_id: orderId,
        user_id: user.userId,
        price_name: priceConfig.priceName,
        credits_granted: priceConfig.credits?.toString() || '',
      },
    });

    // 8. ✅ Create transaction record (自动判断type)
    const transaction = await transactionService.createTransaction({
      userId: user.userId,
      orderId,
      orderStatus: OrderStatus.CREATED,
      paySupplier: PaySupplier.STRIPE,
      paySessionId: session.id,
      priceId,
      priceName: priceConfig.priceName,
      amount: priceConfig.amount,
      currency: priceConfig.currency,
      type: priceConfig.interval && priceConfig.interval !== 'onetime'
        ? TransactionType.SUBSCRIPTION
        : TransactionType.ONE_TIME,  // ✅ 自动判断类型
      creditsGranted: priceConfig.credits,
      orderDetail: priceConfig.description,
    });

    // 9. Return response
    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        sessionUrl: session.url,
        orderId: transaction.orderId,
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
    console.error('Create payment error:', error);

    // ✅ Zod validation error handling
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    );
  }
}
```

**关键改进点**：
1. ✅ 使用 `ApiAuthUtils` 统一认证
2. ✅ 使用 `zod` schema 验证参数
3. ✅ 使用 `getPriceConfig` 自动区分订阅/一次性支付
4. ✅ 通过 `interval` 字段自动判断 `mode` 和 `type`
5. ✅ 单一接口支持所有支付场景

---

## 3. Webhook事件处理详解

### 3.1 Webhook接口主入口

```typescript
// apps/ddaas/src/app/api/webhook/stripe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { validateStripeWebhook } from '@/lib/stripe-config';
import Stripe from 'stripe';
import { Apilogger } from '@/db/index';

export async function POST(request: NextRequest) {
  try {
    // 1. 获取原始请求体和签名
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // 2. 验证Webhook签名
    const event = validateStripeWebhook(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // 3. 幂等性检查
    const isProcessed = await checkEventProcessed(event.id);
    if (isProcessed) {
      console.log(`Event ${event.id} already processed`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 4. 日志记录
    await Apilogger.logStripeIncoming(event.type, event);

    // 5. 分发事件处理
    await handleStripeEvent(event);

    // 6. 标记为已处理
    await markEventAsProcessed(event.id);

    // 7. 返回成功响应
    return NextResponse.json({ received: true });

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

// 幂等性检查（使用Redis或数据库）
async function checkEventProcessed(eventId: string): Promise<boolean> {
  // 实现：检查Redis或数据库中是否已处理该事件
  const key = `stripe:event:${eventId}`;
  const exists = await redis.exists(key);
  return exists > 0;
}

async function markEventAsProcessed(eventId: string): Promise<void> {
  // 实现：标记事件已处理（TTL: 30天）
  const key = `stripe:event:${eventId}`;
  await redis.setex(key, 30 * 24 * 3600, 'processed');
}
```

### 3.2 事件分发处理器

```typescript
// apps/ddaas/src/services/stripe/webhook-handler.ts

import Stripe from 'stripe';
import {
  transactionService,
  subscriptionService,
  creditService,
  TransactionType,
  OrderStatus
} from '@/db/index';

async function handleStripeEvent(event: Stripe.Event) {
  console.log(`Processing event: ${event.type}`);

  switch (event.type) {
    // ===== Checkout事件 =====
    case 'checkout.session.completed':
      return await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);

    case 'checkout.session.async_payment_succeeded':
      return await handleAsyncPaymentSucceeded(event.data.object as Stripe.Checkout.Session);

    case 'checkout.session.async_payment_failed':
      return await handleAsyncPaymentFailed(event.data.object as Stripe.Checkout.Session);

    // ===== Invoice事件（订阅续费） =====
    case 'invoice.paid':
      return await handleInvoicePaid(event.data.object as Stripe.Invoice);

    case 'invoice.payment_failed':
      return await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);

    // ===== Subscription事件 =====
    case 'customer.subscription.created':
      return await handleSubscriptionCreated(event.data.object as Stripe.Subscription);

    case 'customer.subscription.updated':
      return await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);

    case 'customer.subscription.deleted':
      return await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);

    // ===== Payment Intent事件（一次性支付） =====
    case 'payment_intent.succeeded':
      return await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);

    case 'payment_intent.payment_failed':
      return await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);

    // ===== Refund事件 =====
    case 'charge.refunded':
      return await handleChargeRefunded(event.data.object as Stripe.Charge);

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}
```

---

### 3.3 关键事件处理逻辑

#### 3.3.1 checkout.session.completed
**作用**：处理首次支付成功（订阅和一次性支付都会触发）

```typescript
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`Checkout completed: ${session.id}`);

  // 1. 获取订单信息
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    throw new Error('Missing order_id in session metadata');
  }

  const transaction = await transactionService.findByOrderId(orderId);
  if (!transaction) {
    throw new Error(`Transaction not found: ${orderId}`);
  }

  // 2. ✅ 根据Transaction.type分发处理
  if (transaction.type === TransactionType.SUBSCRIPTION) {
    return await handleSubscriptionCheckout(session, transaction);
  } else if (transaction.type === TransactionType.ONE_TIME) {
    return await handleOneTimeCheckout(session, transaction);
  } else {
    throw new Error(`Unknown transaction type: ${transaction.type}`);
  }
}

// 订阅支付处理
async function handleSubscriptionCheckout(
  session: Stripe.Checkout.Session,
  transaction: Transaction
) {
  return await prisma.$transaction(async (tx) => {
    // 1. 获取Stripe订阅详情
    const stripeSubscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // 2. ✅ 从Stripe获取订阅周期
    const subPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    const subPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);

    // 3. 创建Subscription记录
    const subscription = await tx.subscription.create({
      data: {
        userId: transaction.userId,
        paySubscriptionId: stripeSubscription.id,
        priceId: transaction.priceId,
        priceName: transaction.priceName,
        status: stripeSubscription.status,
        creditsAllocated: transaction.creditsGranted || 0,
        subPeriodStart,
        subPeriodEnd,
      },
    });

    // 4. 更新Transaction状态
    await tx.transaction.update({
      where: { orderId: transaction.orderId },
      data: {
        orderStatus: OrderStatus.SUCCESS,
        paySubscriptionId: stripeSubscription.id,
        payTransactionId: session.payment_intent as string,
        paidAt: new Date(),
        paidEmail: session.customer_details?.email,
        payUpdatedAt: new Date(),
      },
    });

    // 5. ✅ 充值订阅积分
    await tx.credit.update({
      where: { userId: transaction.userId },
      data: {
        balancePaid: { increment: transaction.creditsGranted || 0 },
        totalPaidLimit: { increment: transaction.creditsGranted || 0 },
        paidStart: subPeriodStart,  // ✅ 与订阅周期一致
        paidEnd: subPeriodEnd,       // ✅ 与订阅周期一致
      },
    });

    // 6. 记录CreditUsage
    await tx.creditUsage.create({
      data: {
        userId: transaction.userId,
        feature: 'subscription',
        orderId: transaction.orderId,
        creditType: 'paid',
        operationType: 'recharge',
        creditsUsed: transaction.creditsGranted || 0,
      },
    });

    console.log(`Subscription created: ${subscription.id}`);
    return subscription;
  });
}

// 一次性支付处理
async function handleOneTimeCheckout(
  session: Stripe.Checkout.Session,
  transaction: Transaction
) {
  return await prisma.$transaction(async (tx) => {
    // 1. 更新Transaction状态
    await tx.transaction.update({
      where: { orderId: transaction.orderId },
      data: {
        orderStatus: OrderStatus.SUCCESS,
        payTransactionId: session.payment_intent as string,
        paidAt: new Date(),
        paidEmail: session.customer_details?.email,
        payUpdatedAt: new Date(),
      },
    });

    // 2. ✅ 计算一次性积分有效期（1年）
    const now = new Date();
    const oneTimePaidStart = now;
    const oneTimePaidEnd = new Date(now);
    oneTimePaidEnd.setDate(oneTimePaidEnd.getDate() + 365);
    oneTimePaidEnd.setHours(23, 59, 59, 999);

    // 3. ✅ 充值一次性购买积分
    await tx.credit.update({
      where: { userId: transaction.userId },
      data: {
        balanceOneTimePaid: { increment: transaction.creditsGranted || 0 },
        totalOneTimePaidLimit: { increment: transaction.creditsGranted || 0 },
        oneTimePaidStart,
        oneTimePaidEnd,
      },
    });

    // 4. 记录CreditUsage
    await tx.creditUsage.create({
      data: {
        userId: transaction.userId,
        feature: 'credit_pack',
        orderId: transaction.orderId,
        creditType: 'paid',
        operationType: 'recharge',
        creditsUsed: transaction.creditsGranted || 0,
      },
    });

    console.log(`One-time payment completed: ${transaction.orderId}`);
  });
}
```

#### 3.3.2 invoice.paid
**作用**：处理订阅续费成功

```typescript
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`Invoice paid: ${invoice.id}`);

  // 1. 获取订阅ID
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) {
    console.warn('Invoice not associated with subscription, skipping');
    return;
  }

  // 2. 查询订阅记录
  const subscription = await subscriptionService.findByPaySubscriptionId(subscriptionId);
  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionId}`);
  }

  // 3. 检查是否为首次支付（已在checkout.session.completed处理）
  const isInitialPayment = invoice.billing_reason === 'subscription_create';
  if (isInitialPayment) {
    console.log('Initial payment, already handled in checkout.session.completed');
    return;
  }

  // 4. ✅ 处理续费
  return await prisma.$transaction(async (tx) => {
    // 4.1 从Invoice获取新的计费周期
    const newSubPeriodStart = new Date(invoice.period_start * 1000);
    const newSubPeriodEnd = new Date(invoice.period_end * 1000);

    // 4.2 更新Subscription记录
    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        subPeriodStart: newSubPeriodStart,
        subPeriodEnd: newSubPeriodEnd,
        updatedAt: new Date(),
      },
    });

    // 4.3 创建续费Transaction记录
    const renewalOrderId = `order_renew_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    await tx.transaction.create({
      data: {
        userId: subscription.userId,
        orderId: renewalOrderId,
        orderStatus: OrderStatus.SUCCESS,
        paySupplier: PaySupplier.STRIPE,
        paySubscriptionId: subscriptionId,
        payInvoiceId: invoice.id,
        payTransactionId: invoice.payment_intent as string,
        priceId: subscription.priceId,
        priceName: subscription.priceName,
        type: TransactionType.SUBSCRIPTION,
        amount: invoice.amount_paid / 100,  // 转为元
        currency: invoice.currency.toUpperCase(),
        creditsGranted: subscription.creditsAllocated,
        subPeriodStart: newSubPeriodStart,
        subPeriodEnd: newSubPeriodEnd,
        paidAt: new Date(invoice.created * 1000),
        payUpdatedAt: new Date(),
      },
    });

    // 4.4 ✅ 充值订阅积分并更新有效期
    await tx.credit.update({
      where: { userId: subscription.userId },
      data: {
        balancePaid: { increment: subscription.creditsAllocated },
        totalPaidLimit: { increment: subscription.creditsAllocated },
        paidStart: newSubPeriodStart,  // ✅ 更新为新周期
        paidEnd: newSubPeriodEnd,       // ✅ 更新为新周期
      },
    });

    // 4.5 记录CreditUsage
    await tx.creditUsage.create({
      data: {
        userId: subscription.userId,
        feature: 'subscription_renewal',
        orderId: renewalOrderId,
        creditType: 'paid',
        operationType: 'recharge',
        creditsUsed: subscription.creditsAllocated,
      },
    });

    console.log(`Subscription renewed: ${subscription.id}`);
  });
}
```

#### 3.3.3 customer.subscription.deleted
**作用**：处理订阅取消

```typescript
async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  console.log(`Subscription deleted: ${stripeSubscription.id}`);

  const subscription = await subscriptionService.findByPaySubscriptionId(stripeSubscription.id);
  if (!subscription) {
    console.warn(`Subscription not found in DB: ${stripeSubscription.id}`);
    return;
  }

  await subscriptionService.updateStatus(subscription.id, 'canceled');
  console.log(`Subscription status updated to canceled: ${subscription.id}`);
}
```

---

## 4. 总结

### 4.1 基于现有代码的优势
1. ✅ **统一认证**：`ApiAuthUtils` 封装，避免重复代码
2. ✅ **参数验证**：`zod` schema，类型安全 + 自动验证
3. ✅ **智能配置**：`getPriceConfig` 自动区分订阅/一次性支付
4. ✅ **单一接口**：通过 `interval` 字段自动判断模式，无需分离API
5. ✅ **类型定义**：`TransactionType`, `OrderStatus` 等常量统一管理

### 4.2 核心实现要点
1. ✅ **动态模式支持**：升级 `createCheckoutSession` 支持 `interval` 参数
2. ✅ **自动类型判断**：
   ```typescript
   // 在API中
   type: priceConfig.interval && priceConfig.interval !== 'onetime'
     ? TransactionType.SUBSCRIPTION
     : TransactionType.ONE_TIME

   // 在Webhook中
   if (transaction.type === TransactionType.SUBSCRIPTION) {
     // 订阅处理：创建Subscription + balancePaid
   } else {
     // 一次性支付：仅 balanceOneTimePaid
   }
   ```

3. ✅ **积分有效期管理**：
   - 订阅积分：`paidEnd = subPeriodEnd`（Stripe管理）
   - 一次性积分：`oneTimePaidEnd = now + 365天`（固定）

### 4.3 下一步实施
1. 升级 `stripe-config.ts` 的 `createCheckoutSession` 函数
2. 更新 Webhook 处理逻辑（添加 `handleOneTimeCheckout`）
3. 数据库迁移（执行 part2.md 中的SQL脚本）
4. 测试验证（Stripe测试环境）

完整的设计文档已就绪，可以开始代码实现！🚀
