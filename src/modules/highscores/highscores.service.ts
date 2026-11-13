import { prisma } from '../../lib/prisma';
import { ConflictError, NotFoundError } from '../../utils/errors.util';
import type {
  CreateHighscoreInput,
  ListHighscoresQuery,
  SubmitScoreInput,
} from './highscores.schema';

export interface ScoreEntry {
  name: string;
  score: number;
}

export interface FormattedHighscore {
  id: string;
  gameId: string;
  gameName: string;
  top1: ScoreEntry | null;
  top2: ScoreEntry | null;
  top3: ScoreEntry | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoreSubmissionResult {
  gameId: string;
  gameName: string;
  submitted: ScoreEntry;
  rank: number | null;
  isTop3: boolean;
  top1: ScoreEntry | null;
  top2: ScoreEntry | null;
  top3: ScoreEntry | null;
}

function formatHighscore(record: {
  id: string;
  gameId: string;
  gameName: string;
  top1Name: string | null;
  top1Score: number | null;
  top2Name: string | null;
  top2Score: number | null;
  top3Name: string | null;
  top3Score: number | null;
  createdAt: Date;
  updatedAt: Date;
}): FormattedHighscore {
  return {
    id: record.id,
    gameId: record.gameId,
    gameName: record.gameName,
    top1:
      record.top1Name && record.top1Score !== null
        ? { name: record.top1Name, score: record.top1Score }
        : null,
    top2:
      record.top2Name && record.top2Score !== null
        ? { name: record.top2Name, score: record.top2Score }
        : null,
    top3:
      record.top3Name && record.top3Score !== null
        ? { name: record.top3Name, score: record.top3Score }
        : null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class HighscoresService {
  public static async findAll(query: ListHighscoresQuery): Promise<FormattedHighscore[]> {
    const where = query.search
      ? {
          OR: [
            { gameId: { contains: query.search, mode: 'insensitive' as const } },
            { gameName: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const records = await prisma.highscore.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return records.map(formatHighscore);
  }

  public static async findByGameId(gameId: string): Promise<FormattedHighscore> {
    const record = await prisma.highscore.findUnique({
      where: { gameId },
    });

    if (!record) {
      throw new NotFoundError(`Game with ID "${gameId}" not found`);
    }

    return formatHighscore(record);
  }

  public static async create(input: CreateHighscoreInput): Promise<FormattedHighscore> {
    const existing = await prisma.highscore.findUnique({
      where: { gameId: input.gameId },
    });

    if (existing) {
      throw new ConflictError(`Game with ID "${input.gameId}" already exists`);
    }

    // Collect and sort initial scores if any were provided
    const initialList: ScoreEntry[] = [];
    if (input.top1Name && input.top1Score !== undefined && input.top1Score !== null) {
      initialList.push({ name: input.top1Name.trim(), score: input.top1Score });
    }
    if (input.top2Name && input.top2Score !== undefined && input.top2Score !== null) {
      initialList.push({ name: input.top2Name.trim(), score: input.top2Score });
    }
    if (input.top3Name && input.top3Score !== undefined && input.top3Score !== null) {
      initialList.push({ name: input.top3Name.trim(), score: input.top3Score });
    }

    initialList.sort((a, b) => b.score - a.score);

    const record = await prisma.highscore.create({
      data: {
        gameId: input.gameId.trim().toLowerCase(),
        gameName: input.gameName.trim(),
        top1Name: initialList[0]?.name ?? null,
        top1Score: initialList[0]?.score ?? null,
        top2Name: initialList[1]?.name ?? null,
        top2Score: initialList[1]?.score ?? null,
        top3Name: initialList[2]?.name ?? null,
        top3Score: initialList[2]?.score ?? null,
      },
    });

    return formatHighscore(record);
  }

  public static async submitScore(
    gameId: string,
    input: SubmitScoreInput
  ): Promise<ScoreSubmissionResult> {
    const record = await prisma.highscore.findUnique({
      where: { gameId: gameId.trim().toLowerCase() },
    });

    if (!record) {
      throw new NotFoundError(
        `Game with ID "${gameId}" not found. Please create it first via POST /highscores.`
      );
    }

    // Extract current leaderboard entries
    const existingEntries: ScoreEntry[] = [];
    if (record.top1Name && record.top1Score !== null) {
      existingEntries.push({ name: record.top1Name, score: record.top1Score });
    }
    if (record.top2Name && record.top2Score !== null) {
      existingEntries.push({ name: record.top2Name, score: record.top2Score });
    }
    if (record.top3Name && record.top3Score !== null) {
      existingEntries.push({ name: record.top3Name, score: record.top3Score });
    }

    const newEntry: ScoreEntry = {
      name: input.name.trim(),
      score: input.score,
    };

    // Combine existing with new entry
    const candidates = [...existingEntries, newEntry];

    // Sort descending by score. On tie, prioritize earlier achiever.
    candidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a === newEntry) return 1;
      if (b === newEntry) return -1;
      return 0;
    });

    // Take top 3
    const top3 = candidates.slice(0, 3);
    const rankIndex = top3.indexOf(newEntry);
    const isTop3 = rankIndex !== -1;
    const rank = isTop3 ? rankIndex + 1 : null;

    let updatedGameName = record.gameName;
    if (input.gameName && input.gameName.trim().length > 0) {
      updatedGameName = input.gameName.trim();
    }

    // If new score entered top 3, or gameName changed, update the DB
    if (isTop3 || input.gameName) {
      await prisma.highscore.update({
        where: { gameId: record.gameId },
        data: {
          gameName: updatedGameName,
          top1Name: top3[0]?.name ?? null,
          top1Score: top3[0]?.score ?? null,
          top2Name: top3[1]?.name ?? null,
          top2Score: top3[1]?.score ?? null,
          top3Name: top3[2]?.name ?? null,
          top3Score: top3[2]?.score ?? null,
        },
      });
    }

    return {
      gameId: record.gameId,
      gameName: updatedGameName,
      submitted: newEntry,
      rank,
      isTop3,
      top1: top3[0] ?? null,
      top2: top3[1] ?? null,
      top3: top3[2] ?? null,
    };
  }

  public static async remove(gameId: string): Promise<{ gameId: string }> {
    const record = await prisma.highscore.findUnique({
      where: { gameId: gameId.trim().toLowerCase() },
    });

    if (!record) {
      throw new NotFoundError(`Game with ID "${gameId}" not found`);
    }

    await prisma.highscore.delete({
      where: { gameId: record.gameId },
    });

    return { gameId: record.gameId };
  }
}
