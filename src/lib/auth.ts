import { createHash, timingSafeEqual } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { env } from '@/lib/env';
import { UnauthorizedError } from '@/utils/errors.util';

export interface AuthPrincipal {
  sub: string;
  email?: string;
  role: string;
  authType: 'jwt' | 'api-key';
}

let cachedJwksUrl: string | null = null;
let cachedJwks: JWTVerifyGetKey | null = null;

function getRemoteJwks(): JWTVerifyGetKey {
  const jwksUrl = env.NEON_AUTH_JWKS_URL;
  if (!jwksUrl) {
    throw new UnauthorizedError('JWT authentication is not configured');
  }

  if (cachedJwks && cachedJwksUrl === jwksUrl) {
    return cachedJwks;
  }

  cachedJwksUrl = jwksUrl;
  cachedJwks = createRemoteJWKSet(new URL(jwksUrl));
  return cachedJwks;
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

export function verifyApiKey(providedKey: string): AuthPrincipal | null {
  const configuredKeys = env.API_KEYS;
  if (configuredKeys.length === 0) {
    return null;
  }

  const providedHash = sha256(providedKey);
  for (const key of configuredKeys) {
    if (timingSafeEqual(providedHash, sha256(key))) {
      return {
        sub: 'api-key-client',
        role: 'admin',
        authType: 'api-key',
      };
    }
  }

  return null;
}

export async function verifyJwt(
  token: string,
  keySetOverride?: JWTVerifyGetKey
): Promise<AuthPrincipal> {
  const jwks = keySetOverride ?? getRemoteJwks();

  const issuers: string[] = [];
  if (env.NEON_AUTH_BASE_URL) {
    try {
      const parsed = new URL(env.NEON_AUTH_BASE_URL);
      issuers.push(parsed.origin);
      if (env.NEON_AUTH_BASE_URL !== parsed.origin) {
        issuers.push(env.NEON_AUTH_BASE_URL);
      }
    } catch {
      issuers.push(env.NEON_AUTH_BASE_URL);
    }
  }

  try {
    const { payload } = await jwtVerify(
      token,
      jwks,
      issuers.length > 0 ? { issuer: issuers } : {}
    );

    if (!payload.sub) {
      throw new UnauthorizedError('Token is missing subject claim');
    }

    return {
      sub: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      role: typeof payload.role === 'string' ? payload.role : 'user',
      authType: 'jwt',
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Invalid or expired bearer token');
  }
}

export async function authenticateRequest(
  request: Request,
  keySetOverride?: JWTVerifyGetKey
): Promise<AuthPrincipal> {
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedError('Invalid Authorization header format. Expected: Bearer <token>');
    }
    return verifyJwt(token.trim(), keySetOverride);
  }

  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    const principal = verifyApiKey(apiKey.trim());
    if (!principal) {
      throw new UnauthorizedError('Invalid API key');
    }
    return principal;
  }

  throw new UnauthorizedError('Authentication required. Provide a Bearer token or x-api-key header.');
}

