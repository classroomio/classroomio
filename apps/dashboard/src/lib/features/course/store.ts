import type { TCourseType, TCourseVersion } from '@cio/db/types';
import type { Course } from '$features/course/types';
import type { LessonSectionWithLessons } from '$features/course/utils/types';
import type { GroupMember } from '$features/course/utils/types';
import { writable, type Writable } from 'svelte/store';
import { lessonApi } from './api';

import { ROLE } from '@cio/utils/constants';

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
    allowNewStudent: false
  }
};

/**
 * @deprecated Use courseApi.course from '$features/course/api' instead
 * This store is kept for backward compatibility but should be migrated to use courseApi state
 */
export const course: Writable<Course> = writable({ ...defaultCourse });

type GroupStore = {
  id?: string;
  tutors: GroupMember[];
  students: GroupMember[];
  people: GroupMember[];
  members?: GroupMember[];
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

/**
 * @deprecated Use courseApi.setCourse() from '$features/course/api' instead
 * This function is kept for backward compatibility but should be migrated to use courseApi
 */
export async function setCourse(data: Course, setLesson = true) {
  if (!data || !(Object.values(data) && Object.values(data).length)) return;

  if (data.group) {
    const copiedGroup = JSON.parse(JSON.stringify(data.group));
    const groupData = Object.assign(copiedGroup, {
      id: copiedGroup.id,
      tutors: [],
      students: [],
      people: []
    });

    if (Array.isArray(data.group.members)) {
      for (const member of data.group.members) {
        if (member.roleId === ROLE.STUDENT) {
          groupData.students.push(member);
        } else if (member.profile) {
          groupData.tutors.push({
            ...member,
            memberId: member.id
          });
        }
      }

      groupData.people = data.group.members;
    }

    group.set(groupData);
  }

  if (setLesson) {
    const orderedLessons = sortLesson(data.lessons || []);
    lessonApi.lessons = orderedLessons;

    console.log('orderedLessons', orderedLessons);

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

  // delete data.lessons;
  // delete courseData.sections;
  // delete courseData.lesson_section;

  if (data.metadata && !Object.values(data.metadata)) {
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

  if (!data.certificateTheme) {
    data.certificateTheme = 'professional';
  }

  course.set(data);
}

export function sortLesson(lessons: Course['lessons'] = []) {
  return lessons
    .sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function sortLessonSection(sections: LessonSectionWithLessons[] = []): LessonSectionWithLessons[] {
  return sections
    .sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
