import { Elysia } from 'elysia';
import { env } from '@/lib/env';

export const securityMiddleware = new Elysia({ name: 'security-middleware' }).onAfterHandle(
  { as: 'global' },
  ({ set }) => {
    set.headers['x-content-type-options'] = 'nosniff';
    set.headers['x-frame-options'] = 'DENY';
    set.headers['referrer-policy'] = 'strict-origin-when-cross-origin';
    set.headers['permissions-policy'] = 'camera=(), microphone=(), geolocation=()';
    set.headers['x-xss-protection'] = '0';

    if (env.isProd) {
      set.headers['strict-transport-security'] = 'max-age=31536000; includeSubDomains';
    }
  }
);

