import { Elysia } from 'elysia';
import { requireAuth } from '../../middlewares/auth.middleware';
import { OPENAPI_SECURITY } from '../../plugins/swagger.plugin';
import { TasksController } from './tasks.controller';
import { taskIdParamSchema, updateTaskBodySchema } from './tasks.schema';

export const tasksRoutes = new Elysia({ prefix: '/tasks' })
  .use(requireAuth)
  .get(
    '/:id',
    ({ auth, params }) => TasksController.getById(params.id, auth.sub),
    {
      params: taskIdParamSchema,
      detail: {
        tags: ['Tasks'],
        summary: 'Get task details',
        description: 'Retrieves a single kanban task with assignee information.',
        security: OPENAPI_SECURITY,
      },
    }
  )
  .put(
    '/:id',
    ({ auth, params, body }) => TasksController.update(params.id, auth.sub, body),
    {
      params: taskIdParamSchema,
      body: updateTaskBodySchema,
      detail: {
        tags: ['Tasks'],
        summary: 'Update task',
        description:
          'Updates kanban status (drag-and-drop), priority, assignment, due date, or title.',
        security: OPENAPI_SECURITY,
      },
    }
  )
  .delete(
    '/:id',
    ({ auth, params }) => TasksController.remove(params.id, auth.sub),
    {
      params: taskIdParamSchema,
      detail: {
        tags: ['Tasks'],
        summary: 'Delete task',
        description: 'Deletes a kanban task from the workspace.',
        security: OPENAPI_SECURITY,
      },
    }
  );
