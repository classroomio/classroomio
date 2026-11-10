import nock from 'nock';
import { createAppTester } from 'zapier-platform-core';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import App from '../src/index';

const API_ORIGIN = 'https://api.example.test';
const appTester = createAppTester(App);

beforeAll(() => {
  process.env.CIO_API_ORIGIN = API_ORIGIN;
  process.env.CIO_APP_ORIGIN = 'https://app.example.test';
});

afterEach(() => nock.cleanAll());

describe('creates and actions', () => {
  describe('enroll_student', () => {
    it('enrolls student successfully', async () => {
      const scope = nock(API_ORIGIN)
        .post('/public-api/v1/courses/course-1/enrollments', {
          email: 'student@example.com',
          sendEmail: true
        })
        .reply(200, {
          success: true,
          data: {
            status: 'enrolled',
            memberId: 'member-1',
            inviteId: null,
            email: 'student@example.com'
          }
        });

      const perform = (App.creates.enroll_student.operation as any).perform;
      const result = await appTester(perform, {
        inputData: { courseId: 'course-1', email: 'student@example.com', sendEmail: true }
      });

      expect(result).toEqual({
        status: 'enrolled',
        memberId: 'member-1',
        inviteId: null,
        email: 'student@example.com'
      });
      expect(scope.isDone()).toBe(true);
    });

    it('retries once on 409 CONFLICT', async () => {
      const scope = nock(API_ORIGIN)
        .post('/public-api/v1/courses/course-1/enrollments', {
          email: 'student@example.com',
          sendEmail: true
        })
        .reply(409, { code: 'CONFLICT' })
        .post('/public-api/v1/courses/course-1/enrollments', {
          email: 'student@example.com',
          sendEmail: true
        })
        .reply(200, {
          success: true,
          data: {
            status: 'already_enrolled',
            memberId: 'member-1',
            inviteId: null,
            email: 'student@example.com'
          }
        });

      const perform = (App.creates.enroll_student.operation as any).perform;
      const result = await appTester(perform, {
        inputData: { courseId: 'course-1', email: 'student@example.com', sendEmail: true }
      });

      expect(result).toEqual({
        status: 'already_enrolled',
        memberId: 'member-1',
        inviteId: null,
        email: 'student@example.com'
      });
      expect(scope.isDone()).toBe(true);
    });

    it('uses the shared error handler for a validation failure', async () => {
      nock(API_ORIGIN)
        .post('/public-api/v1/courses/course-1/enrollments')
        .reply(400, { success: false, error: 'Invalid email address', code: 'VALIDATION_ERROR', field: 'email' });

      const perform = (App.creates.enroll_student.operation as any).perform;
      await expect(
        appTester(perform, {
          inputData: { courseId: 'course-1', email: 'student@example.com', sendEmail: true }
        })
      ).rejects.toThrow('email: Invalid email address');
    });
  });

  describe('update_student', () => {
    it('sends name for joined members (with profileId)', async () => {
      nock(API_ORIGIN)
        .get('/public-api/v1/audience')
        .query({ email: 'joined@example.com' })
        .reply(200, {
          data: [{ id: 101, profileId: 'prof-1', name: 'Old Name', email: 'joined@example.com' }]
        });

      const updateScope = nock(API_ORIGIN)
        .put('/public-api/v1/audience/101', { name: 'New Name' })
        .reply(200, {
          data: { id: 101, name: 'New Name', email: 'joined@example.com' }
        });

      const perform = (App.creates.update_student.operation as any).perform;
      const result = await appTester(perform, {
        inputData: { email: 'joined@example.com', name: 'New Name' }
      });

      expect(result).toEqual({ id: 101, name: 'New Name', email: 'joined@example.com' });
      expect(updateScope.isDone()).toBe(true);
    });

    it('sends email for pending invites (without profileId)', async () => {
      nock(API_ORIGIN)
        .get('/public-api/v1/audience')
        .query({ email: 'pending@example.com' })
        .reply(200, {
          data: [{ id: 102, profileId: null, name: '', email: 'pending@example.com' }]
        });

      const updateScope = nock(API_ORIGIN)
        .put('/public-api/v1/audience/102', { email: 'updated@example.com' })
        .reply(200, {
          data: { id: 102, email: 'updated@example.com' }
        });

      const perform = (App.creates.update_student.operation as any).perform;
      const result = await appTester(perform, {
        inputData: { email: 'pending@example.com', newEmail: 'updated@example.com' }
      });

      expect(result).toEqual({ id: 102, email: 'updated@example.com' });
      expect(updateScope.isDone()).toBe(true);
    });

    it('errors when the matching field is empty for joined members', async () => {
      nock(API_ORIGIN)
        .get('/public-api/v1/audience')
        .query({ email: 'joined@example.com' })
        .reply(200, {
          data: [{ id: 101, profileId: 'prof-1', name: 'Old Name', email: 'joined@example.com' }]
        });

      const perform = (App.creates.update_student.operation as any).perform;
      await expect(
        appTester(perform, {
          inputData: { email: 'joined@example.com' }
        })
      ).rejects.toThrow('This student has joined, so only their name can be changed');
    });

    it('errors when the matching field is empty for pending members', async () => {
      nock(API_ORIGIN)
        .get('/public-api/v1/audience')
        .query({ email: 'pending@example.com' })
        .reply(200, {
          data: [{ id: 102, profileId: null, name: '', email: 'pending@example.com' }]
        });

      const perform = (App.creates.update_student.operation as any).perform;
      await expect(
        appTester(perform, {
          inputData: { email: 'pending@example.com' }
        })
      ).rejects.toThrow("This student hasn't joined yet, so only the invite email can be changed");
    });
  });

  describe('audience lookups', () => {
    it('throws NotFound when student is not in organization', async () => {
      nock(API_ORIGIN).get('/public-api/v1/audience').query({ email: 'missing@example.com' }).reply(200, { data: [] });

      const perform = (App.creates.remove_student.operation as any).perform;
      await expect(
        appTester(perform, {
          inputData: { email: 'missing@example.com' }
        })
      ).rejects.toThrow('No student in your organization has the email missing@example.com');
    });

    it('throws NotFound when student is not enrolled in course', async () => {
      nock(API_ORIGIN)
        .get('/public-api/v1/courses/course-1/members')
        .query({ email: 'notenrolled@example.com' })
        .reply(200, { data: [] });

      const perform = (App.creates.remove_course_member.operation as any).perform;
      await expect(
        appTester(perform, {
          inputData: { courseId: 'course-1', email: 'notenrolled@example.com' }
        })
      ).rejects.toThrow('notenrolled@example.com is not enrolled in this course');
    });

    it('refuses to change a course member who is staff', async () => {
      nock(API_ORIGIN)
        .get('/public-api/v1/courses/course-1/members')
        .query({ email: 'tutor@example.com' })
        .reply(200, { data: [{ id: 'member-1', roleId: 2 }] });

      const perform = (App.creates.remove_course_member.operation as any).perform;
      await expect(
        appTester(perform, {
          inputData: { courseId: 'course-1', email: 'tutor@example.com' }
        })
      ).rejects.toThrow('tutor@example.com is an admin or tutor in this course. This action only changes students.');
    });
  });

  describe('add_cohort_member', () => {
    it('turns an all-error response into an error', async () => {
      nock(API_ORIGIN)
        .post('/public-api/v1/cohorts/cohort-1/members')
        .reply(200, {
          data: {
            added: [],
            errors: [{ message: 'Student is already a member of this cohort' }]
          }
        });

      const perform = (App.creates.add_cohort_member.operation as any).perform;
      await expect(
        appTester(perform, {
          inputData: { cohortId: 'cohort-1', email: 'student@example.com' }
        })
      ).rejects.toThrow('Student is already a member of this cohort');
    });

    it('returns result when members are added', async () => {
      nock(API_ORIGIN)
        .post('/public-api/v1/cohorts/cohort-1/members')
        .reply(200, {
          data: {
            added: [{ id: 'cohort-mem-1', email: 'student@example.com' }],
            errors: []
          }
        });

      const perform = (App.creates.add_cohort_member.operation as any).perform;
      const result = await appTester(perform, {
        inputData: { cohortId: 'cohort-1', email: 'student@example.com' }
      });

      expect(result).toEqual({
        added: [{ id: 'cohort-mem-1', email: 'student@example.com' }],
        errors: []
      });
    });
  });

  describe('add_student', () => {
    it('returns the created student record, not the import summary', async () => {
      nock(API_ORIGIN)
        .post('/public-api/v1/audience', { email: 'student@example.com', sendEmail: true })
        .reply(200, {
          data: {
            imported: 1,
            enrolled: 0,
            emailsSent: 1,
            emailsFailed: 0,
            rows: [{ email: 'student@example.com', status: 'ready' }],
            assigned: 0,
            alreadyEnrolledInCourses: 0,
            alreadyEnrolledInCohorts: 0,
            pendingInvitesRenewed: 0,
            truncated: 0
          }
        });
      nock(API_ORIGIN)
        .get('/public-api/v1/audience')
        .query({ email: 'student@example.com' })
        .reply(200, {
          data: [{ id: 1042, profileId: null, name: 'Alex Johnson', email: 'student@example.com' }]
        });

      const perform = (App.creates.add_student.operation as any).perform;
      const result = await appTester(perform, {
        inputData: { email: 'Student@Example.com' }
      });

      expect(result).toEqual({
        id: 1042,
        profileId: null,
        name: 'Alex Johnson',
        email: 'student@example.com'
      });
    });

    it('rejects when the audience import skips the email', async () => {
      nock(API_ORIGIN)
        .post('/public-api/v1/audience')
        .reply(200, {
          data: { rows: [{ email: 'student@example.com', status: 'is_staff' }] }
        });

      const perform = (App.creates.add_student.operation as any).perform;

      await expect(
        appTester(perform, {
          inputData: { email: 'student@example.com' }
        })
      ).rejects.toThrow('belongs to an admin or tutor');
    });

    it('rejects when no student record comes back after the import', async () => {
      nock(API_ORIGIN)
        .post('/public-api/v1/audience')
        .reply(200, {
          data: { rows: [{ email: 'student@example.com', status: 'ready' }] }
        });
      nock(API_ORIGIN).get('/public-api/v1/audience').query({ email: 'student@example.com' }).reply(200, { data: [] });

      const perform = (App.creates.add_student.operation as any).perform;

      await expect(
        appTester(perform, {
          inputData: { email: 'student@example.com' }
        })
      ).rejects.toThrow('did not return a student record');
    });

    it('shares the student shape with the find_student search', () => {
      expect((App.creates.add_student.operation as any).sample).toEqual(
        (App.searches.find_student.operation as any).sample
      );
    });
  });

  describe('searches', () => {
    it('finds student by email', async () => {
      nock(API_ORIGIN)
        .get('/public-api/v1/audience')
        .query({ email: 'student@example.com' })
        .reply(200, {
          data: [{ id: 1042, profileId: 'prof-1', name: 'Alex Johnson', email: 'student@example.com' }]
        });

      const perform = (App.searches.find_student.operation as any).perform;
      const result = await appTester(perform, {
        inputData: { email: 'student@example.com' }
      });

      expect(result).toEqual([{ id: 1042, profileId: 'prof-1', name: 'Alex Johnson', email: 'student@example.com' }]);
    });

    it('finds course by slug', async () => {
      nock(API_ORIGIN)
        .get('/public-api/v1/courses')
        .query({ slug: 'intro-to-data-science' })
        .reply(200, {
          data: [{ id: 'course-1', title: 'Intro to Data Science', slug: 'intro-to-data-science' }]
        });

      const perform = (App.searches.find_course.operation as any).perform;
      const result = await appTester(perform, {
        inputData: { slug: 'intro-to-data-science' }
      });

      expect(result).toEqual([{ id: 'course-1', title: 'Intro to Data Science', slug: 'intro-to-data-science' }]);
    });

    it('errors when find_course has neither slug nor title', async () => {
      const perform = (App.searches.find_course.operation as any).perform;
      await expect(
        appTester(perform, {
          inputData: {}
        })
      ).rejects.toThrow('Fill in Slug or Title');
    });
  });
});
