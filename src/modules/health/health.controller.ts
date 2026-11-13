import { prisma } from '../../lib/prisma';
import { env } from '../../lib/env';
import { errorResponse, successResponse } from '../../utils/response.util';

export class HealthController {
  public static async getHealth(set: { status?: number | string }) {
    const uptimeInSeconds = Math.floor(process.uptime());
    const start = performance.now();

    try {
      await prisma.$queryRaw`SELECT 1`;
      const latencyMs = Math.round(performance.now() - start);

      return successResponse(
        {
          status: 'healthy',
          database: {
            status: 'connected',
            latencyMs,
          },
          environment: env.NODE_ENV,
          uptime: `${uptimeInSeconds}s`,
          timestamp: new Date().toISOString(),
        },
        'Service is healthy'
      );
    } catch (error) {
      set.status = 503;
      const reason =
        env.isDev && error instanceof Error ? error.message : 'Database connection check failed';

      return errorResponse('Service is degraded', {
        status: 'degraded',
        database: {
          status: 'disconnected',
          reason,
        },
        environment: env.NODE_ENV,
        uptime: `${uptimeInSeconds}s`,
      });
    }
  }
}
