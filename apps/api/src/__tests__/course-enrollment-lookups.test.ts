import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDb = vi.hoisted(() => ({
  select: vi.fn()
}));

vi.mock('@db/drizzle', () => ({
  db: mockDb
}));

import { getCourseMemberIdByEmail } from '@cio/db/queries/course/people';
import { findActiveCourseInviteIdForEmail } from '@cio/db/queries/course/invite';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';
const INVITE_ID = '33333333-3333-4333-8333-333333333333';

describe('Enrollment lookup queries (R4.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCourseMemberIdByEmail', () => {
    it('returns the member id when a matching course membership exists', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: MEMBER_ID }])
      };
      mockDb.select.mockReturnValue(mockQuery);

      const result = await getCourseMemberIdByEmail(COURSE_ID, 'Student@Example.com');

      expect(result).toBe(MEMBER_ID);
    });

    it('returns null when no matching course member is found', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      };
      mockDb.select.mockReturnValue(mockQuery);

      const result = await getCourseMemberIdByEmail(COURSE_ID, 'nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('throws an error when the database query fails', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockRejectedValue(new Error('Connection failure'))
      };
      mockDb.select.mockReturnValue(mockQuery);

      await expect(getCourseMemberIdByEmail(COURSE_ID, 'student@example.com')).rejects.toThrow(
        'Failed to look up course member'
      );
    });
  });

  describe('findActiveCourseInviteIdForEmail', () => {
    it('returns the active invite id when matching email is found', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: INVITE_ID }])
      };
      mockDb.select.mockReturnValue(mockQuery);

      const result = await findActiveCourseInviteIdForEmail(COURSE_ID, 'Invited@Example.com');

      expect(result).toBe(INVITE_ID);
    });

    it('returns null when no active invite exists for the email', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([])
      };
      mockDb.select.mockReturnValue(mockQuery);

      const result = await findActiveCourseInviteIdForEmail(COURSE_ID, 'noinvite@example.com');

      expect(result).toBeNull();
    });

    it('throws an error when the database query fails', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockRejectedValue(new Error('Connection failure'))
      };
      mockDb.select.mockReturnValue(mockQuery);

      await expect(findActiveCourseInviteIdForEmail(COURSE_ID, 'invited@example.com')).rejects.toThrow(
        'Failed to look up course invite'
      );
    });
  });
});
