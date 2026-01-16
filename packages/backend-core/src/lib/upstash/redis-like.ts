import { getRedis } from '../upstash-config';

const likeTargetKey = (targetId: string): string => `like:target:${targetId}`;
const likeUserKey = (userId: string): string => `like:user:${userId}`;

/**
 * Like a target. Returns true if the like was added, false if it already existed, null if Redis is unavailable.
 */
export const likeTarget = async (targetId: string, userId: string): Promise<boolean | null> => {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  const added = await redis.sadd(likeTargetKey(targetId), userId);
  if (added === 1) {
    await redis.sadd(likeUserKey(userId), targetId);
    return true;
  }
  return false;
};

/**
 * Unlike a target. Returns true if removed, false if it didn't exist, null if Redis is unavailable.
 */
export const unlikeTarget = async (targetId: string, userId: string): Promise<boolean | null> => {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  const removed = await redis.srem(likeTargetKey(targetId), userId);
  if (removed === 1) {
    await redis.srem(likeUserKey(userId), targetId);
    return true;
  }
  return false;
};

/**
 * Check whether a user liked a target. Returns null if Redis is unavailable.
 */
export const isTargetLiked = async (targetId: string, userId: string): Promise<boolean | null> => {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  const result = await redis.sismember(likeTargetKey(targetId), userId);
  return result === 1;
};

/**
 * Get like count for a target (unique by user). Returns null if Redis is unavailable.
 */
export const getTargetLikeCount = async (targetId: string): Promise<number | null> => {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  return redis.scard(likeTargetKey(targetId));
};

/**
 * Get target ids liked by a user. Returns null if Redis is unavailable.
 */
export const getUserLikedTargets = async (userId: string): Promise<string[] | null> => {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  return redis.smembers<string[]>(likeUserKey(userId));
};
