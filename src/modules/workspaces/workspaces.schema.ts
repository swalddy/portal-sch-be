import { t, type Static } from 'elysia';

export const workspaceIdParamSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: 'Workspace ID must be a valid UUID',
  }),
});

export const createWorkspaceBodySchema = t.Object({
  name: t.String({
    minLength: 1,
    maxLength: 100,
    error: 'Workspace name is required and must be between 1 and 100 characters',
  }),
  icon: t.Optional(
    t.String({
      maxLength: 100,
      error: 'Icon must be at most 100 characters',
    })
  ),
});

export const createInviteBodySchema = t.Object({
  email: t.String({
    format: 'email',
    error: 'A valid email address is required for invite',
  }),
  role: t.Optional(
    t.Union([t.Literal('admin'), t.Literal('member')], {
      error: "Role must be either 'admin' or 'member'",
    })
  ),
});

export const acceptInviteBodySchema = t.Object({
  inviteCode: t.String({
    minLength: 1,
    error: 'Invite code is required',
  }),
});

export type WorkspaceIdParam = Static<typeof workspaceIdParamSchema>;
export type CreateWorkspaceInput = Static<typeof createWorkspaceBodySchema>;
export type CreateInviteInput = Static<typeof createInviteBodySchema>;
export type AcceptInviteInput = Static<typeof acceptInviteBodySchema>;
