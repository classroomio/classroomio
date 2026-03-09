/**
 * Test fixtures for public API tests
 * Provides reusable mock data for testing API key management, courses, and audience endpoints
 */

export const mockUser = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  email: 'admin@example.com',
  fullname: 'Test Admin',
  username: 'testadmin'
};

export const mockOrgId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';

export const mockApiKey = {
  id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
  organizationId: mockOrgId,
  keyHash: 'a'.repeat(64), // SHA-256 produces 64 hex chars
  keyPrefix: 'cio_live_abc',
  name: 'Test API Key',
  lastUsedAt: null,
  expiresAt: null,
  isRevoked: false,
  createdAt: new Date('2026-03-01T00:00:00Z'),
  createdByProfileId: mockUser.id
};

export const mockRawApiKey = 'cio_live_abcdefghijklmnopqrstuvwxyz1234567890';

export const mockCourse = {
  id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  title: 'Test Course',
  slug: 'test-course',
  description: 'A comprehensive test course',
  type: 'SELF_PACED' as const,
  isPublished: true,
  organizationId: mockOrgId,
  createdAt: new Date('2026-03-01T00:00:00Z'),
  updatedAt: new Date('2026-03-01T00:00:00Z'),
  overview: 'Course overview',
  content: { lessons: [], exercises: [] },
  metadata: {}
};

export const mockCourses = [
  mockCourse,
  {
    id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    title: 'Advanced Course',
    slug: 'advanced-course',
    description: 'Advanced topics',
    type: 'COHORT' as const,
    isPublished: false,
    organizationId: mockOrgId,
    createdAt: new Date('2026-03-02T00:00:00Z'),
    updatedAt: new Date('2026-03-02T00:00:00Z')
  }
];

export const mockStudent = {
  id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
  email: 'student@example.com',
  name: 'Test Student',
  fullname: 'Test Student',
  avatarUrl: 'https://example.com/avatar.jpg',
  username: 'teststudent',
  createdAt: new Date('2026-03-01T00:00:00Z')
};

export const mockStudents = [
  mockStudent,
  {
    id: 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
    email: 'student2@example.com',
    name: 'Another Student',
    fullname: 'Another Student',
    avatarUrl: null,
    username: 'student2',
    createdAt: new Date('2026-03-02T00:00:00Z')
  }
];

export const mockCourseMember = {
  id: 'member-test-123',
  roleId: 3, // ROLE.STUDENT (correct value)
  createdAt: new Date('2026-03-01T00:00:00Z'),
  profile: {
    email: mockStudent.email,
    fullname: mockStudent.fullname,
    username: mockStudent.username
  }
};

/**
 * Helper to create mock API key with custom properties
 */
export function createMockApiKey(overrides: Partial<typeof mockApiKey> = {}) {
  return { ...mockApiKey, ...overrides };
}

/**
 * Helper to create mock course with custom properties
 */
export function createMockCourse(overrides: Partial<typeof mockCourse> = {}) {
  return { ...mockCourse, ...overrides };
}

/**
 * Helper to create mock student with custom properties
 */
export function createMockStudent(overrides: Partial<typeof mockStudent> = {}) {
  return { ...mockStudent, ...overrides };
}
