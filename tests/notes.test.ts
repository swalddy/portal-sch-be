import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { app } from '@/app';
import { prisma } from '@/lib/prisma';

const BASE_URL = 'http://localhost/api/v1/notes';
const createdIds: string[] = [];
const TEST_API_KEY = `test-key-${randomUUID()}`;

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

describe('Notes Module', () => {
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

    if (createdIds.length > 0) {
      await prisma.note.deleteMany({
        where: { id: { in: createdIds } },
      });
    }
  });

  it('GET /api/v1/notes should reject unauthenticated requests with 401', async () => {
    const response = await app.handle(new Request(BASE_URL));
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('POST /api/v1/notes should reject invalid payload with 422', async () => {
    const response = await app.handle(
      authedRequest(BASE_URL, 'POST', { title: '', content: 'Missing title' })
    );
    expect(response.status).toBe(422);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Validation failed');
  });

  it('POST /api/v1/notes should reject whitespace-only title with 400', async () => {
    const response = await app.handle(
      authedRequest(BASE_URL, 'POST', { title: '   ', content: 'Valid content' })
    );
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Title cannot be blank');
  });

  it('POST /api/v1/notes should create a note and return 201', async () => {
    const response = await app.handle(
      authedRequest(BASE_URL, 'POST', {
        title: 'Phase 4 Authenticated Note',
        content: 'Testing end-to-end authenticated CRUD',
        isPinned: true,
      })
    );
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.title).toBe('Phase 4 Authenticated Note');
    expect(body.data.isPinned).toBe(true);

    createdIds.push(body.data.id);
  });

  it('GET /api/v1/notes should return paginated list matching search and pinned filters', async () => {
    const response = await app.handle(
      authedRequest(`${BASE_URL}?page=1&limit=10&search=Authenticated&pinned=true`)
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.items)).toBe(true);
    expect(body.data.items.some((n: { id: string }) => n.id === createdIds[0])).toBe(true);
    expect(body.data.meta.page).toBe(1);
    expect(body.data.meta.limit).toBe(10);
    expect(body.data.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/notes/:id should reject malformed UUID with 422', async () => {
    const response = await app.handle(authedRequest(`${BASE_URL}/not-a-uuid`));
    expect(response.status).toBe(422);

    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('GET /api/v1/notes/:id should return 404 for unknown UUID', async () => {
    const response = await app.handle(
      authedRequest(`${BASE_URL}/00000000-0000-4000-8000-000000000000`)
    );
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('GET /api/v1/notes/:id should return the created note', async () => {
    const noteId = createdIds[0];
    const response = await app.handle(authedRequest(`${BASE_URL}/${noteId}`));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(noteId);
    expect(body.data.title).toBe('Phase 4 Authenticated Note');
  });

  it('PATCH /api/v1/notes/:id should reject empty update body with 400', async () => {
    const noteId = createdIds[0];
    const response = await app.handle(authedRequest(`${BASE_URL}/${noteId}`, 'PATCH', {}));
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('PATCH /api/v1/notes/:id should partially update the note', async () => {
    const noteId = createdIds[0];
    const response = await app.handle(
      authedRequest(`${BASE_URL}/${noteId}`, 'PATCH', {
        title: 'Updated Authenticated Note',
        isPinned: false,
      })
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Updated Authenticated Note');
    expect(body.data.content).toBe('Testing end-to-end authenticated CRUD');
    expect(body.data.isPinned).toBe(false);
  });

  it('DELETE /api/v1/notes/:id should delete the note and subsequent GET should return 404', async () => {
    const noteId = createdIds[0];
    const deleteRes = await app.handle(authedRequest(`${BASE_URL}/${noteId}`, 'DELETE'));
    expect(deleteRes.status).toBe(200);

    const deleteBody = await deleteRes.json();
    expect(deleteBody.success).toBe(true);
    expect(deleteBody.data.id).toBe(noteId);

    const getRes = await app.handle(authedRequest(`${BASE_URL}/${noteId}`));
    expect(getRes.status).toBe(404);
  });

  it('DELETE /api/v1/notes/:id should return 404 for unknown UUID', async () => {
    const response = await app.handle(
      authedRequest(`${BASE_URL}/00000000-0000-4000-8000-000000000000`, 'DELETE')
    );
    expect(response.status).toBe(404);
  });
});
