import { writable, Writable } from 'svelte/store';
import { lessons } from './components/Lesson/store/lessons';
//@ts-ignore
import { ROLE } from '../../utils/constants/roles';
import type { Course } from '../../utils/types';

export const course: Writable<Course> = writable({
  id: '',
  title: '',
  description: '',
  cost: 0,
  currency: '',
  auto_send_certificate: false,
  metadata: {
    requirements: '',
    description: '',
    goals: '',
    videoUrl: '',
    showDiscount: false,
    discount: 0,
    reward: {
      show: false,
      description: '',
    },
    instructor: {
      name: '',
      role: '',
      coursesNo: 0,
      description: '',
      imgUrl: '',
    },
  },
});

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
    updated_at: '2021-08-08T13:42:13+00:00',
  },
};

export const group = writable({
  id: null,
  tutors: [],
  students: [],
  people: [],
});

export async function setCourse(data: Course, setLesson = true) {
  if (!data || !(Object.values(data) && Object.values(data).length)) return;
  // const tutorsById = {};

  if (data.group) {
    const groupData = Object.assign(data.group, {
      tutors: [],
      students: [],
      people: [],
    });

    // @ts-ignore
    if (Array.isArray(groupData.members)) {
      // @ts-ignore
      for (const member of groupData.members) {
        if (member.role_id === ROLE.STUDENT) {
          // @ts-ignore
          groupData.students.push(member);
        } else if (member.profile) {
          // @ts-ignore
          groupData.tutors.push(member.profile);

          // tutorsById[member.profile.id] = member.profile;
        }
      }

      // @ts-ignore
      groupData.people = groupData.members;
    }

    // @ts-ignore
    delete groupData.members;
    // @ts-ignore
    group.set(groupData);
  }

  if (setLesson) {
    // @ts-ignore
    const orderedLessons = (data.lessons || [])
      // @ts-ignore
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      // @ts-ignore
      .sort((a, b) => a.order - b.order);
    // .map((lesson) => ({
    //   ...lesson,
    //   profile: lesson.profile && tutorsById[lesson.profile.id],
    // }));
    lessons.set(orderedLessons);
  }

  //@ts-ignore
  delete data.lessons;

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
        description: '',
      },
      instructor: {
        name: '',
        role: '',
        coursesNo: 0,
        description: '',
        imgUrl: '',
      },
    };
  }
  course.set(data);
}
