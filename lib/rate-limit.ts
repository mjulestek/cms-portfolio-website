/**
 * Lightweight in-process rate limiter.
 * Works without Redis — state is per-instance and resets on cold start.
 * For production at scale, replace with Upstash Ratelimit + Redis.
 *
 * TODO: replace with @upstash/ratelimit when UPSTASH_REDIS_REST_URL is available.
 */

interface Entry { count: number; resetAt: number }

const store = new Map<string, Entry>();

// Clean up expired entries every 5 minutes to avoid memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

/**
 * @param key      Unique key (e.g. IP + route)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window duration in milliseconds
 * @returns `{ allowed: boolean; remaining: number }`
 */
export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}
