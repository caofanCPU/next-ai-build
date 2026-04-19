import { Redis } from '@upstash/redis';
import { Client as QstashClient } from '@upstash/qstash';

let cachedRedis: Redis | null = null;
let cachedQstash: QstashClient | null = null;
let redisInitPromise: Promise<Redis | null> | null = null;
let qstashInitPromise: Promise<QstashClient | null> | null = null;

let redisWarnedMissingEnv = false;
let redisWarnedInvalidEnv = false;
let redisWarnedInitError = false;
let redisWarnedHealthCheck = false;
let redisWarnedHealthSchedule = false;

let qstashWarnedMissingEnv = false;
let qstashWarnedInitError = false;
let qstashWarnedHealthCheck = false;
let qstashWarnedHealthSchedule = false;

let redisHealthTimer: ReturnType<typeof setTimeout> | null = null;
let qstashHealthTimer: ReturnType<typeof setTimeout> | null = null;
let cachedRedisPrefixed: Redis | null = null;

const isNonEmpty = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isValidUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const getRequiredRedisAppName = (): string => {
  const appName = process.env.NEXT_PUBLIC_APP_NAME;
  if (!isNonEmpty(appName)) {
    throw new Error(
      '[Upstash Config] NEXT_PUBLIC_APP_NAME is required for Redis key prefixing and must not be empty'
    );
  }

  const normalized = appName.replace(/\s+/g, '').toLowerCase();
  if (!normalized) {
    throw new Error(
      '[Upstash Config] NEXT_PUBLIC_APP_NAME must contain non-whitespace characters for Redis key prefixing'
    );
  }

  return normalized;
};

const getRedisKeyPrefix = (): string => {
  const envSuffix = process.env.NODE_ENV === 'production' ? 'live' : 'test';
  return `${getRequiredRedisAppName()}_${envSuffix}`;
};

const prefixRedisKey = (prefix: string, key: string): string => `${prefix}:${key}`;

const prefixRedisKeys = (prefix: string, keys: string[]): string[] =>
  keys.map((key) => prefixRedisKey(prefix, key));

const prefixFirstStringArg = (args: unknown[], prefix: string): unknown[] => {
  if (typeof args[0] !== 'string') {
    return args;
  }

  const nextArgs = [...args];
  nextArgs[0] = prefixRedisKey(prefix, args[0]);
  return nextArgs;
};

const prefixAllStringArgs = (args: unknown[], prefix: string): unknown[] => {
  return args.map((arg) => (typeof arg === 'string' ? prefixRedisKey(prefix, arg) : arg));
};

const keyArrayCommands = new Set(['mget', 'del']);
const allStringKeyCommands = new Set(['exists']);

const createPrefixedPipeline = <T extends object>(target: T, prefix: string): T => {
  return new Proxy(target, {
    get(obj, prop, receiver) {
      const value = Reflect.get(obj, prop, receiver);
      if (typeof value !== 'function') {
        return value;
      }

      return (...args: unknown[]) => {
        if (prop === 'eval' || prop === 'evalsha' || prop === 'evalro' || prop === 'evalshaRo') {
          const [script, keys, argv] = args as [string, string[], unknown[]];
          return (value as (...innerArgs: unknown[]) => unknown).call(
            obj,
            script,
            prefixRedisKeys(prefix, keys),
            argv
          );
        }

        if (prop === 'pipeline' || prop === 'multi') {
          const nested = (value as (...innerArgs: unknown[]) => unknown).call(obj);
          return createPrefixedPipeline(nested as T, prefix);
        }

        if (typeof prop === 'string' && keyArrayCommands.has(prop)) {
          const nextArgs = prefixAllStringArgs(args, prefix);
          return (value as (...innerArgs: unknown[]) => unknown).apply(obj, nextArgs);
        }

        if (typeof prop === 'string' && allStringKeyCommands.has(prop)) {
          const nextArgs = prefixAllStringArgs(args, prefix);
          return (value as (...innerArgs: unknown[]) => unknown).apply(obj, nextArgs);
        }

        if (prop === 'mset') {
          const [entries] = args as [Record<string, unknown>];
          const prefixedEntries = Object.fromEntries(
            Object.entries(entries).map(([key, entryValue]) => [prefixRedisKey(prefix, key), entryValue])
          );
          return (value as (...innerArgs: unknown[]) => unknown).call(obj, prefixedEntries);
        }

        if (prop === 'hmget') {
          const nextArgs = prefixFirstStringArg(args, prefix);
          return (value as (...innerArgs: unknown[]) => unknown).apply(obj, nextArgs);
        }

        const nextArgs = prefixFirstStringArg(args, prefix);
        return (value as (...innerArgs: unknown[]) => unknown).apply(obj, nextArgs);
      };
    },
  });
};

