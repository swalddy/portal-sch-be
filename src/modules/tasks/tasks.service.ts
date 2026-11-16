import { prisma } from '../../lib/prisma';
import { verifyWorkspaceMember } from '../../middlewares/workspace.middleware';
import { BadRequestError, NotFoundError } from '../../utils/errors.util';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from './tasks.schema';

export class TasksService {
  public static async listWorkspaceTasks(
    workspaceId: string,
    userId: string,
    query: ListTasksQuery
  ) {
    await verifyWorkspaceMember(workspaceId, userId);

    const where: Record<string, unknown> = { workspaceId };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assigneeId) where.assigneeId = query.assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return tasks;
  }

  public static async createTask(
    workspaceId: string,
    userId: string,
    input: CreateTaskInput
  ) {
    await verifyWorkspaceMember(workspaceId, userId);

    if (input.assigneeId) {
      const isAssigneeMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: input.assigneeId,
          },
        },
      });

      if (!isAssigneeMember) {
        throw new BadRequestError('Assignee must be a member of this workspace');
      }
    }

    let parsedDueDate: Date | null = null;
    if (input.dueDate) {
      parsedDueDate = new Date(input.dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        throw new BadRequestError('Invalid dueDate format');
      }
    }

    const task = await prisma.task.create({
      data: {
        workspaceId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        status: input.status || 'todo',
        priority: input.priority || 'medium',
        assigneeId: input.assigneeId || null,
        dueDate: parsedDueDate,
      },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return task;
  }

  public static async getTask(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundError(`Task with ID "${taskId}" not found`);
    }

    await verifyWorkspaceMember(task.workspaceId, userId);

    return task;
  }

  public static async updateTask(
    taskId: string,
    userId: string,
    input: UpdateTaskInput
  ) {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existing) {
      throw new NotFoundError(`Task with ID "${taskId}" not found`);
    }

    await verifyWorkspaceMember(existing.workspaceId, userId);

    if (input.assigneeId !== undefined && input.assigneeId !== null) {
      const isAssigneeMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: existing.workspaceId,
            userId: input.assigneeId,
          },
        },
      });

      if (!isAssigneeMember) {
        throw new BadRequestError('Assignee must be a member of this workspace');
      }
    }

    let parsedDueDate: Date | null | undefined = undefined;
    if (input.dueDate !== undefined) {
      if (input.dueDate === null) {
        parsedDueDate = null;
      } else {
        parsedDueDate = new Date(input.dueDate);
        if (isNaN(parsedDueDate.getTime())) {
          throw new BadRequestError('Invalid dueDate format');
        }
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() || null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
        ...(parsedDueDate !== undefined ? { dueDate: parsedDueDate } : {}),
      },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  public static async deleteTask(taskId: string, userId: string) {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existing) {
      throw new NotFoundError(`Task with ID "${taskId}" not found`);
    }

    await verifyWorkspaceMember(existing.workspaceId, userId);

    await prisma.task.delete({
      where: { id: taskId },
    });

    return { id: taskId, workspaceId: existing.workspaceId };
  }
}
