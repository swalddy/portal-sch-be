import { prisma } from '../../lib/prisma';
import { verifyWorkspaceMember } from '../../middlewares/workspace.middleware';
import { BadRequestError, NotFoundError } from '../../utils/errors.util';
import type { CreateDocumentInput, UpdateDocumentInput } from './documents.schema';

export class DocumentsService {
  public static async listWorkspaceDocuments(workspaceId: string, userId: string) {
    await verifyWorkspaceMember(workspaceId, userId);

    const documents = await prisma.document.findMany({
      where: { workspaceId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            icon: true,
            parentId: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return documents;
  }

  public static async createDocument(
    workspaceId: string,
    userId: string,
    input: CreateDocumentInput
  ) {
    await verifyWorkspaceMember(workspaceId, userId);

    if (input.parentId) {
      const parent = await prisma.document.findFirst({
        where: { id: input.parentId, workspaceId },
      });
      if (!parent) {
        throw new NotFoundError(
          `Parent document with ID "${input.parentId}" not found in this workspace`
        );
      }
    }

    const document = await prisma.document.create({
      data: {
        workspaceId,
        title: input.title.trim(),
        icon: input.icon?.trim() || null,
        content: input.content ?? '',
        parentId: input.parentId || null,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return document;
  }

  public static async getDocument(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            icon: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundError(`Document with ID "${documentId}" not found`);
    }

    await verifyWorkspaceMember(document.workspaceId, userId);

    return document;
  }

  public static async updateDocument(
    documentId: string,
    userId: string,
    input: UpdateDocumentInput
  ) {
    const existing = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!existing) {
      throw new NotFoundError(`Document with ID "${documentId}" not found`);
    }

    await verifyWorkspaceMember(existing.workspaceId, userId);

    if (input.parentId !== undefined && input.parentId !== null) {
      if (input.parentId === documentId) {
        throw new BadRequestError('A document cannot be its own parent');
      }

      const parent = await prisma.document.findFirst({
        where: { id: input.parentId, workspaceId: existing.workspaceId },
      });

      if (!parent) {
        throw new NotFoundError(
          `Parent document with ID "${input.parentId}" not found in this workspace`
        );
      }
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.icon !== undefined ? { icon: input.icon?.trim() || null } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      },
      include: {
        creator: {
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

  public static async deleteDocument(documentId: string, userId: string) {
    const existing = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!existing) {
      throw new NotFoundError(`Document with ID "${documentId}" not found`);
    }

    await verifyWorkspaceMember(existing.workspaceId, userId);

    await prisma.document.delete({
      where: { id: documentId },
    });

    return { id: documentId, workspaceId: existing.workspaceId };
  }
}
