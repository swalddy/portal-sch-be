import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors.util';
import type { CreateNoteInput, ListNotesQuery, UpdateNoteInput } from './notes.schema';

const NOTE_SELECT = {
  id: true,
  title: true,
  content: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.NoteSelect;

function normalizeRequiredText(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new BadRequestError(`${fieldName} cannot be blank`);
  }
  return trimmed;
}

export class NotesService {
  public static async findAll(query: ListNotesQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.NoteWhereInput = {
      ...(query.pinned !== undefined ? { isPinned: query.pinned } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { content: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.note.findMany({
        where,
        select: NOTE_SELECT,
        orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.note.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async findById(id: string) {
    const note = await prisma.note.findUnique({
      where: { id },
      select: NOTE_SELECT,
    });

    if (!note) {
      throw new NotFoundError(`Note with ID '${id}' was not found`);
    }

    return note;
  }

  public static async create(input: CreateNoteInput) {
    const title = normalizeRequiredText(input.title, 'Title');
    const content = normalizeRequiredText(input.content, 'Content');

    return prisma.note.create({
      data: {
        title,
        content,
        isPinned: input.isPinned ?? false,
      },
      select: NOTE_SELECT,
    });
  }

  public static async update(id: string, input: UpdateNoteInput) {
    const data: Prisma.NoteUpdateInput = {};

    if (input.title !== undefined) {
      data.title = normalizeRequiredText(input.title, 'Title');
    }
    if (input.content !== undefined) {
      data.content = normalizeRequiredText(input.content, 'Content');
    }
    if (input.isPinned !== undefined) {
      data.isPinned = input.isPinned;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestError('At least one field (title, content, isPinned) must be provided');
    }

    try {
      return await prisma.note.update({
        where: { id },
        data,
        select: NOTE_SELECT,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError(`Note with ID '${id}' was not found`);
      }
      throw error;
    }
  }

  public static async remove(id: string) {
    try {
      return await prisma.note.delete({
        where: { id },
        select: { id: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError(`Note with ID '${id}' was not found`);
      }
      throw error;
    }
  }
}

