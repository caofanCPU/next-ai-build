import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@app-prisma';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
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
  return {
    connectionString: databaseUrl,
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
