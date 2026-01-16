import { Lock } from '@upstash/lock';
import type { Redis } from '@upstash/redis';
import { getRedis } from '../upstash-config';

type UpstashLock = {
  acquire: (key: string, ttlMs: number) => Promise<string | null>;
  release: (key: string, token: string) => Promise<boolean>;
};

let cachedLock: UpstashLock | null = null;
let lockInitAttempted = false;

const createLock = (redis: Redis): UpstashLock => {
  const LockCtor = Lock as unknown as new (...args: any[]) => UpstashLock;
  try {
    return new LockCtor({ redis });
  } catch {
    return new LockCtor(redis);
  }
};

const getLock = (): UpstashLock | null => {
  if (cachedLock) {
    return cachedLock;
  }
  if (lockInitAttempted) {
    return null;
  }
  lockInitAttempted = true;

  const redis = getRedis();
  if (!redis) {
    return null;
  }

  cachedLock = createLock(redis);
  return cachedLock;
};

/**
 * Acquire a distributed lock. Returns the lock token or null when unavailable.
 */
export const acquireLock = async (key: string, ttlMs: number): Promise<string | null> => {
  const lock = getLock();
  if (!lock) {
    return null;
  }
  return lock.acquire(key, ttlMs);
};

/**
 * Release a distributed lock. Returns false when the lock client is unavailable.
 */
export const releaseLock = async (key: string, token: string): Promise<boolean> => {
  const lock = getLock();
  if (!lock) {
    return false;
  }
  return lock.release(key, token);
};

/**
 * Run a function under a distributed lock. Returns null when the lock is unavailable.
 */
export const withLock = async <T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T> | T
): Promise<T | null> => {
  const lock = getLock();
  if (!lock) {
    return null;
  }

  const token = await lock.acquire(key, ttlMs);
  if (!token) {
    return null;
  }

  try {
    return await fn();
  } finally {
    await lock.release(key, token);
  }
};
