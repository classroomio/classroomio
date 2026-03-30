import type { TCourseType } from '@cio/db/types';
import type { Course } from '$features/course/types';
import type { CourseMembers, CourseSectionWithLessons, ListLessons } from '$features/course/utils/types';
import { writable, type Writable } from 'svelte/store';

const defaultLessonTabsOrder: NonNullable<NonNullable<Course['metadata']>['lessonTabsOrder']> = [
  { id: 1, name: 'course.navItem.lessons.materials.tabs.note.title' },
  { id: 2, name: 'course.navItem.lessons.materials.tabs.slide.title' },
  { id: 3, name: 'course.navItem.lessons.materials.tabs.video.title' },
  { id: 4, name: 'course.navItem.lessons.materials.tabs.document.title' }
];

export const defaultCourse: Course = {
  id: '',
  title: '',
  description: '',
  overview: null,
  type: 'LIVE_CLASS' as TCourseType,
  cost: 0,
  currency: 'USD',
  status: 'ACTIVE',
  certificate: {
    isDownloadable: false,
    theme: 'professional'
  },
  isPublished: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  groupId: null,
  isTemplate: true,
  logo: '',
  slug: null,
  bannerImage: null,
  attendance: [],
  group: null,
  content: {
    grouped: false,
    sections: [],
    items: []
  },
  metadata: {
    requirements: '',
    description: '',
    goals: '',
    videoUrl: '',
    showDiscount: false,
    discount: 0,
    paymentLink: '',
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
    lessonTabsOrder: defaultLessonTabsOrder,
    grading: false,
    lessonDownload: true,
    allowNewStudent: false,
    isContentGroupingEnabled: true
  }
};

/**
 * @deprecated Use courseApi.course from '$features/course/api' instead
 * This store is kept for backward compatibility but should be migrated to use courseApi state
 */
export const course: Writable<Course> = writable({ ...defaultCourse });

type GroupStore = {
  id?: string;
  tutors: CourseMembers;
  students: CourseMembers;
  people: CourseMembers;
  members?: CourseMembers;
  memberId?: string;
};

/**
 * @deprecated Use courseApi.group from '$features/course/api' instead
 * This store is kept for backward compatibility but should be migrated to use courseApi state
 */
export const group = writable<GroupStore>({
  id: '',
  tutors: [],
  students: [],
  people: []
});

export function sortLesson(lessons: ListLessons = []) {
  return [...lessons]
    .sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function sortCourseSection(sections: CourseSectionWithLessons[] = []): CourseSectionWithLessons[] {
  return [...sections]
    .sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
