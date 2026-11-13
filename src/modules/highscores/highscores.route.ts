import { Elysia } from 'elysia';
import { requireAuth } from '../../middlewares/auth.middleware';
import { OPENAPI_SECURITY } from '../../plugins/swagger.plugin';
import { HighscoresController } from './highscores.controller';
import {
  createHighscoreBodySchema,
  gameIdParamSchema,
  listHighscoresQuerySchema,
  submitScoreBodySchema,
} from './highscores.schema';

export const highscoresRoutes = new Elysia({ prefix: '/highscores' })
  .get('/', ({ query }) => HighscoresController.list(query), {
    query: listHighscoresQuerySchema,
    detail: {
      tags: ['Highscores'],
      summary: 'List all game highscores',
      description: 'Public endpoint to retrieve all games and their current Top 3 leaderboards.',
    },
  })
  .get('/:gameId', ({ params }) => HighscoresController.getByGameId(params.gameId), {
    params: gameIdParamSchema,
    detail: {
      tags: ['Highscores'],
      summary: 'Get Top 3 for a game',
      description: 'Public endpoint to retrieve the current Top 3 leaderboard for a specific game.',
    },
  })
  .use(requireAuth)
  .post('/', ({ body, set }) => HighscoresController.create(body, set), {
    body: createHighscoreBodySchema,
    detail: {
      tags: ['Highscores'],
      summary: 'Create or register a game highscore slot',
      description: 'Registers a new game with its gameId, gameName, and optional initial Top 1-3.',
      security: OPENAPI_SECURITY,
    },
  })
  .put('/:gameId', ({ params, body }) => HighscoresController.submitScore(params.gameId, body), {
    params: gameIdParamSchema,
    body: submitScoreBodySchema,
    detail: {
      tags: ['Highscores'],
      summary: 'Submit new score and auto-update Top 3',
      description:
        'Submits a new score. Automatically shifts Top 1-3 rankings if the score qualifies, or preserves current leaderboard if not.',
      security: OPENAPI_SECURITY,
    },
  })
  .delete('/:gameId', ({ params }) => HighscoresController.remove(params.gameId), {
    params: gameIdParamSchema,
    detail: {
      tags: ['Highscores'],
      summary: 'Delete a game highscore',
      description: 'Deletes a game highscore by its gameId.',
      security: OPENAPI_SECURITY,
    },
  });

