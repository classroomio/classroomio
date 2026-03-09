import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from '@api/utils/hono';
import { coursesRouter } from '@api/routes/public-api/v1/courses';
import * as courseService from '@api/services/course/course';
import * as organizationService from '@api/services/organization';
import * as peopleService from '@api/services/course/people';
import {
  mockCourse,
  mockCourses,
  mockOrgId,
  mockRawApiKey,
  mockCourseMember,
  createMockCourse
} from '../test-fixtures';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';

// Mock services
vi.mock('@api/services/course/course');
vi.mock('@api/services/organization');
vi.mock('@api/services/course/people');

// Mock public API key middleware
vi.mock('@api/middlewares/public-api-key', () => ({
  publicApiKeyMiddleware: vi.fn(async (c, next) => {
    c.set('orgId', mockOrgId);
    c.set('createdByProfileId', 'user-test-123');
    await next();
  })
}));

describe('V1 Courses API Routes', () => {
  let app: InstanceType<typeof Hono>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono().route('/', coursesRouter);
  });

  describe('GET /v1/courses - List Courses', () => {
    it('should list courses with default pagination', async () => {
      vi.mocked(organizationService.getCoursesByOrgId).mockResolvedValue(mockCourses as any);

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
      expect(data.data[0].title).toBe('Test Course');
    });

    it('should handle custom pagination', async () => {
      const manyCourses = Array.from({ length: 25 }, (_, i) =>
        createMockCourse({
          id: `course-${i}`,
          title: `Course ${i}`
        })
      );

      vi.mocked(organizationService.getCoursesByOrgId).mockResolvedValue(manyCourses as any);

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
      expect(data.pagination.totalPages).toBe(3);
    });

    it('should return empty array for organization with no courses', async () => {
      vi.mocked(organizationService.getCoursesByOrgId).mockResolvedValue([]);

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

    it('should handle service errors gracefully', async () => {
      vi.mocked(organizationService.getCoursesByOrgId).mockRejectedValue(new Error('Database error'));

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

  describe('POST /v1/courses - Create Course', () => {
    it('should create course with valid data', async () => {
      const newCourse = {
        course: mockCourse,
        member: { id: 'member-123' }
      };

      vi.mocked(courseService.createCourse).mockResolvedValue(newCourse as any);

      const response = await app.request('/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'New Course',
          slug: 'new-course',
          description: 'Course description',
          courseType: 'SELF_PACED'
        })
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(mockCourse.title);
      expect(courseService.createCourse).toHaveBeenCalledWith('user-test-123', {
        title: 'New Course',
        description: 'Course description',
        type: 'SELF_PACED',
        organizationId: mockOrgId
      });
    });

    it('should create course with minimal data', async () => {
      const newCourse = {
        course: mockCourse,
        member: { id: 'member-123' }
      };

      vi.mocked(courseService.createCourse).mockResolvedValue(newCourse as any);

      const response = await app.request('/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Minimal Course',
          slug: 'minimal-course'
        })
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return 400 when title is missing', async () => {
      const response = await app.request('/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: 'Description only'
        })
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid courseType', async () => {
      const response = await app.request('/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Test',
          courseType: 'INVALID_TYPE'
        })
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /v1/courses/:courseId - Get Course', () => {
    it('should get course by ID', async () => {
      vi.mocked(organizationService.getCoursesByOrgId).mockResolvedValue(mockCourses as any);

      const response = await app.request(`/${mockCourse.id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(mockCourse.id);
      expect(data.data.title).toBe(mockCourse.title);
    });

    it('should return 404 when course not found', async () => {
      vi.mocked(organizationService.getCoursesByOrgId).mockResolvedValue(mockCourses as any);

      // Use a valid UUID that doesn't exist in mockCourses
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
  });

  describe('PUT /v1/courses/:courseId - Update Course', () => {
    it('should update course with valid data', async () => {
      vi.mocked(organizationService.getCoursesByOrgId).mockResolvedValue(mockCourses as any);
      const updatedCourse = { ...mockCourse, title: 'Updated Title', updatedAt: new Date() };
      vi.mocked(courseService.updateCourse).mockResolvedValue(updatedCourse as any);

      const response = await app.request(`/${mockCourse.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Updated Title'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Updated Title');
    });

    it('should return 404 when course not found', async () => {
      vi.mocked(organizationService.getCoursesByOrgId).mockResolvedValue([]);

      const response = await app.request(`/${mockCourse.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Updated'
        })
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /v1/courses/:courseId - Delete Course', () => {
    it('should delete course successfully', async () => {
      vi.mocked(organizationService.getCoursesByOrgId).mockResolvedValue(mockCourses as any);
      vi.mocked(courseService.deleteCourse).mockResolvedValue(undefined as any);

      const response = await app.request(`/${mockCourse.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Course deleted successfully');
    });

    it('should return 404 when course not found', async () => {
      vi.mocked(organizationService.getCoursesByOrgId).mockResolvedValue([]);

      const response = await app.request(`/${mockCourse.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /v1/courses/:courseId/export - Export Course', () => {
    it('should export course with full content', async () => {
      vi.mocked(organizationService.getCoursesByOrgId).mockResolvedValue(mockCourses as any);
      vi.mocked(courseService.getCourse).mockResolvedValue(mockCourse as any);

      const response = await app.request(`/${mockCourse.id}/export`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(mockCourse.id);
      expect(data.data.content).toBeDefined();
    });

    it('should return 404 when course not found', async () => {
      vi.mocked(organizationService.getCoursesByOrgId).mockResolvedValue([]);

      const response = await app.request(`/${mockCourse.id}/export`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /v1/courses/:courseId/students - List Course Students', () => {
    it('should list course students', async () => {
      vi.mocked(organizationService.getCoursesByOrgId).mockResolvedValue(mockCourses as any);
      vi.mocked(peopleService.listCourseMembers).mockResolvedValue([mockCourseMember] as any);

      const response = await app.request(`/${mockCourse.id}/students`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockRawApiKey}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].email).toBe(mockCourseMember.profile.email);
      expect(data.pagination).toBeDefined();
    });

    it('should return empty array when no students enrolled', async () => {
      vi.mocked(organizationService.getCoursesByOrgId).mockResolvedValue(mockCourses as any);
      vi.mocked(peopleService.listCourseMembers).mockResolvedValue([]);

      const response = await app.request(`/${mockCourse.id}/students`, {
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
  });
});
