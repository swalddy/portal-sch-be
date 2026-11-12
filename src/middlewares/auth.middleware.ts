import { Elysia } from 'elysia';
import { authenticateRequest, type AuthPrincipal } from '@/lib/auth';
import { ForbiddenError } from '@/utils/errors.util';

export const requireAuth = new Elysia({ name: 'require-auth' }).resolve(
  { as: 'scoped' },
  async ({ request }): Promise<{ auth: AuthPrincipal }> => {
    const auth = await authenticateRequest(request);
    return { auth };
  }
);

export function requireRole(...allowedRoles: string[]) {
  return new Elysia({ name: `require-role:${allowedRoles.join(',')}` }).resolve(
    { as: 'scoped' },
    async ({ request }): Promise<{ auth: AuthPrincipal }> => {
      const auth = await authenticateRequest(request);
      if (!allowedRoles.includes(auth.role)) {
        throw new ForbiddenError('Insufficient permissions for this resource');
      }
      return { auth };
    }
  );
}