const parseMinutes = (value: string | undefined, fallback: number): number => {
  if (!isNonEmpty(value)) {
    return fallback;
  }
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return fallback;
  }
  return minutes;
};

const getRedisHealthIntervalMinutes = (): number =>
  parseMinutes(process.env.UPSTASH_REDIS_HEALTHCHECK_INTERVAL_MINUTES, 10);

const getQstashHealthIntervalMinutes = (): number =>
  parseMinutes(process.env.UPSTASH_QSTASH_HEALTHCHECK_INTERVAL_MINUTES, 10);

const getQstashHealthcheckUrl = (): string | null => {
  const url = process.env.UPSTASH_QSTASH_HEALTHCHECK_URL;
  return isNonEmpty(url) ? url : null;
};

const scheduleRedisHealthCheck = (): void => {
  if (redisHealthTimer || !cachedRedis) {
    return;
  }
  const delayMs = getRedisHealthIntervalMinutes() * 60_000;
  redisHealthTimer = setTimeout(async () => {
    redisHealthTimer = null;
    if (!cachedRedis) {
      return;
    }
    try {
      await cachedRedis.ping();
    } catch (error) {
      cachedRedis = null;
      if (!redisWarnedHealthCheck) {
        redisWarnedHealthCheck = true;
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[Upstash Config] Redis health check failed: ${message}`);
      }
    } finally {
      try {
        scheduleRedisHealthCheck();
      } catch (error) {
        if (!redisWarnedHealthSchedule) {
          redisWarnedHealthSchedule = true;
          const message = error instanceof Error ? error.message : String(error);
          console.warn(`[Upstash Config] Redis health check schedule failed: ${message}`);
        }
      }
    }
  }, delayMs);
};

const checkQstashHealth = async (token: string): Promise<void> => {
  const healthcheckUrl = getQstashHealthcheckUrl();
  if (!healthcheckUrl) {
    return;
  }

  const response = await fetch(healthcheckUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
};

const scheduleQstashHealthCheck = (token: string): void => {
  if (qstashHealthTimer || !cachedQstash || !getQstashHealthcheckUrl()) {
    return;
  }
  const delayMs = getQstashHealthIntervalMinutes() * 60_000;
  qstashHealthTimer = setTimeout(async () => {
    qstashHealthTimer = null;
    if (!cachedQstash) {
      return;
    }
    try {
      await checkQstashHealth(token);
    } catch (error) {
      if (!qstashWarnedHealthCheck) {
        qstashWarnedHealthCheck = true;
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[Upstash Config] QStash health check failed: ${message}`);
      }
    } finally {
      try {
        scheduleQstashHealthCheck(token);
      } catch (error) {
        if (!qstashWarnedHealthSchedule) {
          qstashWarnedHealthSchedule = true;
          const message = error instanceof Error ? error.message : String(error);
          console.warn(`[Upstash Config] QStash health check schedule failed: ${message}`);
        }
      }
    }
  }, delayMs);
};

