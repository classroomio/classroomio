import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';

import type {
  Course,
  CourseAnalytics,
  CreateCourseRequest,
  CreatePaymentRequestRequest,
  DeleteCourseRequest,
  GetCourseAnalyticsRequest,
  GetCourseBySlugRequest,
  GetCourseProgressRequest,
  GetCourseRequest,
  LessonSectionWithLessons,
  UpdateCourseData,
  UpdateCourseRequest
} from '../utils/types';
import type { TCourseType } from '@cio/db/types';
import { ZCourseCreate, ZCourseUpdate, type TCourseUpdate } from '@cio/utils/validation/course/course';
import { capturePosthogEvent } from '$lib/utils/services/posthog';
import { currentOrg } from '$lib/utils/store/org';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { profile } from '$lib/utils/store/user';
import { resolve } from '$app/paths';
import { snackbar } from '$features/ui/snackbar/store';
import { ROLE } from '@cio/utils/constants';
import type { CourseMembers } from '../utils/types';
import { lessonApi } from './lesson.svelte';
import { sortLesson, sortLessonSection } from '../store';

type GroupStore = {
  id?: string;
  tutors: CourseMembers;
  students: CourseMembers;
  people: CourseMembers;
  members?: CourseMembers;
  memberId?: string;
};

/**
 * API class for course creation operations
 */
export class CourseApi extends BaseApiWithErrors {
  course = $state<Course | null>(null);
  courseAnalytics = $state<CourseAnalytics | null>(null);
  group = $state<GroupStore>({
    id: '',
    tutors: [],
    students: [],
    people: [],
    memberId: ''
  });

  private loadedCourseId = $state<string | null>(null);
  private isCourseDirty = $state(false);
  private inFlightCourseRequest: Promise<Course | null> | null = null;
  private inFlightCourseId = $state<string | null>(null);

