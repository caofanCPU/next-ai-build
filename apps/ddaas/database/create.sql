-- 用户表
CREATE TABLE IF NOT EXISTS nextai.users (
    id                BIGSERIAL PRIMARY KEY,
    user_id           UUID           NOT NULL DEFAULT gen_random_uuid(),
    status            VARCHAR(50)    NOT NULL DEFAULT 'anonymous',
    fingerprint_id    VARCHAR(255),
    clerk_user_id     VARCHAR(255),
    stripe_cus_id     VARCHAR(255),
    email             VARCHAR(255),
    user_name             VARCHAR(255),
    created_at        TIMESTAMPTZ    DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ    DEFAULT CURRENT_TIMESTAMP,
    source_ref      JSONB,
    CONSTRAINT users_user_id_key UNIQUE (user_id),
    CONSTRAINT users_status_check CHECK (status::text = ANY (ARRAY['anonymous'::character varying, 'registered'::character varying, 'frozen'::character varying, 'deleted'::character varying]::text[]))
);
-- 创建用户表的部分索引
CREATE UNIQUE INDEX IF NOT EXISTS users_clerk_user_id_key 
ON nextai.users (clerk_user_id) 
WHERE status <> 'deleted'; 

CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_cus_id_key 
ON nextai.users (stripe_cus_id) 
WHERE status <> 'deleted';

CREATE INDEX IF NOT EXISTS idx_users_fingerprint_id ON nextai.users (fingerprint_id);

