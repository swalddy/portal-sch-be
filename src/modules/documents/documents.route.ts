import { Elysia } from 'elysia';
import { requireAuth } from '../../middlewares/auth.middleware';
import { OPENAPI_SECURITY } from '../../plugins/swagger.plugin';
import { DocumentsController } from './documents.controller';
import { documentIdParamSchema, updateDocumentBodySchema } from './documents.schema';

export const documentsRoutes = new Elysia({ prefix: '/documents' })
  .use(requireAuth)
  .get(
    '/:id',
    ({ auth, params }) => DocumentsController.getById(params.id, auth.sub),
    {
      params: documentIdParamSchema,
      detail: {
        tags: ['Documents'],
        summary: 'Get document details',
        description: 'Retrieves a single document with its markdown content and hierarchy.',
        security: OPENAPI_SECURITY,
      },
    }
  )
  .put(
    '/:id',
    ({ auth, params, body }) => DocumentsController.update(params.id, auth.sub, body),
    {
      params: documentIdParamSchema,
      body: updateDocumentBodySchema,
      detail: {
        tags: ['Documents'],
        summary: 'Update document',
        description: 'Updates document title, icon, markdown content, or parent page.',
        security: OPENAPI_SECURITY,
      },
    }
  )
  .delete(
    '/:id',
    ({ auth, params }) => DocumentsController.remove(params.id, auth.sub),
    {
      params: documentIdParamSchema,
      detail: {
        tags: ['Documents'],
        summary: 'Delete document',
        description: 'Deletes a document and its nested children from the workspace.',
        security: OPENAPI_SECURITY,
      },
    }
  );
