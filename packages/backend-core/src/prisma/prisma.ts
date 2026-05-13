import type { Prisma } from '@core/db/prisma-model-type';

export type BackendCorePrismaClient = BackendCoreHostPrismaClient;
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
  $executeRawUnsafe?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $queryRaw: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $queryRawUnsafe?: any;
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
  __prisma_ssl_warning_logged?: boolean;
};

// ==================== Logging Configuration ====================
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

export function createPrismaClient(): never {
  throw new Error(
    'backend-core no longer creates its own PrismaClient. The host application must create and register its Prisma client via configureBackendCorePrisma().',
  );
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
    throw new Error(
      'backend-core Prisma client is not configured. Register the host Prisma client via configureBackendCorePrisma() before using backend-core database services.',
    );
  }

  return globalForPrisma.prisma as BackendCorePrismaClient;
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

    // --- Custom SQL interpolation ---
    const interpolate = (query: string, params: string) => {
      // 1. Validate and parse parameters safely.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parameters: any[] = [];
      try {
        // Parse the params string. Empty strings or invalid JSON are handled by the catch block.
        parameters = params && params.length > 0 ? JSON.parse(params) : [];
        // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (e) {
        // If parsing fails, return the original query without interpolation.
        return query; 
      }
      
      // Ensure parameters is an array.
      if (!Array.isArray(parameters)) {
          console.warn('Prisma params did not parse to an array; skipping parameter interpolation. Result:', parameters);
          return query;
      }

      // If there are no parameters, return the query as-is.
      if (parameters.length === 0) {
        return query;
      }

      // 2. Safely stringify parameter values.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safeValues = parameters.map((p: any) => {
        if (p === null) return 'NULL';
        // Quote and escape string values for readable SQL logging.
        if (typeof p === 'string') return `'${p.replace(/'/g, "''")}'`; 
        return p; // Numbers, booleans, and similar values can be returned directly.
      });

      // 3. Replace $1, $2, ... placeholders.
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
        .replace(/"[^"]+"\./g, '')           // Remove "table". prefixes.
        .replace(/= '([^']+)'/g, `= '$1'`)   // Keep normalized quoted values.
        .replace(/"/g, '');                  // Remove remaining double quotes.

      console.log('─'.repeat(60));
      console.log(`Prisma Instance ID: ${instanceId} | Listener ID: ${listenerId}`);
      console.log(`${clean};`);
      console.log(`Duration: ${ms}ms, ${slow}`);
    };
    // Register the wrapped handler.
    prismaClient.$on?.('query' as never, wrappedHandler);

    globalForPrisma[REGISTERED_KEY] = true;
  }
}

// ==================== Client Helper: fall back to the global non-transaction client when no transaction client is provided ====================
export function checkAndFallbackWithNonTCClient(tx?: Prisma.TransactionClient): Prisma.TransactionClient | BackendCorePrismaClient {
  return tx ?? getBackendCorePrisma();
}
