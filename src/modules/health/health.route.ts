import { Elysia } from 'elysia';
import { HealthController } from './health.controller';

export const healthRoutes = new Elysia({ prefix: '/health' })
  .get('/', ({ set }) => HealthController.getHealth(set), {
    detail: {
      tags: ['Health'],
      summary: 'System and database health check',
      description: 'Checks API liveness and Neon PostgreSQL database connectivity.',
    },
  });
