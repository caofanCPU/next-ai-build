import type { Redis } from '@upstash/redis';

import { withRedis } from '../upstash-config';

export type RedisStringKeyValue = Record<string, string>;
export type RedisJsonKeyValue<T> = Record<string, T>;
export type RedisHashStringValue = Record<string, string>;
export type RedisPipelineBuilder<TResult> = (pipeline: ReturnType<Redis['pipeline']>) => {
  exec: () => Promise<TResult>;
};

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
 * MGET plain string values. Missing keys are returned as null.
 */
export const mget = async (keys: string[]): Promise<(string | null)[] | null> => {
  return withRedis((redis) => {
    if (keys.length === 0) {
      return [];
    }

    return redis.mget<(string | null)[]>(...keys);
  });
};

/**
 * MSET plain string values.
 */
export const mset = async (entries: RedisStringKeyValue): Promise<boolean> => {
  const keys = Object.keys(entries);
  if (keys.length === 0) {
    return true;
  }

  return withRedis(async (redis) => {
    await redis.mset(entries);
    return true;
  }).then((result) => result ?? false);
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
 * MGET JSON values stored as strings. Missing or invalid values are returned as null.
 */
export const mgetJson = async <T>(keys: string[]): Promise<(T | null)[] | null> => {
  return withRedis(async (redis) => {
    if (keys.length === 0) {
      return [];
    }

    const payloads = await redis.mget<(string | null)[]>(...keys);
    return payloads.map((payload) => {
      if (!payload) {
        return null;
      }

      try {
        return JSON.parse(payload) as T;
      } catch {
        return null;
      }
    });
  });
};

/**
 * MSET JSON values as strings.
 */
export const msetJson = async <T>(entries: RedisJsonKeyValue<T>): Promise<boolean> => {
  const keys = Object.keys(entries);
  if (keys.length === 0) {
    return true;
  }

  const payloads = Object.fromEntries(
    Object.entries(entries).map(([key, value]) => [key, JSON.stringify(value)])
  ) as RedisStringKeyValue;

  return withRedis(async (redis) => {
    await redis.mset(payloads);
    return true;
  }).then((result) => result ?? false);
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
 * DEL multiple keys. Returns deleted count, or null if Redis is unavailable.
 */
export const del = async (keys: string[]): Promise<number | null> => {
  return withRedis((redis) => {
    if (keys.length === 0) {
      return 0;
    }

    return redis.del(...keys);
  });
};

/**
 * EXISTS a key.
 */
export const exists = async (key: string): Promise<boolean | null> => {
  return withRedis(async (redis) => {
    const count = await redis.exists(key);
    return count > 0;
  });
};

/**
 * EXPIRE a key in seconds.
 */
export const expire = async (key: string, ttlSec: number): Promise<boolean> => {
  if (ttlSec <= 0) {
    return false;
  }

  const result = await withRedis(async (redis) => {
    const changed = await redis.expire(key, ttlSec);
    return changed > 0;
  });

  return result ?? false;
};

/**
 * TTL for a key in seconds. Returns null if Redis is unavailable.
 */
export const ttl = async (key: string): Promise<number | null> => {
  return withRedis((redis) => redis.ttl(key));
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
 * HMSET hash fields.
 */
export const hmset = async (key: string, values: RedisHashStringValue): Promise<boolean> => {
  const fields = Object.keys(values);
  if (fields.length === 0) {
    return true;
  }

  const result = await withRedis(async (redis) => {
    await redis.hset(key, values);
    return true;
  });
  return result ?? false;
};

/**
 * HMGET hash fields.
 */
export const hmget = async (
  key: string,
  fields: string[]
): Promise<Record<string, string | null> | null> => {
  return withRedis(async (redis) => {
    if (fields.length === 0) {
      return {};
    }

    const result = await redis.hmget<Record<string, string | null>>(key, ...fields);
    if (!result) {
      return Object.fromEntries(fields.map((field) => [field, null]));
    }
    return result;
  });
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
 * HEXISTS a hash field.
 */
export const hexists = async (key: string, field: string): Promise<boolean | null> => {
  return withRedis(async (redis) => {
    const exists = await redis.hexists(key, field);
    return exists > 0;
  });
};

/**
 * HKEYS for a hash.
 */
export const hkeys = async (key: string): Promise<string[] | null> => {
  return withRedis((redis) => redis.hkeys(key));
};

/**
 * HLEN for a hash.
 */
export const hlen = async (key: string): Promise<number | null> => {
  return withRedis((redis) => redis.hlen(key));
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

/**
 * SADD members to a set. Returns count of newly added members, or null if Redis is unavailable.
 */
export const sadd = async (key: string, members: string[]): Promise<number | null> => {
  return withRedis((redis) => {
    if (members.length === 0) {
      return 0;
    }

    return redis.sadd(key, members[0], ...members.slice(1));
  });
};

/**
 * SREM members from a set. Returns count of removed members, or null if Redis is unavailable.
 */
export const srem = async (key: string, members: string[]): Promise<number | null> => {
  return withRedis((redis) => {
    if (members.length === 0) {
      return 0;
    }

    return redis.srem(key, ...members);
  });
};

/**
 * SISMEMBER for a set member.
 */
export const sismember = async (key: string, member: string): Promise<boolean | null> => {
  return withRedis(async (redis) => {
    const exists = await redis.sismember(key, member);
    return exists > 0;
  });
};

/**
 * SMEMBERS for a set.
 */
export const smembers = async (key: string): Promise<string[] | null> => {
  return withRedis((redis) => redis.smembers<string[]>(key));
};

/**
 * SCARD for a set.
 */
export const scard = async (key: string): Promise<number | null> => {
  return withRedis((redis) => redis.scard(key));
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

/**
 * Execute a Redis pipeline and return the result array from exec().
 */
export const pipeline = async <TResult>(
  build: RedisPipelineBuilder<TResult>
): Promise<TResult | null> => {
  return withRedis(async (redis) => {
    const pipeline = redis.pipeline();
    return build(pipeline).exec();
  });
};
