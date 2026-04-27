import { getBackendCorePrisma } from './prisma';
import { Prisma } from '../core-prisma/client';

// 事务工具类，回滚时打印回滚日志
export async function runInTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  operationName?: string
): Promise<T> {
  const start = Date.now();
  try {
    return await getBackendCorePrisma().$transaction(fn);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const duration = Date.now() - start;
    console.error('='.repeat(60));
    console.error('TRANSACTION ROLLBACK');
    console.error(`Operation: ${operationName || 'unknown'}`);
    console.error(`Duration: ${duration}ms`);
    console.error(`Error: ${error.message}`);
    if (error.code) console.error(`Code: ${error.code}`);
    console.error('='.repeat(60));
    throw error;
  }
}
