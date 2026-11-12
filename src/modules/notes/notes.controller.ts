import { successResponse } from '@/utils/response.util';
import { NotesService } from './notes.service';
import type { CreateNoteInput, ListNotesQuery, UpdateNoteInput } from './notes.schema';

export class NotesController {
  public static async list(query: ListNotesQuery) {
    const result = await NotesService.findAll(query);
    return successResponse(result, 'Notes retrieved successfully');
  }

  public static async getById(id: string) {
    const note = await NotesService.findById(id);
    return successResponse(note, 'Note retrieved successfully');
  }

  public static async create(body: CreateNoteInput, set: { status?: number | string }) {
    const note = await NotesService.create(body);
    set.status = 201;
    return successResponse(note, 'Note created successfully');
  }

  public static async update(id: string, body: UpdateNoteInput) {
    const note = await NotesService.update(id, body);
    return successResponse(note, 'Note updated successfully');
  }

  public static async remove(id: string) {
    const deleted = await NotesService.remove(id);
    return successResponse(deleted, 'Note deleted successfully');
  }
}

