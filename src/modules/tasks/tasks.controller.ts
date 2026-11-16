import { successResponse } from '../../utils/response.util';
import { TasksService } from './tasks.service';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from './tasks.schema';

export class TasksController {
  public static async listWorkspaceTasks(
    workspaceId: string,
    userId: string,
    query: ListTasksQuery
  ) {
    const tasks = await TasksService.listWorkspaceTasks(workspaceId, userId, query);
    return successResponse(tasks, 'Workspace tasks retrieved successfully');
  }

  public static async createTask(
    workspaceId: string,
    userId: string,
    body: CreateTaskInput,
    set: { status?: number | string }
  ) {
    const task = await TasksService.createTask(workspaceId, userId, body);
    set.status = 201;
    return successResponse(task, 'Task created successfully');
  }

  public static async getById(taskId: string, userId: string) {
    const task = await TasksService.getTask(taskId, userId);
    return successResponse(task, 'Task retrieved successfully');
  }

  public static async update(taskId: string, userId: string, body: UpdateTaskInput) {
    const updated = await TasksService.updateTask(taskId, userId, body);
    return successResponse(updated, 'Task updated successfully');
  }

  public static async remove(taskId: string, userId: string) {
    const deleted = await TasksService.deleteTask(taskId, userId);
    return successResponse(deleted, 'Task deleted successfully');
  }
}