  /**
   * Gets a course by ID
   * @param courseId Course ID
   * @returns The course data or null on error
   */
  async get(courseId: string) {
    await this.execute<GetCourseRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].$get({
          param: { courseId },
          query: {}
        }),
      logContext: 'fetching course',
      onSuccess: (response) => {
        console.log('response', response.data);
        if (response.data) {
          this.course = response.data;
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to fetch course');
        }
      }
    });
    return this.course;
  }

  /**
   * Ensures the course store is populated for a given courseId.
   * - Fetches from the API the first time per courseId
   * - Reuses store data on subsequent calls
   * - Can be forced to refetch by calling `invalidateCourse(courseId)`
   */
  async ensureCourse(courseId: string, profileId: string) {
    if (!courseId || !profileId) return null;

    // Already loaded and not marked stale
    if (!this.isCourseDirty && this.loadedCourseId === courseId && this.course?.id === courseId) {
      return this.course;
    }

    // De-duplicate concurrent requests for the same courseId
    if (this.inFlightCourseRequest && this.inFlightCourseId === courseId) {
      return this.inFlightCourseRequest;
    }

    const request = (async () => {
      const course = await this.get(courseId);
      if (course) {
        this.setCourse(course, profileId);
        this.loadedCourseId = courseId;
        this.isCourseDirty = false;
      }
      return this.course;
    })();

    this.inFlightCourseRequest = request;
    this.inFlightCourseId = courseId;
    try {
      return await request;
    } finally {
      if (this.inFlightCourseRequest === request) {
        this.inFlightCourseRequest = null;
        this.inFlightCourseId = null;
      }
    }
  }

  /**
   * Marks the currently loaded course as stale.
   * Next call to `ensureCourse(courseId, profileId)` will refetch.
   */
  invalidateCourse(courseId?: string) {
    if (!courseId) {
      this.isCourseDirty = true;
    } else if (this.loadedCourseId === courseId) {
      this.isCourseDirty = true;
    }
  }

  /**
   * Forces a refetch of the course into the store (used after mutations).
   */
  async refreshCourse(courseId: string, profileId: string) {
    this.invalidateCourse(courseId);
    return this.ensureCourse(courseId, profileId);
  }

  /**
   * Gets a course by slug (public route)
   * @param slug Course slug
   * @returns The course data or null on error
   */
  async getBySlug(slug: string) {
    await this.execute<GetCourseBySlugRequest>({
      requestFn: () =>
        classroomio.course.slug?.[':slug'].$get({
          param: { slug }
        }),
      logContext: 'fetching course by slug',
      onSuccess: (response) => {
        if (response.data) {
          this.course = response.data;
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to fetch course by slug');
        }
      }
    });
    return this.course;
  }

  /**
   * Creates a new course with group, group member, and default newsfeed
   * @param fields Course creation fields (title, description, type)
   * @returns The created course data or null on error
   */
  async create(fields: { title: string; description: string; type: TCourseType }) {
    const org = get(currentOrg);
    const userProfile = get(profile);

    // Prepare data for validation
    const data = {
      title: fields.title,
      description: fields.description,
      type: fields.type,
      organizationId: org.id
    };

    // Client-side validation
    const result = ZCourseCreate.safeParse(data);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'course');
      return null;
    }

    await this.execute<CreateCourseRequest>({
      requestFn: () =>
        classroomio.course.$post({
          json: result.data
        }),
      logContext: 'creating course',
      onSuccess: (response) => {
        if (response.data?.course) {
          const newCourse = response.data.course;

          // Capture PostHog event
          capturePosthogEvent('course_created', {
            course_id: newCourse.id,
            course_title: newCourse.title,
            course_description: newCourse.description,
            organization_id: org.id,
            organization_name: org.name,
            user_id: userProfile.id,
            user_email: userProfile.email
          });

          // Navigate to the new course
          goto(resolve(`/courses/${newCourse.id}`, {}));

          // Show success message
          snackbar.success('Course created successfully');

          // Mark as successful
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to create course');
          return;
        }
        if ('error' in result && 'field' in result && result.field) {
          // Field-specific error (e.g., duplicate title)
          this.errors[result.field] = result.error;
          snackbar.error(result.error);
        } else if ('error' in result) {
          // General error
          this.errors.general = result.error;
          snackbar.error(result.error);
        }
      }
    });
  }

  /**
   * Updates a course
   * @param courseId Course ID
   * @param fields Course update fields
   * @returns The updated course data or null on error
   */
  async update(courseId: string, fields: TCourseUpdate): Promise<UpdateCourseData | null> {
    const result = ZCourseUpdate.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error, 'course');
      return null;
    }

    const response = await this.execute<UpdateCourseRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].$put({
          param: { courseId },
          json: result.data
        }),
      logContext: 'updating course',
      onSuccess: (response) => {
        if (response.data) {
          // Update the stored course data, preserving fields not in the update response
          // The update response may not include all fields (like group, lessons, etc.)
          if (this.course) {
            // Merge update response with existing course data
            Object.assign(this.course, response.data);
          } else {
            this.course = response.data as Course;
          }
          snackbar.success('Course updated successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to update course');
          return;
        }
        if ('error' in result && 'field' in result && result.field) {
          this.errors[result.field] = result.error;
          snackbar.error(result.error);
        } else if ('error' in result) {
          this.errors.general = result.error;
          snackbar.error(result.error);
        }
      }
    });

    const updated = response?.data ?? null;

    // Some update responses may omit related data (group/lessons/sections), so refresh the store.
    if (updated) {
      const profileId = get(profile)?.id;
      if (profileId) {
        await this.refreshCourse(courseId, profileId);
      }
    }

    return updated;
  }

  /**
   * Deletes a course (soft delete)
   * @param courseId Course ID
   * @returns The deleted course data or null on error
   */
  async delete(courseId: string) {
    await this.execute<DeleteCourseRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].$delete({
          param: { courseId }
        }),
      logContext: 'deleting course',
      onSuccess: (response) => {
        if (response.data) {
          snackbar.success('Course deleted successfully');
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to delete course');
        }
      }
    });
  }

  /**
   * Gets course progress for a profile
   * @param courseId Course ID
   * @param profileId Profile ID
   * @returns Course progress data or null on error
   */
  async getProgress(courseId: string, profileId: string) {
    return this.execute<GetCourseProgressRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['progress'].$get({
          param: { courseId },
          query: { profileId }
        }),
      logContext: 'fetching course progress',
      onSuccess: (response) => {
        if (response.data) {
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to fetch course progress');
        }
      }
    });
  }

  /**
   * Gets course analytics including student progress, completion rates, and grades
   * @param courseId Course ID
   * @returns Course analytics data or null on error
   */
  async getAnalytics(courseId: string) {
    await this.execute<GetCourseAnalyticsRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['analytics'].$get({
          param: { courseId }
        }),
      logContext: 'fetching course analytics',
      onSuccess: (response) => {
        if (response.data) {
          this.courseAnalytics = response.data;
          this.success = true;
          this.errors = {};
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to fetch course analytics');
        }
      }
    });
  }

  /**
   * Sets course data and processes related data (group, lessons, sections)
   * @param data Course data
   * @param profileId Profile ID
   * @param setLesson Whether to set lesson data (default: true)
   */
  setCourse(data: Course, profileId: string, setLesson = true) {
    if (!data || !(Object.values(data) && Object.values(data).length)) return;

    // Process group data
    if (data.group) {
      const copiedGroup = JSON.parse(JSON.stringify(data.group));
      const groupData: GroupStore = Object.assign(copiedGroup, {
        id: copiedGroup.id,
        tutors: [],
        students: [],
        people: [],
        memberId: data.group.members.find((member) => member.profileId === profileId)?.id || ''
      });

      if (Array.isArray(data.group.members)) {
        for (const member of data.group.members) {
          const roleId = Number(member.roleId || 0);
          if (roleId === ROLE.STUDENT) {
            groupData.students.push(member);
          } else if (member.profile) {
            groupData.tutors.push(member);
          }

          groupData.people.push(member);
        }
      }

      this.group = groupData;
    }

    // Process lesson data
    if (setLesson) {
      const orderedLessons = sortLesson(data.lessons || []);
      lessonApi.lessons = orderedLessons;

      const sectionsData = data.sections || [];
      if (sectionsData.length > 0) {
        const sections: LessonSectionWithLessons[] = sectionsData.map((section) => {
          const lessons = (data.lessons || []).filter((lesson) => lesson.sectionId === section.id);
          return {
            ...section,
            lessons: sortLesson(lessons)
          } as LessonSectionWithLessons;
        });

        lessonApi.sections = sortLessonSection(sections);
      }
    }

    // Ensure metadata has default values
    if (data.metadata && !Object.values(data.metadata).some((v) => v !== undefined && v !== null && v !== '')) {
      data.metadata = {
        requirements: '',
        description: '',
        goals: '',
        videoUrl: '',
        showDiscount: false,
        discount: 0,
        reward: {
          show: false,
          description: ''
        },
        instructor: {
          name: '',
          role: '',
          coursesNo: 0,
          description: '',
          imgUrl: ''
        },
        allowNewStudent: false
      };
    }

    // Ensure lessonTabsOrder includes all tabs (backward compatibility)
    if (data.metadata && data.metadata.lessonTabsOrder) {
      const existingTabIds = data.metadata.lessonTabsOrder.map((tab) => tab.id);
      const allTabs = [
        { id: 1, name: 'course.navItem.lessons.materials.tabs.note.title' },
        { id: 2, name: 'course.navItem.lessons.materials.tabs.slide.title' },
        { id: 3, name: 'course.navItem.lessons.materials.tabs.video.title' },
        { id: 4, name: 'course.navItem.lessons.materials.tabs.document.title' }
      ];

      allTabs.forEach((tab) => {
        if (!existingTabIds.includes(tab.id) && data.metadata.lessonTabsOrder) {
          data.metadata.lessonTabsOrder.push(tab);
        }
      });
    }

    // Ensure certificateTheme has default value
    if (!data.certificateTheme) {
      data.certificateTheme = 'professional';
    }

    // Set the course data
    this.course = data;
  }

  /**
   * Creates a payment request
   * @param courseId Course ID
   * @param studentEmail Student email address
   * @param studentFullname Student full name
   */
  async createPaymentRequest(courseId: string, studentEmail: string, studentFullname: string) {
    return this.execute<CreatePaymentRequestRequest>({
      requestFn: () =>
        classroomio.course[':courseId']['payment-request']['$post']({
          param: { courseId },
          json: {
            studentEmail,
            studentFullname
          }
        }),
      logContext: 'creating payment request',
      onSuccess: () => {
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('Failed to send payment request');
        }
      }
    });
  }
}

export const courseApi = new CourseApi();
