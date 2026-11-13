import { successResponse } from '../../utils/response.util';
import { HighscoresService } from './highscores.service';
import type {
  CreateHighscoreInput,
  ListHighscoresQuery,
  SubmitScoreInput,
} from './highscores.schema';

export class HighscoresController {
  public static async list(query: ListHighscoresQuery) {
    const list = await HighscoresService.findAll(query);
    return successResponse(list, 'Highscores retrieved successfully');
  }

  public static async getByGameId(gameId: string) {
    const highscore = await HighscoresService.findByGameId(gameId);
    return successResponse(highscore, 'Highscore retrieved successfully');
  }

  public static async create(body: CreateHighscoreInput, set: { status?: number | string }) {
    const created = await HighscoresService.create(body);
    set.status = 201;
    return successResponse(created, 'Game highscore created successfully');
  }

  public static async submitScore(gameId: string, body: SubmitScoreInput) {
    const result = await HighscoresService.submitScore(gameId, body);
    const message = result.isTop3
      ? `New score ranked #${result.rank} on the leaderboard!`
      : 'Score submitted, but did not qualify for Top 3';
    return successResponse(result, message);
  }

  public static async remove(gameId: string) {
    const deleted = await HighscoresService.remove(gameId);
    return successResponse(deleted, 'Game highscore deleted successfully');
  }
}

