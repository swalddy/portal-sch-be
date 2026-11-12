import { Elysia } from 'elysia';
import { env } from '@/lib/env';
import { requireAuth } from '@/middlewares/auth.middleware';
import { OPENAPI_SECURITY } from '@/plugins/swagger.plugin';
import { successResponse } from '@/utils/response.util';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .get(
    '/providers',
    () =>
      successResponse(
        {
          bearerJwt: Boolean(env.NEON_AUTH_JWKS_URL),
          apiKey: env.API_KEYS.length > 0,
          issuer: env.NEON_AUTH_BASE_URL || null,
        },
        'Authentication providers retrieved successfully'
      ),
    {
      detail: {
        tags: ['Auth'],
        summary: 'List enabled authentication mechanisms',
        description: 'Reports which authentication methods (Bearer JWT, API Key) are enabled.',
      },
    }
  )
  .use(requireAuth)
  .get(
    '/me',
    ({ auth }) => successResponse(auth, 'Authenticated principal retrieved successfully'),
    {
      detail: {
        tags: ['Auth'],
        summary: 'Get current authenticated identity',
        description: 'Verifies credentials and returns the authenticated principal details.',
        security: OPENAPI_SECURITY,
      },
    }
  );
