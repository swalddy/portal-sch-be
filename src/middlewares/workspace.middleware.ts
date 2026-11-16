import { prisma } from '../lib/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors.util';

export async function verifyWorkspaceMember(workspaceId: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    throw new NotFoundError(`Workspace with ID "${workspaceId}" not found`);
  }

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });

  if (!member) {
    throw new ForbiddenError('You do not have access to this workspace');
  }

  return { workspace, member };
}
