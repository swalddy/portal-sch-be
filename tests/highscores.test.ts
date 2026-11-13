import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const BASE_URL = 'http://localhost/api/v1/highscores';
const TEST_API_KEY = `test-key-${randomUUID()}`;
const TEST_GAME_ID = `test-game-${randomUUID().slice(0, 8)}`;

function authedRequest(url: string, method = 'GET', body?: unknown): Request {
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': TEST_API_KEY,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

describe('Highscores Module', () => {
  const previousApiKey = process.env.API_KEY;

  beforeAll(() => {
    process.env.API_KEY = TEST_API_KEY;
  });

  afterAll(async () => {
    if (previousApiKey === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = previousApiKey;
    }

    // Clean up test game if left
    try {
      await prisma.highscore.deleteMany({
        where: { gameId: { startsWith: 'test-game-' } },
      });
    } catch {
      // Ignore cleanup error if already deleted
    }
  });

  it('GET /api/v1/highscores should be publicly accessible without auth', async () => {
    const response = await app.handle(new Request(BASE_URL));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('POST /api/v1/highscores should reject unauthenticated requests with 401', async () => {
    const response = await app.handle(
      new Request(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: TEST_GAME_ID, gameName: 'Test Game' }),
      })
    );
    expect(response.status).toBe(401);
  });

  it('POST /api/v1/highscores should create a new game highscore and return 201', async () => {
    const response = await app.handle(
      authedRequest(BASE_URL, 'POST', {
        gameId: TEST_GAME_ID,
        gameName: 'Super Flappy Test',
      })
    );
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.gameId).toBe(TEST_GAME_ID);
    expect(body.data.gameName).toBe('Super Flappy Test');
    expect(body.data.top1).toBeNull();
    expect(body.data.top2).toBeNull();
    expect(body.data.top3).toBeNull();
  });

  it('POST /api/v1/highscores should reject duplicate gameId with 409', async () => {
    const response = await app.handle(
      authedRequest(BASE_URL, 'POST', {
        gameId: TEST_GAME_ID,
        gameName: 'Duplicate Game',
      })
    );
    expect(response.status).toBe(409);
  });

  it('GET /api/v1/highscores/:gameId should return the created game publicly', async () => {
    const response = await app.handle(new Request(`${BASE_URL}/${TEST_GAME_ID}`));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.gameId).toBe(TEST_GAME_ID);
    expect(body.data.gameName).toBe('Super Flappy Test');
  });

  it('PUT /api/v1/highscores/:gameId should reject unauthenticated requests with 401', async () => {
    const response = await app.handle(
      new Request(`${BASE_URL}/${TEST_GAME_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alice', score: 100 }),
      })
    );
    expect(response.status).toBe(401);
  });

  it('PUT /api/v1/highscores/:gameId should rank first player as Top 1', async () => {
    const response = await app.handle(
      authedRequest(`${BASE_URL}/${TEST_GAME_ID}`, 'PUT', {
        name: 'Alice',
        score: 100,
      })
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.isTop3).toBe(true);
    expect(body.data.rank).toBe(1);
    expect(body.data.top1).toEqual({ name: 'Alice', score: 100 });
    expect(body.data.top2).toBeNull();
    expect(body.data.top3).toBeNull();
  });

  it('PUT /api/v1/highscores/:gameId: higher score should take Top 1 and shift Alice to Top 2', async () => {
    const response = await app.handle(
      authedRequest(`${BASE_URL}/${TEST_GAME_ID}`, 'PUT', {
        name: 'Bob',
        score: 200,
      })
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.isTop3).toBe(true);
    expect(body.data.rank).toBe(1);
    expect(body.data.top1).toEqual({ name: 'Bob', score: 200 });
    expect(body.data.top2).toEqual({ name: 'Alice', score: 100 });
    expect(body.data.top3).toBeNull();
  });

  it('PUT /api/v1/highscores/:gameId: middle score should take Top 2 and shift Alice to Top 3', async () => {
    const response = await app.handle(
      authedRequest(`${BASE_URL}/${TEST_GAME_ID}`, 'PUT', {
        name: 'Charlie',
        score: 150,
      })
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.isTop3).toBe(true);
    expect(body.data.rank).toBe(2);
    expect(body.data.top1).toEqual({ name: 'Bob', score: 200 });
    expect(body.data.top2).toEqual({ name: 'Charlie', score: 150 });
    expect(body.data.top3).toEqual({ name: 'Alice', score: 100 });
  });

  it('PUT /api/v1/highscores/:gameId: new highest score should take Top 1 and drop Alice off Top 3', async () => {
    const response = await app.handle(
      authedRequest(`${BASE_URL}/${TEST_GAME_ID}`, 'PUT', {
        name: 'Dave',
        score: 300,
      })
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.isTop3).toBe(true);
    expect(body.data.rank).toBe(1);
    expect(body.data.top1).toEqual({ name: 'Dave', score: 300 });
    expect(body.data.top2).toEqual({ name: 'Bob', score: 200 });
    expect(body.data.top3).toEqual({ name: 'Charlie', score: 150 });
  });

  it('PUT /api/v1/highscores/:gameId: score lower than Top 3 should not qualify', async () => {
    const response = await app.handle(
      authedRequest(`${BASE_URL}/${TEST_GAME_ID}`, 'PUT', {
        name: 'Eve',
        score: 50,
      })
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.isTop3).toBe(false);
    expect(body.data.rank).toBeNull();
    // Leaderboard remains intact
    expect(body.data.top1).toEqual({ name: 'Dave', score: 300 });
    expect(body.data.top2).toEqual({ name: 'Bob', score: 200 });
    expect(body.data.top3).toEqual({ name: 'Charlie', score: 150 });
  });

  it('DELETE /api/v1/highscores/:gameId should delete the game and return 200', async () => {
    const deleteRes = await app.handle(authedRequest(`${BASE_URL}/${TEST_GAME_ID}`, 'DELETE'));
    expect(deleteRes.status).toBe(200);

    const getRes = await app.handle(new Request(`${BASE_URL}/${TEST_GAME_ID}`));
    expect(getRes.status).toBe(404);
  });
});
