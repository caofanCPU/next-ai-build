SELECT
    u.id               AS user_pk,
    u.user_id,
    u.status,
    u.fingerprint_id,
    u.clerk_user_id,
    u.stripe_cus_id,
    u.email,
    u.created_at       AS user_created_at,
    u.updated_at       AS user_updated_at,
    c.id               AS credit_pk,
    c.balance_free,
    c.total_free_limit,
    c.free_start,
    c.free_end,
    c.balance_paid,
    c.total_paid_limit,
    c.paid_start,
    c.paid_end,
    c.balance_onetime_paid,
    c.total_onetime_paid_limit,
    c.onetime_paid_start,
    c.onetime_paid_end,
    c.created_at       AS credit_created_at,
    c.updated_at       AS credit_updated_at,
    s.id               AS subscription_pk,
    s.status           AS subscription_status,
    s.pay_subscription_id,
    s.price_id,
    s.price_name,
    s.credits_allocated,
    s.sub_period_start,
    s.sub_period_end,
    s.created_at       AS subscription_created_at,
    s.updated_at       AS subscription_updated_at,
    s.deleted          AS subscription_deleted
  FROM public.users u
  LEFT JOIN public.credits       c ON c.user_id = u.user_id
  LEFT JOIN public.subscriptions s ON s.user_id = u.user_id
  WHERE u.user_id = '48e4619a-5b9e-47eb-a854-3eeca66856f9';


-- PostgreSQL 新增字段·重建表


-- ==============================
-- 1. 开始事务
-- ==============================
BEGIN;

-- ==============================
-- 2. 创建新表（正确字段顺序）
-- ==============================
CREATE TABLE public.transactions_new (
    id                   BIGSERIAL PRIMARY KEY,
    user_id              UUID         NOT NULL,
    order_id             VARCHAR(255) NOT NULL,
    order_status         VARCHAR(50)  NOT NULL DEFAULT 'created',
    order_created_at     TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    order_expired_at     TIMESTAMPTZ,
    order_updated_at     TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    type                 VARCHAR(50),
    pay_supplier         VARCHAR(255),
    pay_session_id       VARCHAR(255),
    pay_transaction_id   VARCHAR(255),
    pay_subscription_id  VARCHAR(255),
    sub_period_start     TIMESTAMPTZ,
    sub_period_end       TIMESTAMPTZ,
    sub_last_try_cancel_at     TIMESTAMPTZ,
    sub_period_canceled_at     TIMESTAMPTZ,
    sub_cancellation_detail    TEXT,
    price_id             VARCHAR(255),
    price_name           VARCHAR(255),
    amount               NUMERIC(10, 2),
    currency             VARCHAR(50),
    credits_granted      INTEGER      NOT NULL DEFAULT 0,
    pay_invoice_id       VARCHAR(255),
    payment_status       VARCHAR(50)  NOT NULL DEFAULT 'un_paid',
    billing_reason       VARCHAR(100),
    hosted_invoice_url   TEXT,
    invoice_pdf          TEXT,
    order_detail         TEXT,
    paid_email           VARCHAR(255),
    paid_at              TIMESTAMPTZ,
    paid_detail          TEXT,
    pay_updated_at       TIMESTAMPTZ,
    deleted              INTEGER      NOT NULL DEFAULT 0
);

-- ==============================
-- 3. 复制数据
-- ==============================
INSERT INTO public.transactions_new (
    id, user_id, order_id, order_status, order_created_at, order_expired_at,
    order_updated_at, type, pay_supplier, pay_session_id, pay_transaction_id,
    pay_subscription_id, sub_period_start, sub_period_end,
    sub_period_canceled_at, sub_cancellation_detail, price_id, price_name,
    amount, currency, credits_granted, pay_invoice_id, payment_status,
    billing_reason, hosted_invoice_url, invoice_pdf, order_detail,
    paid_email, paid_at, paid_detail, pay_updated_at, deleted
)
SELECT
    id, user_id, order_id, order_status, order_created_at, order_expired_at,
    order_updated_at, type, pay_supplier, pay_session_id, pay_transaction_id,
    pay_subscription_id, sub_period_start, sub_period_end,
    sub_period_canceled_at, sub_cancellation_detail, price_id, price_name,
    amount, currency, credits_granted, pay_invoice_id, payment_status,
    billing_reason, hosted_invoice_url, invoice_pdf, order_detail,
    paid_email, paid_at, paid_detail, pay_updated_at, deleted
FROM public.transactions;

-- ==============================
-- 4. 删除旧表（释放约束名 + 旧序列）
-- ==============================
DROP TABLE public.transactions;

-- ==============================
-- 5. 重命名新表（此时新表已有自己的序列！）
-- ==============================
ALTER TABLE public.transactions_new RENAME TO transactions;

-- ==============================
-- 6. 重建序列（新表 BIGSERIAL 自动创建了新序列）
-- ==============================
DO $$
DECLARE
    max_id BIGINT;
    seq_name TEXT;
BEGIN
    -- 获取新表自动创建的序列名
    SELECT pg_get_serial_sequence('public.transactions', 'id') INTO seq_name;
    
    -- 计算最大 ID
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM public.transactions;
    
    -- 重启序列
    IF seq_name IS NOT NULL THEN
        EXECUTE format('ALTER SEQUENCE %s RESTART WITH %s', seq_name, max_id + 1);
    END IF;
END $$;

-- ==============================
-- 7. 添加所有约束（旧约束已随 DROP TABLE 删除）
-- ==============================
ALTER TABLE public.transactions ADD CONSTRAINT transactions_order_id_key UNIQUE (order_id);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_pay_transaction_id_key UNIQUE (pay_transaction_id);

ALTER TABLE public.transactions ADD CONSTRAINT transactions_order_status_check 
  CHECK (order_status::text = ANY (ARRAY['created', 'pending_unpaid', 'success', 'refunded', 'canceled', 'failed']::text[]));

ALTER TABLE public.transactions ADD CONSTRAINT transactions_pay_supplier_check 
  CHECK (pay_supplier::text = ANY (ARRAY['Stripe', 'Apple', 'Paypal']::text[]));

ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type::text = ANY (ARRAY['subscription', 'one_time']::text[]));

ALTER TABLE public.transactions ADD CONSTRAINT transactions_payment_status_check 
  CHECK (payment_status::text = ANY (ARRAY['un_paid', 'paid', 'no_payment_required']::text[]));

ALTER TABLE public.transactions ADD CONSTRAINT transactions_deleted_check 
  CHECK (deleted = ANY (ARRAY[0, 1]));


-- ==============================
-- 8. 提交
-- ==============================
COMMIT;