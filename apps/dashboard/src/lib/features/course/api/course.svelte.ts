import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';

import type {
  Course,
  CourseAnalytics,
  CreateCourseRequest,
  CreatePaymentRequestRequest,
  DeleteCourseRequest,
  EnrollCourseRequest,
  GetCourseAnalyticsRequest,
  GetCourseBySlugRequest,
  GetCourseProgressRequest,
  GetCourseRequest,
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
import { ContentType } from '@cio/utils/constants/content';
import type { CourseMembers } from '../utils/types';

type GroupStore = {
  id?: string;
  tutors: CourseMembers;
  students: CourseMembers;
  people: CourseMembers;
  members?: CourseMembers;
  memberId?: string;
};

type CourseContentItem = NonNullable<Course['content']>['items'][number];
interface UpdateCourseOptions {
  showSuccessToast?: boolean;
}

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
   * Updates a single lesson/exercise item in the local course content store.
   * This avoids list staleness when navigating back from item detail pages.
   */
  updateContentItem(
    itemId: string,
    itemType: ContentType.Lesson | ContentType.Exercise,
    patch: Partial<CourseContentItem>
  ) {
    if (!this.course?.content) return false;

    const content = this.course.content;

    if (content.grouped) {
      let hasUpdatedItem = false;

      const sections = content.sections.map((section) => {
        let sectionHasUpdatedItem = false;
        const items = section.items.map((item) => {
          if (item.id !== itemId || item.type !== itemType) return item;
          sectionHasUpdatedItem = true;
          return {
            ...item,
            ...patch
          };
        });

        if (!sectionHasUpdatedItem) {
          return section;
        }

        hasUpdatedItem = true;
        return {
          ...section,
          items
        };
      });

      if (!hasUpdatedItem) return false;

      this.course = {
        ...this.course,
        content: {
          ...content,
          sections
        }
      };

      return true;
    }

    let hasUpdatedItem = false;
    const items = content.items.map((item) => {
      if (item.id !== itemId || item.type !== itemType) return item;
      hasUpdatedItem = true;
      return {
        ...item,
        ...patch
      };
    });

    if (!hasUpdatedItem) return false;

    this.course = {
      ...this.course,
      content: {
        ...content,
        items
      }
    };

    return true;
  }

  /**
   * Removes a single lesson/exercise item from the local course content store.
   * This keeps sidebar lists in sync after delete actions.
   */
  removeContentItem(itemId: string, itemType: ContentType.Lesson | ContentType.Exercise) {
    if (!this.course?.content) return false;

    const content = this.course.content;

    if (content.grouped) {
      let hasRemovedItem = false;

      const sections = content.sections.map((section) => {
        const items = section.items.filter((item) => {
          const shouldRemove = item.id === itemId && item.type === itemType;
          if (shouldRemove) {
            hasRemovedItem = true;
          }
          return !shouldRemove;
        });

        if (items.length === section.items.length) {
          return section;
        }

        return {
          ...section,
          items
        };
      });

      if (!hasRemovedItem) return false;

      this.course = {
        ...this.course,
        content: {
          ...content,
          sections
        }
      };

      return true;
    }

    const items = content.items.filter((item) => !(item.id === itemId && item.type === itemType));

    if (items.length === content.items.length) return false;

    this.course = {
      ...this.course,
      content: {
        ...content,
        items
      }
    };

    return true;
  }

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
   * Enrolls the current user in a course (free: direct enroll; paid: requires inviteToken).
   * @param courseId Course ID
   * @param body Optional invite token for paid/invited courses
   * @returns Success data with redirectTo, or undefined on error
   */
  async enroll(courseId: string, body: { inviteToken?: string } = {}) {
    return this.execute<EnrollCourseRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].enroll.$post({
          param: { courseId },
          json: body
        }),
      logContext: 'enrolling in course',
      onSuccess: () => {
        this.success = true;
        this.errors = {};
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error('snackbar.invite.failed_join');
        } else if (typeof result === 'object' && result !== null && 'error' in result) {
          snackbar.error((result as { error: string }).error);
        }
      }
    });
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
            courseTitle: newCourse.title,
            courseDescription: newCourse.description,
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
  async update(
    courseId: string,
    fields: TCourseUpdate,
    options: UpdateCourseOptions = {}
  ): Promise<UpdateCourseData | null> {
    const { showSuccessToast = true } = options;

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
          if (showSuccessToast) {
            snackbar.success('Course updated successfully');
          }
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
   * Sets course data and processes related data (group data)
   * @param data Course data
   * @param profileId Profile ID
   */
  setCourse(data: Course, profileId: string) {
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
        allowNewStudent: false,
        isContentGroupingEnabled: true
      };
    }

    // Ensure lessonTabsOrder includes all tabs (backward compatibility)
    const metadata = data.metadata ?? undefined;
    const lessonTabsOrder = metadata?.lessonTabsOrder;
    if (lessonTabsOrder) {
      const existingTabIds = lessonTabsOrder.map((tab) => tab.id);
      const allTabs = [
        { id: 1, name: 'course.navItem.lessons.materials.tabs.note.title' },
        { id: 2, name: 'course.navItem.lessons.materials.tabs.slide.title' },
        { id: 3, name: 'course.navItem.lessons.materials.tabs.video.title' },
        { id: 4, name: 'course.navItem.lessons.materials.tabs.document.title' }
      ];

      allTabs.forEach((tab) => {
        if (!existingTabIds.includes(tab.id)) {
          lessonTabsOrder.push(tab);
        }
      });
    }

    if (data.metadata && data.metadata.isContentGroupingEnabled === undefined) {
      data.metadata.isContentGroupingEnabled = true;
    }

    if (!data.content) {
      data.content = {
        grouped: false,
        sections: [],
        items: []
      };
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
