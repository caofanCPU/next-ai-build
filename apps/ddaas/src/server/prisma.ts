import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@app-prisma';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  __app_prisma_ssl_warning_logged?: boolean;
};

function getPrismaLogConfig() {
  if (process.env.PRISMA_DEBUG === 'true') {
    return [
      { emit: 'event' as const, level: 'query' as const },
      { emit: 'stdout' as const, level: 'info' as const },
      { emit: 'stdout' as const, level: 'warn' as const },
      { emit: 'stdout' as const, level: 'error' as const },
    ];
  }

  return [{ emit: 'stdout' as const, level: 'error' as const }];
}

function createPrismaPgConfig(databaseUrl: string) {
  const ca = process.env.SUPABASE_DB_CA_CERT;

  if (!ca && !globalForPrisma.__app_prisma_ssl_warning_logged) {
    console.warn(
      'SUPABASE_DB_CA_CERT is not configured. Prisma will request TLS without certificate verification unless DATABASE_URL SSL parameters override this behavior. Configure SUPABASE_DB_CA_CERT for certificate verification.',
    );
    globalForPrisma.__app_prisma_ssl_warning_logged = true;
  }

  return {
    connectionString: databaseUrl,
    ssl: ca
      ? {
          ca,
          rejectUnauthorized: true,
        }
      : {
          rejectUnauthorized: false,
        },
  };
}

function createAppPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to create PrismaClient');
  }

  const adapter = new PrismaPg(createPrismaPgConfig(databaseUrl));

  return new PrismaClient({
    adapter,
    log: getPrismaLogConfig(),
  });
}

export const prisma = globalForPrisma.prisma ?? createAppPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
