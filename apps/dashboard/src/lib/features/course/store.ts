import type { TCourseType, TCourseVersion } from '@cio/db/types';
import type { Course } from '$features/course/types';
import type { CourseMembers, LessonSectionWithLessons, ListLessons } from '$features/course/utils/types';
import { writable, type Writable } from 'svelte/store';

export const defaultCourse = {
  id: '',
  title: '',
  description: '',
  overview: null,
  type: 'LIVE_CLASS' as TCourseType,
  cost: 0,
  currency: 'USD',
  status: 'ACTIVE',
  isCertificateDownloadable: false,
  certificateTheme: 'professional',
  isPublished: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  groupId: null,
  isTemplate: true,
  logo: '',
  slug: null,
  bannerImage: null,
  attendance: [],
  version: 'V2' as TCourseVersion,
  group: null,
  lesson_section: [],
  sections: [],
  lessons: [],
  exercises: [],
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
    lessonTabsOrder: [
      { id: 1, name: 'course.navItem.lessons.materials.tabs.note.title' },
      { id: 2, name: 'course.navItem.lessons.materials.tabs.slide.title' },
      { id: 3, name: 'course.navItem.lessons.materials.tabs.video.title' },
      { id: 4, name: 'course.navItem.lessons.materials.tabs.document.title' }
    ],
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

export function sortLessonSection(sections: LessonSectionWithLessons[] = []): LessonSectionWithLessons[] {
  return [...sections]
    .sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
