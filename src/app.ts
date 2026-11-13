import { Elysia } from 'elysia';
import { env } from './lib/env';
import { corsPlugin } from './plugins/cors.plugin';
import { swaggerPlugin } from './plugins/swagger.plugin';
import { errorMiddleware } from './middlewares/error.middleware';
import { securityMiddleware } from './middlewares/security.middleware';
import { rateLimitMiddleware } from './middlewares/rate-limit.middleware';
import { healthRoutes } from './modules/health/health.route';
import { authRoutes } from './modules/auth/auth.route';
import { notesRoutes } from './modules/notes/notes.route';

export const app = new Elysia()
  .use(corsPlugin)
  .use(swaggerPlugin)
  .use(errorMiddleware)
  .use(securityMiddleware)
  .use(rateLimitMiddleware)
  .get('/', () => ({
    name: 'Personal API Backend',
    version: '1.0.0',
    docs: '/docs',
    openApiSpec: '/docs/json',
    apiPrefix: env.API_PREFIX,
  }))
  .get('/api', () => ({
    name: 'Personal API Backend',
    version: '1.0.0',
    docs: '/docs',
    openApiSpec: '/docs/json',
    apiPrefix: env.API_PREFIX,
  }))
  .group(env.API_PREFIX, (api) =>
    api
      .use(healthRoutes)
      .use(authRoutes)
      .use(notesRoutes)
  );

export type App = typeof app;
