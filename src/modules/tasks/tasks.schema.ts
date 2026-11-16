import { t, type Static } from 'elysia';

export const taskIdParamSchema = t.Object({
  id: t.String({
    format: 'uuid',
    error: 'Task ID must be a valid UUID',
  }),
});

export const listTasksQuerySchema = t.Object({
  status: t.Optional(
    t.Union([t.Literal('todo'), t.Literal('in_progress'), t.Literal('done')])
  ),
  priority: t.Optional(
    t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high')])
  ),
  assigneeId: t.Optional(t.String({ format: 'uuid' })),
});

export const createTaskBodySchema = t.Object({
  title: t.String({
    minLength: 1,
    maxLength: 200,
    error: 'Title is required and must be between 1 and 200 characters',
  }),
  description: t.Optional(t.String({ maxLength: 50000 })),
  status: t.Optional(
    t.Union([t.Literal('todo'), t.Literal('in_progress'), t.Literal('done')], {
      default: 'todo',
    })
  ),
  priority: t.Optional(
    t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high')], {
      default: 'medium',
    })
  ),
  assigneeId: t.Optional(
    t.Nullable(
      t.String({
        format: 'uuid',
        error: 'Assignee ID must be a valid UUID',
      })
    )
  ),
  dueDate: t.Optional(t.Nullable(t.String())),
});

export const updateTaskBodySchema = t.Object({
  title: t.Optional(
    t.String({
      minLength: 1,
      maxLength: 200,
      error: 'Title must be between 1 and 200 characters',
    })
  ),
  description: t.Optional(t.Nullable(t.String({ maxLength: 50000 }))),
  status: t.Optional(
    t.Union([t.Literal('todo'), t.Literal('in_progress'), t.Literal('done')])
  ),
  priority: t.Optional(
    t.Union([t.Literal('low'), t.Literal('medium'), t.Literal('high')])
  ),
  assigneeId: t.Optional(
    t.Nullable(
      t.String({
        format: 'uuid',
        error: 'Assignee ID must be a valid UUID',
      })
    )
  ),
  dueDate: t.Optional(t.Nullable(t.String())),
});

export type TaskIdParam = Static<typeof taskIdParamSchema>;
export type ListTasksQuery = Static<typeof listTasksQuerySchema>;
export type CreateTaskInput = Static<typeof createTaskBodySchema>;
export type UpdateTaskInput = Static<typeof updateTaskBodySchema>;
