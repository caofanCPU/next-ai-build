import { withRedis } from '../upstash-config';

const favoriteTargetKey = (targetId: string): string => `favorite:target:${targetId}`;
const favoriteUserKey = (userId: string): string => `favorite:user:${userId}`;

/**
 * Favorite a target. Returns true if added, false if already favorited, null if Redis is unavailable.
 */
export const addFavorite = async (targetId: string, userId: string): Promise<boolean | null> => {
  return withRedis(async (redis) => {
    const added = await redis.sadd(favoriteTargetKey(targetId), userId);
    if (added === 1) {
      await redis.sadd(favoriteUserKey(userId), targetId);
      return true;
    }
    return false;
  });
};

/**
 * Remove a favorite. Returns true if removed, false if not found, null if Redis is unavailable.
 */
export const removeFavorite = async (targetId: string, userId: string): Promise<boolean | null> => {
  return withRedis(async (redis) => {
    const removed = await redis.srem(favoriteTargetKey(targetId), userId);
    if (removed === 1) {
      await redis.srem(favoriteUserKey(userId), targetId);
      return true;
    }
    return false;
  });
};

/**
 * Check whether a user has favorited a target. Returns null if Redis is unavailable.
 */
export const isFavorited = async (targetId: string, userId: string): Promise<boolean | null> => {
  return withRedis(async (redis) => {
    const result = await redis.sismember(favoriteTargetKey(targetId), userId);
    return result === 1;
  });
};

/**
 * Get favorite count for a target. Returns null if Redis is unavailable.
 */
export const getFavoriteCount = async (targetId: string): Promise<number | null> => {
  return withRedis((redis) => redis.scard(favoriteTargetKey(targetId)));
};

/**
 * Get target ids favorited by a user. Returns null if Redis is unavailable.
 */
export const getUserFavorites = async (userId: string): Promise<string[] | null> => {
  return withRedis((redis) => redis.smembers<string[]>(favoriteUserKey(userId)));
};
