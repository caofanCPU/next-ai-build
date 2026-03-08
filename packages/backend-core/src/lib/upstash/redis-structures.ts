import { withRedis } from '../upstash-config';

/**
 * Set a plain string value with optional TTL (seconds).
 */
export const setString = async (
  key: string,
  value: string,
  ttlSec?: number
): Promise<boolean> => {
  return withRedis(async (redis) => {
    if (ttlSec && ttlSec > 0) {
      await redis.set(key, value, { ex: ttlSec });
      return true;
    }

    await redis.set(key, value);
    return true;
  }).then((result) => result ?? false);
};

/**
 * Get a plain string value. Returns null if Redis is unavailable or key missing.
 */
export const getString = async (key: string): Promise<string | null> => {
  return withRedis((redis) => redis.get<string>(key));
};

/**
 * Store an object as JSON string with optional TTL (seconds).
 */
export const setJson = async <T>(
  key: string,
  value: T,
  ttlSec?: number
): Promise<boolean> => {
  return withRedis(async (redis) => {
    const payload = JSON.stringify(value);
    if (ttlSec && ttlSec > 0) {
      await redis.set(key, payload, { ex: ttlSec });
      return true;
    }

    await redis.set(key, payload);
    return true;
  }).then((result) => result ?? false);
};

/**
 * Get an object stored as JSON string. Returns null if missing or invalid JSON.
 */
export const getJson = async <T>(key: string): Promise<T | null> => {
  return withRedis(async (redis) => {
    const payload = await redis.get<string>(key);
    if (!payload) {
      return null;
    }

    try {
      return JSON.parse(payload) as T;
    } catch {
      return null;
    }
  });
};

/**
 * Delete a key. Returns false if Redis is unavailable.
 */
export const deleteKey = async (key: string): Promise<boolean> => {
  const result = await withRedis(async (redis) => {
    const deleted = await redis.del(key);
    return deleted > 0;
  });
  return result ?? false;
};

/**
 * Set a hash field value.
 */
export const setHashField = async (key: string, field: string, value: string): Promise<boolean> => {
  const result = await withRedis(async (redis) => {
    const changed = await redis.hset(key, { [field]: value });
    return changed > 0;
  });
  return result ?? false;
};

/**
 * Get a hash field value.
 */
export const getHashField = async (key: string, field: string): Promise<string | null> => {
  return withRedis((redis) => redis.hget<string>(key, field));
};

/**
 * Store a hash field as JSON string.
 */
export const setHashJson = async <T>(
  key: string,
  field: string,
  value: T
): Promise<boolean> => {
  const result = await withRedis(async (redis) => {
    const payload = JSON.stringify(value);
    const changed = await redis.hset(key, { [field]: payload });
    return changed > 0;
  });
  return result ?? false;
};

/**
 * Get a hash field stored as JSON string.
 */
export const getHashJson = async <T>(key: string, field: string): Promise<T | null> => {
  return withRedis(async (redis) => {
    const payload = await redis.hget<string>(key, field);
    if (!payload) {
      return null;
    }

    try {
      return JSON.parse(payload) as T;
    } catch {
      return null;
    }
  });
};

/**
 * Get all hash fields.
 */
export const getHashAll = async (key: string): Promise<Record<string, string> | null> => {
  return withRedis(async (redis) => {
    const result = await redis.hgetall<Record<string, string>>(key);
    return result ?? {};
  });
};

/**
 * Remove a hash field.
 */
export const deleteHashField = async (key: string, field: string): Promise<boolean> => {
  const result = await withRedis(async (redis) => {
    const removed = await redis.hdel(key, field);
    return removed > 0;
  });
  return result ?? false;
};

type ListDirection = 'left' | 'right';

/**
 * Push values to a list. Returns list length or null if Redis is unavailable.
 */
export const pushList = async (
  key: string,
  values: string[],
  direction: ListDirection = 'right'
): Promise<number | null> => {
  return withRedis((redis) => {
    if (values.length === 0) {
      return redis.llen(key);
    }

    return direction === 'left'
      ? redis.lpush(key, ...values)
      : redis.rpush(key, ...values);
  });
};

/**
 * Pop a value from a list.
 */
export const popList = async (
  key: string,
  direction: ListDirection = 'right'
): Promise<string | null> => {
  return withRedis((redis) =>
    direction === 'left' ? redis.lpop<string>(key) : redis.rpop<string>(key)
  );
};

/**
 * Get a range from a list.
 */
export const rangeList = async (
  key: string,
  start = 0,
  stop = -1
): Promise<string[] | null> => {
  return withRedis((redis) => redis.lrange<string>(key, start, stop));
};

/**
 * Get list length.
 */
export const listLength = async (key: string): Promise<number | null> => {
  return withRedis((redis) => redis.llen(key));
};
