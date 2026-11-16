import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const uniqueSuffix = randomUUID().slice(0, 8);
const user1Email = `user1_${uniqueSuffix}@example.com`;
const user2Email = `user2_${uniqueSuffix}@example.com`;
const userPassword = 'Password123!';

let user1Token = '';
let user2Token = '';
let user1Id = '';
let user2Id = '';
let workspaceId = '';
let inviteCode = '';
let documentId = '';
let nestedDocId = '';
let taskId = '';

function bearerRequest(url: string, token: string, method = 'GET', body?: unknown): Request {
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

describe('Notion-like Team Workspace & Project Management API', () => {
  afterAll(async () => {
    try {
      if (workspaceId) {
        await prisma.workspace.deleteMany({ where: { id: workspaceId } });
      }
      if (user1Id || user2Id) {
        await prisma.user.deleteMany({
          where: { id: { in: [user1Id, user2Id].filter(Boolean) } },
        });
      }
    } catch {
      // Ignore cleanup error
    }
  });

  describe('Auth Module', () => {
    it('POST /api/v1/auth/register should register user 1 with bcrypt hash', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Alice Developer',
            email: user1Email,
            password: userPassword,
          }),
        })
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe(user1Email);
      expect(body.data.token).toBeDefined();

      user1Id = body.data.user.id;
      user1Token = body.data.token;
    });

    it('POST /api/v1/auth/register should register user 2', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Bob Designer',
            email: user2Email,
            password: userPassword,
          }),
        })
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      user2Id = body.data.user.id;
      user2Token = body.data.token;
    });

    it('POST /api/v1/auth/register should reject duplicate email with 409', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Alice Duplicate',
            email: user1Email,
            password: userPassword,
          }),
        })
      );

      expect(res.status).toBe(409);
    });

    it('POST /api/v1/auth/login should reject incorrect password with 401', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user1Email,
            password: 'WrongPassword!',
          }),
        })
      );

      expect(res.status).toBe(401);
    });

    it('POST /api/v1/auth/login should authenticate and return JWT token', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user1Email,
            password: userPassword,
          }),
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.token).toBeDefined();
    });

    it('GET /api/v1/auth/me should return user profile with Bearer JWT', async () => {
      const res = await app.handle(
        bearerRequest('http://localhost/api/v1/auth/me', user1Token)
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(user1Id);
      expect(body.data.email).toBe(user1Email);
      expect(body.data.username).toBe('Alice Developer');
    });
  });

  describe('Workspaces Module & verifyWorkspaceAccess', () => {
    it('POST /api/v1/workspaces should create a workspace and set user 1 as owner', async () => {
      const res = await app.handle(
        bearerRequest('http://localhost/api/v1/workspaces', user1Token, 'POST', {
          name: 'Notion Engineering Team',
          icon: '🚀',
        })
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBeDefined();
      expect(body.data.name).toBe('Notion Engineering Team');
      expect(body.data.myRole).toBe('owner');

      workspaceId = body.data.id;
    });

    it('GET /api/v1/workspaces should list user 1 workspace', async () => {
      const res = await app.handle(
        bearerRequest('http://localhost/api/v1/workspaces', user1Token)
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.some((w: { id: string }) => w.id === workspaceId)).toBe(true);
    });

    it('verifyWorkspaceAccess: user 2 should be rejected from accessing user 1 workspace with 403', async () => {
      const res = await app.handle(
        bearerRequest(
          `http://localhost/api/v1/workspaces/${workspaceId}`,
          user2Token
        )
      );

      expect(res.status).toBe(403);
    });

    it('POST /api/v1/workspaces/:id/invites should create an invite code', async () => {
      const res = await app.handle(
        bearerRequest(
          `http://localhost/api/v1/workspaces/${workspaceId}/invites`,
          user1Token,
          'POST',
          {
            email: user2Email,
            role: 'member',
          }
        )
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.inviteCode).toBeDefined();
      expect(body.data.status).toBe('pending');

      inviteCode = body.data.inviteCode;
    });

    it('POST /api/v1/invites/accept should allow user 2 to join workspace using invite code', async () => {
      const res = await app.handle(
        bearerRequest('http://localhost/api/v1/invites/accept', user2Token, 'POST', {
          inviteCode,
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.member.userId).toBe(user2Id);
      expect(body.data.member.role).toBe('member');
    });

    it('GET /api/v1/workspaces/:id/members should now list both members', async () => {
      const res = await app.handle(
        bearerRequest(`http://localhost/api/v1/workspaces/${workspaceId}/members`, user2Token)
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(2);
      expect(body.data.some((m: { userId: string; role: string }) => m.userId === user1Id && m.role === 'owner')).toBe(true);
      expect(body.data.some((m: { userId: string; role: string }) => m.userId === user2Id && m.role === 'member')).toBe(true);
    });
  });

  describe('Documents Module', () => {
    it('POST /api/v1/workspaces/:id/documents should create a root document', async () => {
      const res = await app.handle(
        bearerRequest(
          `http://localhost/api/v1/workspaces/${workspaceId}/documents`,
          user1Token,
          'POST',
          {
            title: 'Product Roadmap 2026',
            icon: '🗺️',
            content: '# Product Roadmap\n\n- Feature A\n- Feature B',
          }
        )
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBeDefined();
      expect(body.data.title).toBe('Product Roadmap 2026');
      expect(body.data.content).toContain('Feature A');

      documentId = body.data.id;
    });

    it('POST /api/v1/workspaces/:id/documents should create a nested child document page', async () => {
      const res = await app.handle(
        bearerRequest(
          `http://localhost/api/v1/workspaces/${workspaceId}/documents`,
          user2Token,
          'POST',
          {
            title: 'Sprint 1 Specs',
            icon: '📝',
            content: 'Detailed specifications for sprint 1.',
            parentId: documentId,
          }
        )
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.parentId).toBe(documentId);

      nestedDocId = body.data.id;
    });

    it('GET /api/v1/workspaces/:id/documents should list workspace documents', async () => {
      const res = await app.handle(
        bearerRequest(`http://localhost/api/v1/workspaces/${workspaceId}/documents`, user2Token)
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.length).toBe(2);
    });

    it('PUT /api/v1/documents/:id should update markdown content and title', async () => {
      const res = await app.handle(
        bearerRequest(
          `http://localhost/api/v1/documents/${documentId}`,
          user1Token,
          'PUT',
          {
            title: 'Updated Product Roadmap 2026',
            content: '# Updated Roadmap with Q1/Q2 milestones',
          }
        )
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.title).toBe('Updated Product Roadmap 2026');
      expect(body.data.content).toContain('Q1/Q2 milestones');
    });

    it('DELETE /api/v1/documents/:id should delete nested document', async () => {
      const res = await app.handle(
        bearerRequest(`http://localhost/api/v1/documents/${nestedDocId}`, user1Token, 'DELETE')
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });

  describe('Kanban Tasks Module', () => {
    it('POST /api/v1/workspaces/:id/tasks should create a kanban task', async () => {
      const res = await app.handle(
        bearerRequest(
          `http://localhost/api/v1/workspaces/${workspaceId}/tasks`,
          user1Token,
          'POST',
          {
            title: 'Design Dark Mode UI',
            description: 'Create Figma designs for high-contrast dark theme',
            status: 'todo',
            priority: 'high',
            assigneeId: user2Id,
            dueDate: new Date(Date.now() + 86400000).toISOString(),
          }
        )
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBeDefined();
      expect(body.data.title).toBe('Design Dark Mode UI');
      expect(body.data.status).toBe('todo');
      expect(body.data.priority).toBe('high');
      expect(body.data.assignee.id).toBe(user2Id);

      taskId = body.data.id;
    });

    it('GET /api/v1/workspaces/:id/tasks should list tasks with status filter', async () => {
      const res = await app.handle(
        bearerRequest(
          `http://localhost/api/v1/workspaces/${workspaceId}/tasks?status=todo`,
          user2Token
        )
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.some((t: { id: string }) => t.id === taskId)).toBe(true);
    });

    it('PUT /api/v1/tasks/:id should update status for kanban drag-and-drop to in_progress', async () => {
      const res = await app.handle(
        bearerRequest(
          `http://localhost/api/v1/tasks/${taskId}`,
          user2Token,
          'PUT',
          {
            status: 'in_progress',
          }
        )
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('in_progress');
    });

    it('PUT /api/v1/tasks/:id should update status to done', async () => {
      const res = await app.handle(
        bearerRequest(
          `http://localhost/api/v1/tasks/${taskId}`,
          user1Token,
          'PUT',
          {
            status: 'done',
          }
        )
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.status).toBe('done');
    });

    it('DELETE /api/v1/tasks/:id should delete task', async () => {
      const res = await app.handle(
        bearerRequest(`http://localhost/api/v1/tasks/${taskId}`, user1Token, 'DELETE')
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);

      const checkRes = await app.handle(
        bearerRequest(`http://localhost/api/v1/tasks/${taskId}`, user1Token)
      );
      expect(checkRes.status).toBe(404);
    });
  });
});
