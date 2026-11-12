import { describe, expect, it } from 'bun:test';
import { app } from '@/app';

describe('Health Module', () => {
  it('should return 200 and connected database status for GET /api/v1/health', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1/health'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('Service is healthy');
    expect(body.data.status).toBe('healthy');
    expect(body.data.database.status).toBe('connected');
    expect(typeof body.data.database.latencyMs).toBe('number');
    expect(body.data.environment).toBeDefined();
    expect(body.data.uptime).toBeDefined();
  });

  it('should return 404 for unmapped routes', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1/not-found-endpoint'));
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Resource not found');
  });

  it('should return API metadata for GET /', async () => {
    const response = await app.handle(new Request('http://localhost/'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.name).toBe('Personal API Backend');
    expect(body.apiPrefix).toBe('/api/v1');
    expect(body.docs).toBe('/docs');
  });
});
