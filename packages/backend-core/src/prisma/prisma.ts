import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../core-prisma/client';

type AppPrismaClient = PrismaClient<'query' | 'info' | 'warn' | 'error'>;
export type BackendCorePrismaClient = AppPrismaClient;
export type BackendCoreHostPrismaClient = {
  // Deliberately loose: host applications generate their own Prisma Client,
  // so transaction overloads are structurally compatible at runtime but not
  // nominally identical to backend-core's generated client types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $transaction: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $on?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $executeRaw: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $queryRaw: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscription: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  credit: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  creditAuditLog: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userBackup: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apilog: any;
};

const globalForPrisma = globalThis as unknown as {
  prisma?: BackendCoreHostPrismaClient;
  __prisma_query_logger_registered?: boolean;
  __prisma_query_logger_id?: string;
  __prisma_instance_id?: string;
};

// ==================== 日志配置 ====================
const getLogConfig = () => {
  if (process.env.PRISMA_DEBUG === 'true') {
    return [
      { emit: 'event' as const, level: 'query' as const },
      { emit: 'stdout' as const, level: 'info' as const },
      { emit: 'stdout' as const, level: 'warn' as const },
      { emit: 'stdout' as const, level: 'error' as const },
    ];
  }

  const env = process.env.NODE_ENV || 'development';
  switch (env) {
    case 'test':
      return [
        { emit: 'stdout' as const, level: 'warn' as const },
        { emit: 'stdout' as const, level: 'error' as const },
      ];
    default:
      return [{ emit: 'stdout' as const, level: 'error' as const }];
  }
};

const logConfig = getLogConfig();

function isPrismaDebugEnabled() {
  return process.env.PRISMA_DEBUG === 'true';
}

function createPrismaInstanceId(prefix = 'core-prisma') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createPrismaClient(databaseUrl = process.env.DATABASE_URL): AppPrismaClient {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to create PrismaClient');
  }

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  const instanceId = createPrismaInstanceId();
  if (isPrismaDebugEnabled()) {
    console.log(`Prisma Client Created | ID: ${instanceId}`);
  }

  const client = new PrismaClient({
    adapter,
    log: logConfig,
  });

  return configureBackendCorePrisma(client, instanceId) as AppPrismaClient;
}

export function configureBackendCorePrisma(
  prismaClient: BackendCoreHostPrismaClient,
  instanceId = globalForPrisma.__prisma_instance_id ?? createPrismaInstanceId(),
): BackendCoreHostPrismaClient {
  globalForPrisma.prisma = prismaClient;
  globalForPrisma.__prisma_instance_id = instanceId;
  registerDevelopmentQueryLogger(prismaClient, instanceId);
  return prismaClient;
}

export function getBackendCorePrisma(): BackendCorePrismaClient {
  if (!globalForPrisma.prisma) {
    configureBackendCorePrisma(createPrismaClient());
  }

  return globalForPrisma.prisma as unknown as BackendCorePrismaClient;
}

// Backward-compatible lazy export. Accessing a property creates the client,
// importing this module does not.
export const prisma = new Proxy({} as BackendCorePrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(getBackendCorePrisma(), property, receiver);
  },
});

function registerDevelopmentQueryLogger(prismaClient: BackendCoreHostPrismaClient, instanceId: string) {
  if (!isPrismaDebugEnabled()) {
    return;
  }

  const REGISTERED_KEY = '__prisma_query_logger_registered';
  const ID_KEY = '__prisma_query_logger_id';

  if (globalForPrisma[REGISTERED_KEY]) {
    console.log(
      `Prisma Query Logger Already Registered | Listener ID: ${globalForPrisma[ID_KEY]} | Instance ID: ${globalForPrisma.__prisma_instance_id}`,
    );
  } else {
    const listenerId = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    globalForPrisma[ID_KEY] = listenerId;
    console.log(`Prisma Query Logger Registered | Listener ID: ${listenerId} | Instance ID: ${instanceId}`);

    // --- 自定义SQL拼接 ---
    const interpolate = (query: string, params: string) => {
      // 1. 【核心修改】：安全检查和参数解析
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parameters: any[] = [];
      try {
        // 尝试解析 params 字符串
        // 如果 params 是空字符串 ""，或者不是有效的 JSON，这里会捕获错误
        parameters = params && params.length > 0 ? JSON.parse(params) : [];
        // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (e) {
        // 如果无法解析，则直接返回原始查询，跳过替换
        return query; 
      }
      
      // 确保 parameters 是一个数组
      if (!Array.isArray(parameters)) {
          console.warn('Prisma params解析结果不是数组，跳过参数替换。Result:', parameters);
          return query;
      }

      // 如果没有参数，直接返回查询
      if (parameters.length === 0) {
        return query;
      }

      // 2. 将参数列表的值进行安全的字符串化处理
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safeValues = parameters.map((p: any) => {
        if (p === null) return 'NULL';
        // 对字符串类型的值加上单引号并转义（这是SQL安全的关键）
        if (typeof p === 'string') return `'${p.replace(/'/g, "''")}'`; 
        return p; // 数字、布尔值等直接返回
      });

      // 3. 循环替换 $1, $2, ...
      let sql = query;
      for (let i = 0; i < safeValues.length; i++) {
        const placeholder = new RegExp('\\$' + (i + 1) + '(?!\\d)', 'g');
        sql = sql.replace(placeholder, safeValues[i]);
      }
      return sql;
    };

    const wrappedHandler = (event: Prisma.QueryEvent) => {
      const ms = Math.round(event.duration);
      const slow = ms >= 200 ? '🐌 SLOW SQL ' : '🚀 SQL';

      const interpolatedSql = interpolate(event.query, event.params);
      
      const clean = interpolatedSql
        .replace(/"[^"]+"\./g, '')           // 去 "表".
        .replace(/= '([^']+)'/g, `= '$1'`)   // 已经替换成单引号，此处可以优化
        .replace(/"/g, '');                  // 彻底灭双引号

      console.log('─'.repeat(60));
      console.log(`Prisma Instance ID: ${instanceId} | Listener ID: ${listenerId}`);
      console.log(`${clean};`);
      console.log(`⏰ 耗时: ${ms}ms, ${slow}`);
    };
    // 注册包装后的 handler
    prismaClient.$on?.('query' as never, wrappedHandler);

    globalForPrisma[REGISTERED_KEY] = true;
  }
}

// ==================== 便捷方法, 入参事务客户端不存在或者不传, 就返回全局非事务客户端 ====================
export function checkAndFallbackWithNonTCClient(tx?: Prisma.TransactionClient): Prisma.TransactionClient | BackendCorePrismaClient {
  return tx ?? getBackendCorePrisma();
}
