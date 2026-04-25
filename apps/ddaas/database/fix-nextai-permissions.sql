-- 多 schema 权限纠偏脚本
-- 用途：
-- 1. 回收 anon/authenticated/service_role 的宽权限
-- 2. 为每个 schema 创建独立业务账户
-- 3. 只授予对应业务账户访问对应 schema 的最小必需权限
-- 4. 为后续由 postgres 创建的新对象配置默认权限
--
-- 密码占位说明：
-- 1. 这里统一使用 XXX账户名 作为占位
-- 2. 实际执行前请替换为真实密码



-- =========================
-- nextai
-- 账户：nextai_app
-- 密码：XXXnextai_app
-- =========================

REVOKE ALL ON SCHEMA nextai FROM anon, authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA nextai FROM anon, authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA nextai FROM anon, authenticated, service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA nextai FROM anon, authenticated, service_role;

REVOKE ALL ON SCHEMA nextai FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA nextai FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA nextai FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA nextai FROM PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'nextai_app'
  ) THEN
    CREATE ROLE nextai_app
      LOGIN
      PASSWORD 'XXXnextai_app';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE postgres TO nextai_app;
GRANT USAGE ON SCHEMA nextai TO nextai_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA nextai TO nextai_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA nextai TO nextai_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA nextai TO nextai_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA nextai
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA nextai
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nextai_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA nextai
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO nextai_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA nextai
  GRANT EXECUTE ON FUNCTIONS TO nextai_app;





-- =========================
-- diaomao
-- 账户：diaomao_app
-- 密码：XXXdiaomao_app
-- =========================

REVOKE ALL ON SCHEMA diaomao FROM anon, authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA diaomao FROM anon, authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA diaomao FROM anon, authenticated, service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA diaomao FROM anon, authenticated, service_role;

REVOKE ALL ON SCHEMA diaomao FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA diaomao FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA diaomao FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA diaomao FROM PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'diaomao_app'
  ) THEN
    CREATE ROLE diaomao_app
      LOGIN
      PASSWORD 'XXXdiaomao_app';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE postgres TO diaomao_app;
GRANT USAGE ON SCHEMA diaomao TO diaomao_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA diaomao TO diaomao_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA diaomao TO diaomao_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA diaomao TO diaomao_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA diaomao
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA diaomao
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO diaomao_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA diaomao
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO diaomao_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA diaomao
  GRANT EXECUTE ON FUNCTIONS TO diaomao_app;





-- =========================
-- faq
-- 账户：faq_app
-- 密码：XXXfaq_app
-- =========================

REVOKE ALL ON SCHEMA faq FROM anon, authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA faq FROM anon, authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA faq FROM anon, authenticated, service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA faq FROM anon, authenticated, service_role;

REVOKE ALL ON SCHEMA faq FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA faq FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA faq FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA faq FROM PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'faq_app'
  ) THEN
    CREATE ROLE faq_app
      LOGIN
      PASSWORD 'XXXfaq_app';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE postgres TO faq_app;
GRANT USAGE ON SCHEMA faq TO faq_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA faq TO faq_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA faq TO faq_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA faq TO faq_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA faq
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA faq
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO faq_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA faq
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO faq_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA faq
  GRANT EXECUTE ON FUNCTIONS TO faq_app;





-- =========================
-- yesand
-- 账户：yesand_app
-- 密码：XXXyesand_app
-- =========================

REVOKE ALL ON SCHEMA yesand FROM anon, authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA yesand FROM anon, authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA yesand FROM anon, authenticated, service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA yesand FROM anon, authenticated, service_role;

REVOKE ALL ON SCHEMA yesand FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA yesand FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA yesand FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA yesand FROM PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'yesand_app'
  ) THEN
    CREATE ROLE yesand_app
      LOGIN
      PASSWORD 'XXXyesand_app';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE postgres TO yesand_app;
GRANT USAGE ON SCHEMA yesand TO yesand_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA yesand TO yesand_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA yesand TO yesand_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA yesand TO yesand_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA yesand
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA yesand
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO yesand_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA yesand
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO yesand_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA yesand
  GRANT EXECUTE ON FUNCTIONS TO yesand_app;
