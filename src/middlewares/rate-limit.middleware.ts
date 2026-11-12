import { Elysia } from 'elysia';
import { env } from '@/lib/env';
import { errorResponse } from '@/utils/response.util';

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<RateLimitEntry>;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly entries = new Map<string, RateLimitEntry>();
  private lastCleanup = Date.now();

  public async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const now = Date.now();

    if (now - this.lastCleanup > windowMs) {
      for (const [entryKey, entry] of this.entries) {
        if (entry.resetAt <= now) {
          this.entries.delete(entryKey);
        }
      }
      this.lastCleanup = now;
    }

    const existing = this.entries.get(key);
    if (!existing || existing.resetAt <= now) {
      const created: RateLimitEntry = {
        count: 1,
        resetAt: now + windowMs,
      };
      this.entries.set(key, created);
      return created;
    }

    existing.count += 1;
    return existing;
  }
}

export interface RateLimitOptions {
  max?: number;
  windowMs?: number;
  store?: RateLimitStore;
  skipPaths?: string[];
}

function resolveClientKey(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip')?.trim() || 'local-client';
}

export function createRateLimitMiddleware(options: RateLimitOptions = {}) {
  const store = options.store ?? new MemoryRateLimitStore();
  const skipPaths = options.skipPaths ?? ['/docs'];

  return new Elysia({ name: 'rate-limit-middleware' }).onBeforeHandle(
    { as: 'global' },
    async ({ request, path, set }) => {
      if (skipPaths.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
        return;
      }

      const max = options.max ?? env.RATE_LIMIT_MAX;
      const windowMs = options.windowMs ?? env.RATE_LIMIT_WINDOW_MS;
      const key = resolveClientKey(request);

      const entry = await store.increment(key, windowMs);
      const remaining = Math.max(0, max - entry.count);
      const resetSeconds = Math.ceil(entry.resetAt / 1000);

      set.headers['x-ratelimit-limit'] = String(max);
      set.headers['x-ratelimit-remaining'] = String(remaining);
      set.headers['x-ratelimit-reset'] = String(resetSeconds);

      if (entry.count > max) {
        const retryAfter = Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 1000));
        set.status = 429;
        set.headers['retry-after'] = String(retryAfter);
        return errorResponse('Too many requests. Please try again later.');
      }
    }
  );
}

export const rateLimitMiddleware = createRateLimitMiddleware();

