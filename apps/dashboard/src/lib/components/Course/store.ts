import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { lessons, lessonSections } from './components/Lesson/store/lessons';
import { ROLE } from '$lib/utils/constants/roles';
import type { Course, GroupPerson, Lesson, LessonSection } from '$lib/utils/types';
import { COURSE_TYPE, COURSE_VERSION } from '$lib/utils/types';

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
      { id: 3, name: 'course.navItem.lessons.materials.tabs.video.title' }
    ],
    grading: false,
    lessonDownload: true,
    allowNewStudent: false
  },
  tags: []
};

export const course: Writable<Course> = writable({ ...defaultCourse });

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
  id: string;
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
  // const tutorsById = {};

  if (data.group) {
    const groupData = Object.assign(data.group, {
      tutors: [],
      students: [],
      people: []
    }) as GroupStore;

    if (Array.isArray(groupData.members)) {
      for (const member of groupData.members) {
        if (member.role_id === ROLE.STUDENT) {
          groupData.students.push(member);
        } else if (member.profile) {
          groupData.tutors.push({
            ...member.profile,
            memberId: member.id
          });
        }
      }

      groupData.people = groupData.members;
    }

    delete groupData.members;

    group.set(groupData);
  }

  if (setLesson) {
    const orderedLessons = sortLesson(data.lessons);
    lessons.set(orderedLessons);

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

  if (!data.certificate_theme) {
    data.certificate_theme = 'professional';
  }

  // restructure the tags data coming in
  if (data.tags) {
    data.tags = data.tags.map(tag => ({
      id: tag.id,
      course_tag_id: tag.tag_id,
      name: tag.tags.name,
    }));
  }

  course.set(data);
}

function sortLesson(lessons: Lesson[] = []) {
  return lessons
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function sortLessonSection(sections: LessonSection[] = []) {
  return sections
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
