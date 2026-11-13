import { Elysia } from 'elysia';
import { requireAuth } from '../../middlewares/auth.middleware';
import { OPENAPI_SECURITY } from '../../plugins/swagger.plugin';
import { NotesController } from './notes.controller';
import {
  createNoteBodySchema,
  listNotesQuerySchema,
  noteIdParamSchema,
  updateNoteBodySchema,
} from './notes.schema';

export const notesRoutes = new Elysia({ prefix: '/notes' })
  .use(requireAuth)
  .get('/', ({ query }) => NotesController.list(query), {
    query: listNotesQuerySchema,
    detail: {
      tags: ['Notes'],
      summary: 'List notes',
      description: 'Retrieves a paginated list of notes with optional search and pinned filter.',
      security: OPENAPI_SECURITY,
    },
  })
  .get('/:id', ({ params }) => NotesController.getById(params.id), {
    params: noteIdParamSchema,
    detail: {
      tags: ['Notes'],
      summary: 'Get a note by ID',
      description: 'Retrieves a single note by its UUID.',
      security: OPENAPI_SECURITY,
    },
  })
  .post('/', ({ body, set }) => NotesController.create(body, set), {
    body: createNoteBodySchema,
    detail: {
      tags: ['Notes'],
      summary: 'Create a note',
      description: 'Creates a new note with title, content, and optional pinned status.',
      security: OPENAPI_SECURITY,
    },
  })
  .patch('/:id', ({ params, body }) => NotesController.update(params.id, body), {
    params: noteIdParamSchema,
    body: updateNoteBodySchema,
    detail: {
      tags: ['Notes'],
      summary: 'Update a note',
      description: 'Partially updates an existing note by its UUID.',
      security: OPENAPI_SECURITY,
    },
  })
  .delete('/:id', ({ params }) => NotesController.remove(params.id), {
    params: noteIdParamSchema,
    detail: {
      tags: ['Notes'],
      summary: 'Delete a note',
      description: 'Deletes an existing note by its UUID.',
      security: OPENAPI_SECURITY,
    },
  });
