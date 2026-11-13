import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { app } from '../src/app';
import { authenticateRequest } from '../src/lib/auth';
import { env } from '../src/lib/env';
import { requireRole } from '../src/middlewares/auth.middleware';
import { errorMiddleware } from '../src/middlewares/error.middleware';
import { createRateLimitMiddleware } from '../src/middlewares/rate-limit.middleware';

describe('Security, Auth & OpenAPI', () => {
  const TEST_API_KEY = `sec-key-${randomUUID()}`;
  const previousApiKey = process.env.API_KEY;

  beforeAll(() => {
    process.env.API_KEY = TEST_API_KEY;
  });

  afterAll(() => {
    if (previousApiKey === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = previousApiKey;
    }
  });

  it('includes HTTP security and rate-limit headers on API responses', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1/auth/providers'));
    expect(response.status).toBe(200);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(response.headers.get('x-ratelimit-limit')).toBeDefined();
    expect(response.headers.get('x-ratelimit-remaining')).toBeDefined();

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.apiKey).toBe(true);
  });

  it('returns 401 for /api/v1/auth/me without credentials or with invalid credentials', async () => {
    const missingRes = await app.handle(new Request('http://localhost/api/v1/auth/me'));
    expect(missingRes.status).toBe(401);

    const badKeyRes = await app.handle(
      new Request('http://localhost/api/v1/auth/me', {
        headers: { 'x-api-key': 'wrong-key' },
      })
    );
    expect(badKeyRes.status).toBe(401);

    const badBearerRes = await app.handle(
      new Request('http://localhost/api/v1/auth/me', {
        headers: { Authorization: 'Basic abc' },
      })
    );
    expect(badBearerRes.status).toBe(401);
  });

  it('returns 200 and principal details for /api/v1/auth/me with valid x-api-key', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/v1/auth/me', {
        headers: { 'x-api-key': TEST_API_KEY },
      })
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.authType).toBe('api-key');
    expect(body.data.role).toBe('admin');
  });

  it('verifies EdDSA JWT tokens against JWKS and issuer', async () => {
    const { publicKey, privateKey } = await generateKeyPair('EdDSA');
    const publicJwk = await exportJWK(publicKey);
    publicJwk.kid = 'test-eddsa-key';
    const localJwks = createLocalJWKSet({ keys: [publicJwk] });

    const issuer = env.NEON_AUTH_BASE_URL
      ? new URL(env.NEON_AUTH_BASE_URL).origin
      : 'https://auth.example.com';

    const validJwt = await new SignJWT({ email: 'user@example.com', role: 'user' })
      .setProtectedHeader({ alg: 'EdDSA', kid: 'test-eddsa-key' })
      .setSubject('user-123')
      .setIssuer(issuer)
      .setExpirationTime('5m')
      .sign(privateKey);

    const principal = await authenticateRequest(
      new Request('http://localhost/api/v1/notes', {
        headers: { Authorization: `Bearer ${validJwt}` },
      }),
      localJwks
    );

    expect(principal.sub).toBe('user-123');
    expect(principal.email).toBe('user@example.com');
    expect(principal.role).toBe('user');
    expect(principal.authType).toBe('jwt');

    const expiredJwt = await new SignJWT({ email: 'user@example.com' })
      .setProtectedHeader({ alg: 'EdDSA', kid: 'test-eddsa-key' })
      .setSubject('user-123')
      .setIssuer(issuer)
      .setExpirationTime('-1m')
      .sign(privateKey);

    expect(
      authenticateRequest(
        new Request('http://localhost/api/v1/notes', {
          headers: { Authorization: `Bearer ${expiredJwt}` },
        }),
        localJwks
      )
    ).rejects.toThrow('Invalid or expired bearer token');
  });

  it('enforces role-based authorization with requireRole', async () => {
    const roleApp = new Elysia()
      .use(errorMiddleware)
      .use(requireRole('superadmin'))
      .get('/admin-only', () => ({ ok: true }));

    const response = await roleApp.handle(
      new Request('http://localhost/admin-only', {
        headers: { 'x-api-key': TEST_API_KEY },
      })
    );
    expect(response.status).toBe(403);
  });

  it('enforces rate limiting and returns 429 when exceeded', async () => {
    const limitedApp = new Elysia()
      .use(createRateLimitMiddleware({ max: 2, windowMs: 10_000 }))
      .get('/ping', () => ({ ok: true }));

    const req = () =>
      new Request('http://localhost/ping', {
        headers: { 'x-forwarded-for': '203.0.113.10' },
      });

    expect((await limitedApp.handle(req())).status).toBe(200);
    expect((await limitedApp.handle(req())).status).toBe(200);

    const third = await limitedApp.handle(req());
    expect(third.status).toBe(429);
    expect(third.headers.get('retry-after')).toBeDefined();

    const body = await third.json();
    expect(body.success).toBe(false);
  });

  it('exposes OpenAPI securitySchemes and auth/notes paths at /docs/json', async () => {
    const response = await app.handle(new Request('http://localhost/docs/json'));
    expect(response.status).toBe(200);

    const spec = await response.json();
    expect(spec.components?.securitySchemes?.bearerAuth).toBeDefined();
    expect(spec.components?.securitySchemes?.apiKeyAuth).toBeDefined();
    expect(spec.paths['/api/v1/auth/me']).toBeDefined();
    expect(spec.paths['/api/v1/auth/providers']).toBeDefined();
    expect(spec.paths['/api/v1/notes/']).toBeDefined();
    expect(spec.paths['/api/v1/notes/{id}']).toBeDefined();
  });
});

