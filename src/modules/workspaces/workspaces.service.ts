import { randomUUID } from 'node:crypto';
import { prisma } from '../../lib/prisma';
import { verifyWorkspaceMember } from '../../middlewares/workspace.middleware';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../utils/errors.util';
import type {
  AcceptInviteInput,
  CreateInviteInput,
  CreateWorkspaceInput,
} from './workspaces.schema';

export class WorkspacesService {
  public static async listUserWorkspaces(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            _count: {
              select: {
                members: true,
                documents: true,
                tasks: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      myRole: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  public static async createWorkspace(userId: string, input: CreateWorkspaceInput) {
    return prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: input.name.trim(),
          icon: input.icon?.trim() || null,
          ownerId: userId,
        },
      });

      const member = await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: 'owner',
        },
      });

      return {
        ...workspace,
        myRole: member.role,
      };
    });
  }

  public static async getWorkspaceDetails(workspaceId: string, userId: string) {
    const { workspace, member } = await verifyWorkspaceMember(workspaceId, userId);

    const counts = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            documents: true,
            tasks: true,
          },
        },
      },
    });

    return {
      ...counts,
      myRole: member.role,
    };
  }

  public static async listMembers(workspaceId: string, userId: string) {
    await verifyWorkspaceMember(workspaceId, userId);

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      username: m.user.username,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  public static async createInvite(
    workspaceId: string,
    userId: string,
    input: CreateInviteInput
  ) {
    const { member } = await verifyWorkspaceMember(workspaceId, userId);

    if (member.role !== 'owner' && member.role !== 'admin') {
      throw new ForbiddenError('Only workspace owner or admin can invite members');
    }

    const inviteCode = randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email: input.email.trim().toLowerCase(),
        role: input.role || 'member',
        inviteCode,
        status: 'pending',
        expiresAt,
      },
    });

    return invite;
  }

  public static async acceptInvite(userId: string, input: AcceptInviteInput) {
    const invite = await prisma.workspaceInvite.findUnique({
      where: { inviteCode: input.inviteCode.trim() },
      include: {
        workspace: true,
      },
    });

    if (!invite) {
      throw new NotFoundError('Invalid invite code');
    }

    if (invite.status === 'accepted') {
      throw new ConflictError('Invite code has already been used');
    }

    if (new Date() > invite.expiresAt) {
      throw new BadRequestError('Invite code has expired');
    }

    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError('You are already a member of this workspace');
    }

    return prisma.$transaction(async (tx) => {
      const newMember = await tx.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId,
          role: invite.role,
        },
      });

      await tx.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: 'accepted' },
      });

      return {
        workspace: invite.workspace,
        member: newMember,
      };
    });
  }
}
