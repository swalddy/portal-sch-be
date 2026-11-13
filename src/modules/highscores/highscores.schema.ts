import { t, type Static } from 'elysia';

export const gameIdParamSchema = t.Object({
  gameId: t.String({
    minLength: 1,
    maxLength: 100,
    error: 'gameId must be between 1 and 100 characters',
  }),
});

export const listHighscoresQuerySchema = t.Object({
  search: t.Optional(t.String({ maxLength: 100 })),
});

export const createHighscoreBodySchema = t.Object({
  gameId: t.String({
    minLength: 1,
    maxLength: 100,
    error: 'gameId is required (e.g. "snake", "tetris", "flappy-bird")',
  }),
  gameName: t.String({
    minLength: 1,
    maxLength: 100,
    error: 'gameName is required (e.g. "Snake Classic", "Flappy Bird")',
  }),
  top1Name: t.Optional(t.Nullable(t.String({ maxLength: 100 }))),
  top1Score: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
  top2Name: t.Optional(t.Nullable(t.String({ maxLength: 100 }))),
  top2Score: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
  top3Name: t.Optional(t.Nullable(t.String({ maxLength: 100 }))),
  top3Score: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
});

export const submitScoreBodySchema = t.Object({
  name: t.String({
    minLength: 1,
    maxLength: 100,
    error: 'name is required (e.g. player name)',
  }),
  score: t.Integer({
    minimum: 0,
    error: 'score must be a non-negative integer',
  }),
  gameName: t.Optional(t.String({ maxLength: 100 })),
});

export type GameIdParam = Static<typeof gameIdParamSchema>;
export type ListHighscoresQuery = Static<typeof listHighscoresQuerySchema>;
export type CreateHighscoreInput = Static<typeof createHighscoreBodySchema>;
export type SubmitScoreInput = Static<typeof submitScoreBodySchema>;

