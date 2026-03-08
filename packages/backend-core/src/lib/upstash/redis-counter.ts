import { withRedis } from '../upstash-config';

/**
 * Increment a counter (e.g. views, forwards). Returns null if Redis is unavailable.
 */
export const incrCounter = async (key: string, delta = 1): Promise<number | null> => {
  return withRedis((redis) => redis.incrby(key, delta));
};

/**
 * Get a counter value. Returns null if Redis is unavailable.
 */
export const getCounter = async (key: string): Promise<number | null> => {
  return withRedis(async (redis) => {
    const value = await redis.get<number>(key);
    return value ?? 0;
  });
};

/**
 * Increment a unique counter via SET (e.g. unique views). Returns null if Redis is unavailable.
 */
export const incrUniqueCounter = async (setKey: string, memberId: string): Promise<number | null> => {
  return withRedis(async (redis) => {
    await redis.sadd(setKey, memberId);
    return redis.scard(setKey);
  });
};

/**
 * Get unique counter value (SET cardinality). Returns null if Redis is unavailable.
 */
export const getUniqueCounter = async (setKey: string): Promise<number | null> => {
  return withRedis((redis) => redis.scard(setKey));
};
