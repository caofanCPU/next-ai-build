import { getRedis } from '../upstash-config';

/**
 * Increment a counter (e.g. views, forwards). Returns null if Redis is unavailable.
 */
export const incrCounter = async (key: string, delta = 1): Promise<number | null> => {
  const redis = getRedis();
  if (!redis) {
    return null;
  }
  return redis.incrby(key, delta);
};

/**
 * Get a counter value. Returns null if Redis is unavailable.
 */
export const getCounter = async (key: string): Promise<number | null> => {
  const redis = getRedis();
  if (!redis) {
    return null;
  }
  const value = await redis.get<number>(key);
  return value ?? 0;
};

/**
 * Increment a unique counter via SET (e.g. unique views). Returns null if Redis is unavailable.
 */
export const incrUniqueCounter = async (setKey: string, memberId: string): Promise<number | null> => {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  const added = await redis.sadd(setKey, memberId);
  if (added === 1) {
    return redis.scard(setKey);
  }
  return redis.scard(setKey);
};

/**
 * Get unique counter value (SET cardinality). Returns null if Redis is unavailable.
 */
export const getUniqueCounter = async (setKey: string): Promise<number | null> => {
  const redis = getRedis();
  if (!redis) {
    return null;
  }
  return redis.scard(setKey);
};
