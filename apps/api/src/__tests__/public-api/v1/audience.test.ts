import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from '@api/utils/hono';
import { audienceRouter } from '@api/routes/public-api/v1/audience';
import * as organizationQueries from '@cio/db/queries/organization';
import { mockStudent, mockStudents, mockOrgId, mockRawApiKey, createMockStudent } from '../test-fixtures';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';

// Mock database queries
vi.mock('@cio/db/queries/organization');

// Mock public API key middleware
vi.mock('@api/middlewares/public-api-key', () => ({
  publicApiKeyMiddleware: vi.fn(async (c, next) => {
    c.set('orgId', mockOrgId);
    c.set('createdByProfileId', 'user-test-123');
    await next();
  })
}));

describe('V1 Audience API Routes', () => {
  let app: InstanceType<typeof Hono>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono().route('/', audienceRouter);
  });

  describe('GET /v1/audience - List Students', () => {
    it('should list students with default pagination', async () => {
      vi.mocked(organizationQueries.getOrganizationAudience).mockResolvedValue(mockStudents as any);

      const response = await app.request('/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1
      });
      expect(data.data[0].email).toBe(mockStudent.email);
      expect(data.data[0].fullname).toBe(mockStudent.name);
    });

    it('should handle custom pagination', async () => {
      const manyStudents = Array.from({ length: 30 }, (_, i) =>
        createMockStudent({
          id: `student-${i}`,
          email: `student${i}@example.com`,
          name: `Student ${i}`
        })
      );

      vi.mocked(organizationQueries.getOrganizationAudience).mockResolvedValue(manyStudents as any);

      const response = await app.request('/?page=2&limit=10', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(10);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.totalPages).toBe(3);
    });

    it('should return empty array for organization with no students', async () => {
      vi.mocked(organizationQueries.getOrganizationAudience).mockResolvedValue([]);

      const response = await app.request('/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await app.request('/?page=0&limit=200', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(400);
    });

    it('should handle service errors gracefully', async () => {
      vi.mocked(organizationQueries.getOrganizationAudience).mockRejectedValue(new Error('Database connection error'));

      const response = await app.request('/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('POST /v1/audience - Add Student', () => {
    it('should add student with valid data', async () => {
      const newMember = { id: 'member-123', profileId: mockStudent.id, roleId: ROLE.STUDENT };
      vi.mocked(organizationQueries.createOrganizationMember).mockResolvedValue(newMember as any);

      const response = await app.request('/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'newstudent@example.com',
          fullname: 'New Student'
        })
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.email).toBe('newstudent@example.com');
      expect(data.data.fullname).toBe('New Student');
    });

    it('should return 400 when email is missing', async () => {
      const response = await app.request('/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullname: 'Student without email'
        })
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await app.request('/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'invalid-email',
          fullname: 'Test Student'
        })
      });

      expect(response.status).toBe(400);
    });

    it('should accept request when fullname is missing (optional field)', async () => {
      const newMember = { id: 'member-456', profileId: 'student-456', roleId: 3 };
      vi.mocked(organizationQueries.createOrganizationMember).mockResolvedValue(newMember as any);

      const response = await app.request('/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com'
        })
      });

      // fullname is optional, so this should succeed
      expect(response.status).toBe(201);
    });
  });

  describe('GET /v1/audience/:studentId - Get Student', () => {
    it('should get student by ID', async () => {
      vi.mocked(organizationQueries.getOrganizationAudience).mockResolvedValue(mockStudents as any);

      const response = await app.request(`/${mockStudent.id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(mockStudent.id);
      expect(data.data.email).toBe(mockStudent.email);
      expect(data.data.fullname).toBe(mockStudent.name);
    });

    it('should return 404 when student not found', async () => {
      vi.mocked(organizationQueries.getOrganizationAudience).mockResolvedValue(mockStudents as any);

      // Use a valid UUID that doesn't exist in mockStudents
      const nonExistentId = '99eebc99-9c0b-4ef8-bb6d-6bb9bd380a99';
      const response = await app.request(`/${nonExistentId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await app.request('/invalid-uuid', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(400);
    });

    it('should return 404 when student belongs to different organization', async () => {
      // Mock returning empty audience (student not in this org)
      vi.mocked(organizationQueries.getOrganizationAudience).mockResolvedValue([]);

      const response = await app.request(`/${mockStudent.id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /v1/audience/:studentId - Update Student', () => {
    it('should update student with valid data', async () => {
      vi.mocked(organizationQueries.getOrganizationAudience).mockResolvedValue(mockStudents as any);

      const response = await app.request(`/${mockStudent.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'updated@example.com',
          fullname: 'Updated Name'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.email).toBe('updated@example.com');
      expect(data.data.fullname).toBe('Updated Name');
    });

    it('should return 404 when student not found', async () => {
      vi.mocked(organizationQueries.getOrganizationAudience).mockResolvedValue([]);

      const response = await app.request(`/${mockStudent.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullname: 'Updated'
        })
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await app.request('/invalid-uuid', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullname: 'Test'
        })
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      vi.mocked(organizationQueries.getOrganizationAudience).mockResolvedValue(mockStudents as any);

      const response = await app.request(`/${mockStudent.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'invalid-email'
        })
      });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /v1/audience/:studentId - Remove Student', () => {
    it('should remove student successfully', async () => {
      vi.mocked(organizationQueries.getOrganizationAudience).mockResolvedValue(mockStudents as any);
      vi.mocked(organizationQueries.deleteOrganizationMember).mockResolvedValue(undefined as any);

      const response = await app.request(`/${mockStudent.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
    });

    it('should return 404 when student not found', async () => {
      vi.mocked(organizationQueries.getOrganizationAudience).mockResolvedValue([]);

      const response = await app.request(`/${mockStudent.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await app.request('/invalid-uuid', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(400);
    });
  });
});
