import { COURSE_TYPE, COURSE_VERSION } from '$lib/utils/types';
import type { Course, GroupPerson, Lesson, LessonSection } from '$lib/utils/types';
import { get, writable, type Writable } from 'svelte/store';
import { lessonSections, lessons } from './components/Lesson/store/lessons';

import { ROLE } from '@cio/utils/constants';
import { fetchCourse } from '$lib/utils/services/courses';

export const defaultCourse: Course = {
  id: '',
  title: '',
  description: '',
  type: COURSE_TYPE.LIVE_CLASS,
  cost: 0,
  currency: '',
  status: 'ACTIVE',
  is_certificate_downloadable: false,
  certificate_theme: 'professional',
  is_published: false,
  created_at: new Date().toDateString(),
  updated_at: new Date().toDateString(),
  attendance: [],
  polls: [],
  version: COURSE_VERSION.V2,
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

export const course: Writable<Course> = writable({ ...defaultCourse });

class CourseStore {
  prevId = writable('');
  isLoading = writable(false);

  async fetch(id: string) {
    console.log('----------------FETCHING COURSE----------------');
    console.log('1. fetching course', id);
    if (get(this.prevId) === id) {
      console.log('2. course already fetched');
      return;
    }

    console.log('3. fetching course', id);

    this.isLoading.update(() => true);
    this.prevId.set(id);

    course.set(defaultCourse);
    lessons.set([]);

    const { data } = await fetchCourse(id);
    if (data) {
      console.log('4. setting course');
      setCourse(data);
    }
    console.log('5. setting isLoading to false');

    this.isLoading.update(() => false);
    console.log('--------------FETCHING COURSE COMPLETED------------------');
  }
}
export const courseStore = new CourseStore();

export const mockGroupMember = {
  id: '434534534535',
  group_id: '434534534535',
  role_id: 1,
  profile_id: 'vcvbcvbcvbb----434534534535',
  email: null,
  profile: {
    id: 'vcvbcvbcvbb----434534534535',
    fullname: 'Rotimi Best',
    username: 'robertblake',
    avatar_url: '',
    created_at: '2021-08-08T13:42:13+00:00',
    updated_at: '2021-08-08T13:42:13+00:00'
  }
};

type GroupStore = {
  id?: string;
  tutors: GroupPerson[];
  students: GroupPerson[];
  people: GroupPerson[];
  members?: GroupPerson[];
  memberId?: string;
};

export const group = writable<GroupStore>({
  id: '',
  tutors: [],
  students: [],
  people: []
});

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
        if (member.role_id === ROLE.STUDENT) {
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
    const orderedLessons = sortLesson(data.lessons);
    lessons.set(orderedLessons);

    console.log('orderedLessons', orderedLessons);

    if (data.lesson_section) {
      const sections = data.lesson_section?.map((section) => {
        const lessons = (data.lessons || []).filter((lesson) => lesson.section_id === section.id);
        section.lessons = sortLesson(lessons);
        return section;
      });

      lessonSections.set(sortLessonSection(sections));
    }
  }

  delete data.lessons;
  delete data?.lesson_section;

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

    let hasChanges = false;
    // Add missing tabs to existing lessonTabsOrder
    allTabs.forEach((tab) => {
      if (!existingTabIds.includes(tab.id) && data.metadata.lessonTabsOrder) {
        data.metadata.lessonTabsOrder.push(tab);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      // Document tab has been added to lessonTabsOrder
    }
  }

  if (!data.certificate_theme) {
    data.certificate_theme = 'professional';
  }

  console.log('lessons', get(lessons));
  course.set(data);
}

export function sortLesson(lessons: Lesson[] = []) {
  return lessons
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function sortLessonSection(sections: LessonSection[] = []) {
  return sections
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
