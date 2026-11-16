import { Elysia } from 'elysia';
import { requireAuth } from '../../middlewares/auth.middleware';
import { OPENAPI_SECURITY } from '../../plugins/swagger.plugin';
import { DocumentsController } from '../documents/documents.controller';
import { createDocumentBodySchema } from '../documents/documents.schema';
import { TasksController } from '../tasks/tasks.controller';
import { createTaskBodySchema, listTasksQuerySchema } from '../tasks/tasks.schema';
import { WorkspacesController } from './workspaces.controller';
import {
  createInviteBodySchema,
  createWorkspaceBodySchema,
  workspaceIdParamSchema,
} from './workspaces.schema';

export const workspacesRoutes = new Elysia({ prefix: '/workspaces' })
  .use(requireAuth)
  .get('/', ({ auth }) => WorkspacesController.list(auth.sub), {
    detail: {
      tags: ['Workspaces'],
      summary: 'List user workspaces',
      description: 'Retrieves all workspaces that the authenticated user is a member of.',
      security: OPENAPI_SECURITY,
    },
  })
  .post('/', ({ auth, body, set }) => WorkspacesController.create(auth.sub, body, set), {
    body: createWorkspaceBodySchema,
    detail: {
      tags: ['Workspaces'],
      summary: 'Create a workspace',
      description:
        'Creates a new workspace and automatically assigns the authenticated user as owner.',
      security: OPENAPI_SECURITY,
    },
  })
  .get('/:id', ({ auth, params }) => WorkspacesController.getById(params.id, auth.sub), {
    params: workspaceIdParamSchema,
    detail: {
      tags: ['Workspaces'],
      summary: 'Get workspace details',
      description: 'Retrieves workspace details including member and document statistics.',
      security: OPENAPI_SECURITY,
    },
  })
  .get(
    '/:id/members',
    ({ auth, params }) => WorkspacesController.listMembers(params.id, auth.sub),
    {
      params: workspaceIdParamSchema,
      detail: {
        tags: ['Workspaces'],
        summary: 'List workspace members',
        description: 'Retrieves all members with their roles in the workspace.',
        security: OPENAPI_SECURITY,
      },
    }
  )
  .post(
    '/:id/invites',
    ({ auth, params, body, set }) =>
      WorkspacesController.createInvite(params.id, auth.sub, body, set),
    {
      params: workspaceIdParamSchema,
      body: createInviteBodySchema,
      detail: {
        tags: ['Workspaces'],
        summary: 'Generate workspace invite',
        description: 'Generates an invite token/code for a user to join the workspace.',
        security: OPENAPI_SECURITY,
      },
    }
  )
  .get(
    '/:id/documents',
    ({ auth, params }) => DocumentsController.listWorkspaceDocuments(params.id, auth.sub),
    {
      params: workspaceIdParamSchema,
      detail: {
        tags: ['Documents'],
        summary: 'List workspace documents',
        description: 'Retrieves all document pages in the workspace.',
        security: OPENAPI_SECURITY,
      },
    }
  )
  .post(
    '/:id/documents',
    ({ auth, params, body, set }) =>
      DocumentsController.createDocument(params.id, auth.sub, body, set),
    {
      params: workspaceIdParamSchema,
      body: createDocumentBodySchema,
      detail: {
        tags: ['Documents'],
        summary: 'Create document in workspace',
        description: 'Creates a new document or nested page in the workspace.',
        security: OPENAPI_SECURITY,
      },
    }
  )
  .get(
    '/:id/tasks',
    ({ auth, params, query }) =>
      TasksController.listWorkspaceTasks(params.id, auth.sub, query),
    {
      params: workspaceIdParamSchema,
      query: listTasksQuerySchema,
      detail: {
        tags: ['Tasks'],
        summary: 'List workspace tasks',
        description: 'Retrieves all kanban tasks in the workspace with optional filters.',
        security: OPENAPI_SECURITY,
      },
    }
  )
  .post(
    '/:id/tasks',
    ({ auth, params, body, set }) =>
      TasksController.createTask(params.id, auth.sub, body, set),
    {
      params: workspaceIdParamSchema,
      body: createTaskBodySchema,
      detail: {
        tags: ['Tasks'],
        summary: 'Create kanban task',
        description: 'Creates a new kanban task in the workspace.',
        security: OPENAPI_SECURITY,
      },
    }
  );
