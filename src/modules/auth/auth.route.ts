import { Elysia } from 'elysia';
import { env } from '../../lib/env';
import { requireAuth } from '../../middlewares/auth.middleware';
import { OPENAPI_SECURITY } from '../../plugins/swagger.plugin';
import { successResponse } from '../../utils/response.util';
import { AuthService } from './auth.service';
import { loginBodySchema, registerBodySchema } from './auth.schema';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .get(
    '/providers',
    () =>
      successResponse(
        {
          jwt: true,
          bearerJwt: Boolean(env.NEON_AUTH_JWKS_URL || env.JWT_SECRET),
          apiKey: env.API_KEYS.length > 0,
          issuer: env.NEON_AUTH_BASE_URL || null,
        },
        'Authentication providers retrieved successfully'
      ),
    {
      detail: {
        tags: ['Auth'],
        summary: 'List enabled authentication mechanisms',
        description: 'Reports which authentication methods are enabled.',
      },
    }
  )
  .post(
    '/register',
    async ({ body, set }) => {
      const result = await AuthService.register(body);
      set.status = 201;
      return successResponse(result, 'User registered successfully');
    },
    {
      body: registerBodySchema,
      detail: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Creates a new user account with hashed password and returns a JWT token.',
      },
    }
  )
  .post(
    '/login',
    async ({ body }) => {
      const result = await AuthService.login(body);
      return successResponse(result, 'Login successful');
    },
    {
      body: loginBodySchema,
      detail: {
        tags: ['Auth'],
        summary: 'Log in with email and password',
        description: 'Authenticates a user and returns a Bearer JWT token.',
      },
    }
  )
  .use(requireAuth)
  .get(
    '/me',
    async ({ auth }) => {
      // If the principal is a registered user with a valid UUID, load full user profile
      try {
        const user = await AuthService.getCurrentUser(auth.sub);
        return successResponse(
          { ...user, authType: auth.authType, role: auth.role },
          'Current user profile retrieved successfully'
        );
      } catch {
        // Fallback for API key or non-DB principals
        return successResponse(auth, 'Authenticated principal retrieved successfully');
      }
    },
    {
      detail: {
        tags: ['Auth'],
        summary: 'Get current authenticated identity',
        description: 'Verifies credentials and returns the authenticated user profile or principal.',
        security: OPENAPI_SECURITY,
      },
    }
  );
