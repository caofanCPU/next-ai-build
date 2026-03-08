import { withRedis } from '../upstash-config';

const unlockScript = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

const generateToken = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};

/**
 * Acquire a distributed lock. Returns the lock token or null when unavailable.
 */
export const acquireLock = async (key: string, ttlMs: number): Promise<string | null> => {
  return withRedis(async (redis) => {
    const token = generateToken();
    const result = await redis.set(key, token, { nx: true, px: ttlMs });
    return result === 'OK' ? token : null;
  });
};

/**
 * Release a distributed lock. Returns false when the lock client is unavailable.
 */
export const releaseLock = async (key: string, token: string): Promise<boolean> => {
  const result = await withRedis(async (redis) => {
    const released = await redis.eval(unlockScript, [key], [token]);
    return Number(released) === 1;
  });
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
  const token = await acquireLock(key, ttlMs);
  if (!token) {
    return null;
  }

  try {
    return await fn();
  } finally {
    await releaseLock(key, token);
  }
};
