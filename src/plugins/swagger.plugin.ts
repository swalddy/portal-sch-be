import { swagger } from '@elysiajs/swagger';

export const OPENAPI_SECURITY: Array<Record<string, string[]>> = [
  { bearerAuth: [] },
  { apiKeyAuth: [] },
];

export const swaggerPlugin = swagger({
  path: '/docs',
  documentation: {
    info: {
      title: 'Personal API Backend',
      description:
        'Centralized reusable REST API backend built with Bun, ElysiaJS, TypeScript, and Prisma ORM 7 on Neon PostgreSQL.',
      version: '1.0.0',
    },
    tags: [
      { name: 'Health', description: 'System health check and database liveness endpoints' },
      { name: 'Auth', description: 'Authentication, registration, login, and token verification' },
      { name: 'Workspaces', description: 'Notion-like team workspaces and member invites' },
      { name: 'Documents', description: 'Markdown documents and nested wiki pages' },
      { name: 'Tasks', description: 'Kanban project tasks with status and assignment' },
      { name: 'Notes', description: 'Protected Note CRUD operations' },
      { name: 'Highscores', description: 'Game highscores and automated Top 3 leaderboards' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Neon Auth (Managed Better Auth) JWT access token',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Personal or service-to-service API key',
        },
      },
    },
  },
});