/**
 * Get the Upstash Redis client. Returns null when required env vars are missing/invalid.
 *
 * Singleton semantics:
 * - read-through cached instance only
 */
export const getRedis = (): Redis | null => {
  return cachedRedisPrefixed;
};

const ensureRedis = async (): Promise<Redis | null> => {
  if (cachedRedisPrefixed) {
    return cachedRedisPrefixed;
  }
  if (redisInitPromise) {
    return redisInitPromise;
  }

  redisInitPromise = (async () => {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
    if (!isNonEmpty(UPSTASH_REDIS_REST_URL) || !isNonEmpty(UPSTASH_REDIS_REST_TOKEN)) {
      if (!redisWarnedMissingEnv) {
        redisWarnedMissingEnv = true;
        console.warn(
          '[Upstash Config] Redis disabled: missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN'
        );
      }
      return null;
    }

    if (!isValidUrl(UPSTASH_REDIS_REST_URL)) {
      if (!redisWarnedInvalidEnv) {
        redisWarnedInvalidEnv = true;
        console.warn('[Upstash Config] Redis disabled: UPSTASH_REDIS_REST_URL is not a valid URL');
      }
      return null;
    }

    try {
      const keyPrefix = getRedisKeyPrefix();
      const client = new Redis({
        url: UPSTASH_REDIS_REST_URL,
        token: UPSTASH_REDIS_REST_TOKEN,
      });
      await client.ping();
      cachedRedis = client;
      cachedRedisPrefixed = createPrefixedPipeline(client, keyPrefix) as Redis;
      scheduleRedisHealthCheck();
      return cachedRedisPrefixed;
    } catch (error) {
      if (!redisWarnedInitError) {
        redisWarnedInitError = true;
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[Upstash Config] Redis init failed: ${message}`);
      }
      return null;
    } finally {
      redisInitPromise = null;
    }
  })();

  return redisInitPromise;
};

/**
 * Get the Upstash QStash client. Returns null when required env vars are missing.
 *
 * Singleton semantics:
 * - read-through cached instance only
 */
export const getQstash = (): QstashClient | null => {
  return cachedQstash;
};

const ensureQstash = async (): Promise<QstashClient | null> => {
  if (cachedQstash) {
    return cachedQstash;
  }
  if (qstashInitPromise) {
    return qstashInitPromise;
  }

  qstashInitPromise = (async () => {
    const { QSTASH_TOKEN } = process.env;
    if (!isNonEmpty(QSTASH_TOKEN)) {
      if (!qstashWarnedMissingEnv) {
        qstashWarnedMissingEnv = true;
        console.warn('[Upstash Config] QStash disabled: missing QSTASH_TOKEN');
      }
      return null;
    }

    try {
      const client = new QstashClient({ token: QSTASH_TOKEN });
      cachedQstash = client;
      checkQstashHealth(QSTASH_TOKEN).catch((error) => {
        if (!qstashWarnedHealthCheck) {
          qstashWarnedHealthCheck = true;
          const message = error instanceof Error ? error.message : String(error);
          console.warn(`[Upstash Config] QStash health check failed: ${message}`);
        }
      });
      scheduleQstashHealthCheck(QSTASH_TOKEN);
      return cachedQstash;
    } catch (error) {
      if (!qstashWarnedInitError) {
        qstashWarnedInitError = true;
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[Upstash Config] QStash init failed: ${message}`);
      }
      return null;
    } finally {
      qstashInitPromise = null;
    }
  })();

  return qstashInitPromise;
};

export const withRedis = async <T>(fn: (redis: Redis) => Promise<T> | T): Promise<T | null> => {
  const redis = await ensureRedis();
  if (!redis) {
    return null;
  }
  return fn(redis);
};

export const withQstash = async <T>(
  fn: (qstash: QstashClient) => Promise<T> | T
): Promise<T | null> => {
  const qstash = await ensureQstash();
  if (!qstash) {
    return null;
  }
  return fn(qstash);
};
