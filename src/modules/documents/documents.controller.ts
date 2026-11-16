import { successResponse } from '../../utils/response.util';
import { DocumentsService } from './documents.service';
import type { CreateDocumentInput, UpdateDocumentInput } from './documents.schema';

export class DocumentsController {
  public static async listWorkspaceDocuments(workspaceId: string, userId: string) {
    const documents = await DocumentsService.listWorkspaceDocuments(workspaceId, userId);
    return successResponse(documents, 'Workspace documents retrieved successfully');
  }

  public static async createDocument(
    workspaceId: string,
    userId: string,
    body: CreateDocumentInput,
    set: { status?: number | string }
  ) {
    const document = await DocumentsService.createDocument(workspaceId, userId, body);
    set.status = 201;
    return successResponse(document, 'Document created successfully');
  }

  public static async getById(documentId: string, userId: string) {
    const document = await DocumentsService.getDocument(documentId, userId);
    return successResponse(document, 'Document retrieved successfully');
  }

  public static async update(documentId: string, userId: string, body: UpdateDocumentInput) {
    const updated = await DocumentsService.updateDocument(documentId, userId, body);
    return successResponse(updated, 'Document updated successfully');
  }

  public static async remove(documentId: string, userId: string) {
    const deleted = await DocumentsService.deleteDocument(documentId, userId);
    return successResponse(deleted, 'Document deleted successfully');
  }
}