-- 订阅表
CREATE TABLE IF NOT EXISTS nextai.subscriptions (
    id                   BIGSERIAL PRIMARY KEY,
    user_id              UUID        NOT NULL,
    status               VARCHAR(50) NOT NULL DEFAULT 'incomplete',
    pay_subscription_id  VARCHAR(255),
    order_id             VARCHAR(255),
    price_id             VARCHAR(255),
    price_name           VARCHAR(255),
    credits_allocated    INTEGER     NOT NULL DEFAULT 0,
    sub_period_start     TIMESTAMPTZ,
    sub_period_end       TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted              INTEGER     NOT NULL DEFAULT 0,
    CONSTRAINT subscriptions_user_id_key UNIQUE (user_id),
    CONSTRAINT subscriptions_status_check CHECK (status::text = ANY (ARRAY['active'::character varying, 'canceled'::character varying, 'past_due'::character varying, 'incomplete'::character varying, 'trialing'::character varying]::text[])),
    CONSTRAINT transactions_deleted_check CHECK (deleted = ANY (ARRAY[0, 1]))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_pay_subscription_id ON nextai.subscriptions (pay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_order_id ON nextai.subscriptions (order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON nextai.subscriptions (user_id);

-- 积分表
CREATE TABLE IF NOT EXISTS nextai.credits (
    id                        BIGSERIAL PRIMARY KEY,
    user_id                   UUID        NOT NULL,
    balance_free              INTEGER     NOT NULL DEFAULT 0,
    total_free_limit          INTEGER     NOT NULL DEFAULT 0,
    free_start                TIMESTAMPTZ,
    free_end                  TIMESTAMPTZ,
    balance_paid              INTEGER     NOT NULL DEFAULT 0,
    total_paid_limit          INTEGER     NOT NULL DEFAULT 0,
    paid_start                TIMESTAMPTZ,
    paid_end                  TIMESTAMPTZ,
    balance_onetime_paid      INTEGER     NOT NULL DEFAULT 0,
    total_onetime_paid_limit  INTEGER     NOT NULL DEFAULT 0,
    onetime_paid_start        TIMESTAMPTZ,
    onetime_paid_end          TIMESTAMPTZ,
    created_at                TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT credits_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_credits_user_id ON nextai.credits (user_id);

-- 交易订单表
CREATE TABLE IF NOT EXISTS nextai.transactions (
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
    sub_period_end     TIMESTAMPTZ,
    sub_last_try_cancel_at     TIMESTAMPTZ,
    sub_period_canceled_at     TIMESTAMPTZ,
    sub_cancellation_detail          TEXT,
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
    deleted              INTEGER      NOT NULL DEFAULT 0,
    CONSTRAINT transactions_order_id_key UNIQUE (order_id),
    CONSTRAINT transactions_pay_transaction_id_key UNIQUE (pay_transaction_id),
    CONSTRAINT transactions_order_status_check CHECK (order_status::text = ANY (ARRAY['created'::character varying, 'pending_unpaid'::character varying, 'success'::character varying, 'refunded'::character varying, 'canceled'::character varying, 'failed'::character varying]::text[])),
    CONSTRAINT transactions_pay_supplier_check CHECK (pay_supplier::text = ANY (ARRAY['Stripe'::character varying, 'Apple'::character varying, 'Paypal'::character varying]::text[])),
    CONSTRAINT transactions_type_check CHECK (type::text = ANY (ARRAY['subscription'::character varying, 'one_time'::character varying]::text[])),
    CONSTRAINT transactions_payment_status_check CHECK (payment_status::text = ANY (ARRAY['un_paid'::character varying, 'paid'::character varying, 'no_payment_required'::character varying]::text[])),
    CONSTRAINT transactions_deleted_check CHECK (deleted = ANY (ARRAY[0, 1]))
);

CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON nextai.transactions (order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_pay_subscription_id ON nextai.transactions (pay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON nextai.transactions (user_id);


-- 积分使用审计表
CREATE TABLE IF NOT EXISTS nextai.credit_audit_log (
    id               BIGSERIAL PRIMARY KEY,
    user_id          UUID         NOT NULL,
    credits_change     INTEGER      NOT NULL,
    feature          VARCHAR(255),
    credit_type      VARCHAR(50)  NOT NULL,
    operation_type   VARCHAR(100)  NOT NULL,
    operation_refer_id         VARCHAR(255),
    created_at       TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    deleted          INTEGER      NOT NULL DEFAULT 0,
    CONSTRAINT credit_audit_log_deleted_check CHECK (deleted = ANY (ARRAY[0, 1]))
);

CREATE INDEX IF NOT EXISTS idx_credit_audit_log_credit_type ON nextai.credit_audit_log (credit_type);
CREATE INDEX IF NOT EXISTS idx_credit_audit_log_operation_type ON nextai.credit_audit_log (operation_type);
CREATE INDEX IF NOT EXISTS idx_credit_audit_log_user_id ON nextai.credit_audit_log (user_id);


-- 用户信息备份表
CREATE TABLE IF NOT EXISTS nextai.user_backup (
    id                BIGSERIAL PRIMARY KEY,
    original_user_id  UUID         NOT NULL,
    status            VARCHAR(50),
    fingerprint_id    VARCHAR(255),
    clerk_user_id     VARCHAR(255),
    stripe_cus_id     VARCHAR(255),
    email             VARCHAR(255),
    user_name             VARCHAR(255),
    backup_data       JSONB,
    deleted_at        TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    created_at        TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    deleted           INTEGER      NOT NULL DEFAULT 0,
    CONSTRAINT user_backup_deleted_check CHECK (deleted = ANY (ARRAY[0, 1]))
);

CREATE INDEX IF NOT EXISTS idx_user_backup_clerk_user_id ON nextai.user_backup (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_backup_email ON nextai.user_backup (email);
CREATE INDEX IF NOT EXISTS idx_user_backup_fingerprint_id ON nextai.user_backup (fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_user_backup_original_user_id ON nextai.user_backup (original_user_id);


-- 第三方对接日志审计表
CREATE TABLE IF NOT EXISTS nextai.apilog (
    id            BIGSERIAL PRIMARY KEY,
    api_type      VARCHAR(100)  NOT NULL,
    method_name   VARCHAR(255) NOT NULL,
    summary       TEXT,
    request       TEXT,
    response      TEXT,
    created_at    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

