-- 清空所有数据表

TRUNCATE TABLE 
  users, 
  subscriptions, 
  credits, 
  credit_audit_log, 
  transactions,
  user_backup,
  apilog
RESTART IDENTITY;

-- 验证结果

SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL
SELECT 'subscriptions' AS table_name, COUNT(*) AS row_count FROM subscriptions
UNION ALL
SELECT 'credits' AS table_name, COUNT(*) AS row_count FROM credits
UNION ALL
SELECT 'credit_audit_log' AS table_name, COUNT(*) AS row_count FROM credit_usage
UNION ALL
SELECT 'transactions' AS table_name, COUNT(*) AS row_count FROM transactions
UNION ALL
SELECT 'user_backup' AS table_name, COUNT(*) AS row_count FROM user_backup
UNION ALL
SELECT 'apilog' AS table_name, COUNT(*) AS row_count FROM apilog;
