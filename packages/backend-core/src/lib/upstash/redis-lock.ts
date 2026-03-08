import { Lock } from '@upstash/lock';
import type { Redis } from '@upstash/redis';
import { withRedis } from '../upstash-config';

type UpstashLock = {
  acquire: (key: string, ttlMs: number) => Promise<string | null>;
  release: (key: string, token: string) => Promise<boolean>;
};

let cachedLock: UpstashLock | null = null;
let cachedLockRedis: Redis | null = null;

const createLock = (redis: Redis): UpstashLock => {
  const LockCtor = Lock as unknown as new (...args: any[]) => UpstashLock;
  try {
    return new LockCtor({ redis });
  } catch {
    return new LockCtor(redis);
  }
};

const getLock = async (): Promise<UpstashLock | null> => {
  return withRedis((redis) => {
    if (cachedLock && cachedLockRedis === redis) {
      return cachedLock;
    }
    cachedLock = createLock(redis);
    cachedLockRedis = redis;
    return cachedLock;
  });
};

const withLockClient = async <T>(fn: (lock: UpstashLock) => Promise<T>): Promise<T | null> => {
  const lock = await getLock();
  if (!lock) {
    return null;
  }

  try {
    return await fn(lock);
  } catch (error) {
    // Lock internals may keep stale state when backend connectivity changes.
    cachedLock = null;
    cachedLockRedis = null;
    throw error;
  }
};

/**
 * Acquire a distributed lock. Returns the lock token or null when unavailable.
 */
export const acquireLock = async (key: string, ttlMs: number): Promise<string | null> => {
  return withLockClient((lock) => lock.acquire(key, ttlMs));
};

/**
 * Release a distributed lock. Returns false when the lock client is unavailable.
 */
export const releaseLock = async (key: string, token: string): Promise<boolean> => {
  const result = await withLockClient((lock) => lock.release(key, token));
  return result ?? false;
};

/**
 * Run a function under a distributed lock. Returns null when the lock is unavailable.
 */
export const withLock = async <T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T> | T
): Promise<T | null> => {
  const token = await withLockClient((lock) => lock.acquire(key, ttlMs));
  if (!token) {
    return null;
  }

  try {
    return await fn();
  } finally {
    await withLockClient((lock) => lock.release(key, token));
  }
};
