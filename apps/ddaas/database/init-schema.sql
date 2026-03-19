-- 第一步：彻底删除 nextai schema（连里面的表、序列、权限全炸）
DROP SCHEMA IF EXISTS nextai CASCADE;

-- 第二步：重新创建干净的 nextai schema
CREATE SCHEMA nextai;

-- 第三步：把所有权给 postgres（防止任何权限问题）
ALTER SCHEMA nextai OWNER TO postgres;

-- 第四步：给常用角色全开权限（本地开发保险起见）
GRANT ALL ON SCHEMA nextai TO postgres;
GRANT ALL ON SCHEMA nextai TO anon;
GRANT ALL ON SCHEMA nextai TO authenticated;
GRANT ALL ON SCHEMA nextai TO service_role;

-- 第五步：以后在这个 schema 里建的表默认关闭 RLS（本地开发神器）
ALTER DEFAULT PRIVILEGES IN SCHEMA nextai REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA nextai GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA nextai GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;