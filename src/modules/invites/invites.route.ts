import { Elysia } from 'elysia';
import { requireAuth } from '../../middlewares/auth.middleware';
import { OPENAPI_SECURITY } from '../../plugins/swagger.plugin';
import { WorkspacesController } from '../workspaces/workspaces.controller';
import { acceptInviteBodySchema } from '../workspaces/workspaces.schema';

export const invitesRoutes = new Elysia({ prefix: '/invites' })
  .use(requireAuth)
  .post(
    '/accept',
    ({ auth, body }) => WorkspacesController.acceptInvite(auth.sub, body),
    {
      body: acceptInviteBodySchema,
      detail: {
        tags: ['Workspaces'],
        summary: 'Accept a workspace invite',
        description: 'Uses an invite code to join a workspace as a member.',
        security: OPENAPI_SECURITY,
      },
    }
  );
