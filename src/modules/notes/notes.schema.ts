import { t, type Static } from 'elysia';

export const noteIdParamSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: 'Note ID must be a valid UUID',
  }),
});

export const listNotesQuerySchema = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
  search: t.Optional(t.String({ maxLength: 100 })),
  pinned: t.Optional(t.BooleanString()),
});

export const createNoteBodySchema = t.Object({
  title: t.String({
    minLength: 1,
    maxLength: 200,
    error: 'Title is required and must be between 1 and 200 characters',
  }),
  content: t.String({
    minLength: 1,
    maxLength: 10000,
    error: 'Content is required and must be between 1 and 10000 characters',
  }),
  isPinned: t.Optional(t.Boolean({ default: false })),
});

export const updateNoteBodySchema = t.Object({
  title: t.Optional(
    t.String({
      minLength: 1,
      maxLength: 200,
      error: 'Title must be between 1 and 200 characters',
    })
  ),
  content: t.Optional(
    t.String({
      minLength: 1,
      maxLength: 10000,
      error: 'Content must be between 1 and 10000 characters',
    })
  ),
  isPinned: t.Optional(t.Boolean()),
});

export type ListNotesQuery = Static<typeof listNotesQuerySchema>;
export type CreateNoteInput = Static<typeof createNoteBodySchema>;
export type UpdateNoteInput = Static<typeof updateNoteBodySchema>;

