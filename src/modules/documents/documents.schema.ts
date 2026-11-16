import { t, type Static } from 'elysia';

export const documentIdParamSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: 'Document ID must be a valid UUID',
  }),
});

export const createDocumentBodySchema = t.Object({
  title: t.String({
    minLength: 1,
    maxLength: 200,
    error: 'Title is required and must be between 1 and 200 characters',
  }),
  icon: t.Optional(t.String({ maxLength: 100 })),
  content: t.Optional(t.String({ maxLength: 500000 })),
  parentId: t.Optional(
    t.Nullable(
      t.String({
        format: 'uuid',
        error: 'Parent ID must be a valid UUID',
      })
    )
  ),
});

export const updateDocumentBodySchema = t.Object({
  title: t.Optional(
    t.String({
      minLength: 1,
      maxLength: 200,
      error: 'Title must be between 1 and 200 characters',
    })
  ),
  icon: t.Optional(t.Nullable(t.String({ maxLength: 100 }))),
  content: t.Optional(t.String({ maxLength: 500000 })),
  parentId: t.Optional(
    t.Nullable(
      t.String({
        format: 'uuid',
        error: 'Parent ID must be a valid UUID',
      })
    )
  ),
});

export type DocumentIdParam = Static<typeof documentIdParamSchema>;
export type CreateDocumentInput = Static<typeof createDocumentBodySchema>;
export type UpdateDocumentInput = Static<typeof updateDocumentBodySchema>;
