import { defineConfig } from 'prisma/config';

if (!process.env.DATABASE_URL_UNPOOLED && !process.env.DIRECT_URL && !process.env.DATABASE_URL) {
  try {
    process.loadEnvFile?.('.env');
  } catch {
    // Ignore when .env is absent (e.g. CI or production environments)
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Prisma CLI migrations require a direct (unpooled) connection on Neon.
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});

