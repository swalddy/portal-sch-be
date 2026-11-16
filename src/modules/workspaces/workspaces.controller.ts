import { successResponse } from '../../utils/response.util';
import { WorkspacesService } from './workspaces.service';
import type {
  AcceptInviteInput,
  CreateInviteInput,
  CreateWorkspaceInput,
} from './workspaces.schema';

export class WorkspacesController {
  public static async list(userId: string) {
    const list = await WorkspacesService.listUserWorkspaces(userId);
    return successResponse(list, 'Workspaces retrieved successfully');
  }

  public static async create(
    userId: string,
    body: CreateWorkspaceInput,
    set: { status?: number | string }
  ) {
    const workspace = await WorkspacesService.createWorkspace(userId, body);
    set.status = 201;
    return successResponse(workspace, 'Workspace created successfully');
  }

  public static async getById(workspaceId: string, userId: string) {
    const workspace = await WorkspacesService.getWorkspaceDetails(workspaceId, userId);
    return successResponse(workspace, 'Workspace details retrieved successfully');
  }

  public static async listMembers(workspaceId: string, userId: string) {
    const members = await WorkspacesService.listMembers(workspaceId, userId);
    return successResponse(members, 'Workspace members retrieved successfully');
  }

  public static async createInvite(
    workspaceId: string,
    userId: string,
    body: CreateInviteInput,
    set: { status?: number | string }
  ) {
    const invite = await WorkspacesService.createInvite(workspaceId, userId, body);
    set.status = 201;
    return successResponse(invite, 'Workspace invite created successfully');
  }

  public static async acceptInvite(userId: string, body: AcceptInviteInput) {
    const result = await WorkspacesService.acceptInvite(userId, body);
    return successResponse(result, 'Joined workspace successfully');
  }
}
