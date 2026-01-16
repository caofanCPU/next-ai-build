import { Redis } from '@upstash/redis';
import { Client as QstashClient } from '@upstash/qstash';

let cachedRedis: Redis | null = null;
let cachedQstash: QstashClient | null = null;
let redisInitAttempted = false;
let qstashInitAttempted = false;

/**
 * Get the Upstash Redis client. Returns null when required env vars are missing.
 */
export const getRedis = (): Redis | null => {
  if (cachedRedis) {
    return cachedRedis;
  }
  if (redisInitAttempted) {
    return null;
  }

  redisInitAttempted = true;
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    console.warn('[Upstash Config] Redis Missed configration UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN, then disabled');
    return null;
  }

  cachedRedis = new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  });
  return cachedRedis;
};

/**
 * Get the Upstash QStash client. Returns null when required env vars are missing.
 */
export const getQstash = (): QstashClient | null => {
  if (cachedQstash) {
    return cachedQstash;
  }
  if (qstashInitAttempted) {
    return null;
  }

  qstashInitAttempted = true;
  const { QSTASH_TOKEN } = process.env;
  if (!QSTASH_TOKEN) {
    console.warn('[Upstash Config] QStash Missed configration QSTASH_TOKEN, then disabled');
    return null;
  }

  cachedQstash = new QstashClient({ token: QSTASH_TOKEN });
  return cachedQstash;
};
