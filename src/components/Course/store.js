import { writable } from 'svelte/store';
import { lessons } from './components/Lesson/store/lessons';
import { ROLE } from '../../utils/constants/roles';

export const course = writable({});

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

export async function setCourseData(data, setLesson = true) {
  if (!data || !(Object.values(data) && Object.values(data).length)) return;
  // const tutorsById = {};

  if (data.group) {
    const groupData = Object.assign(data.group, {
      tutors: [],
      students: [],
      people: [],
    });

    if (Array.isArray(groupData.members)) {
      for (const member of groupData.members) {
        if (member.role_id === ROLE.STUDENT) {
          groupData.students.push(member);
        } else if (member.profile) {
          groupData.tutors.push(member.profile);

          // tutorsById[member.profile.id] = member.profile;
        }
      }

      groupData.people = groupData.members;
    }

    delete groupData.members;
    group.set(groupData);
  }

  if (setLesson) {
    const orderedLessons = (data.lessons || []).sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
    // .map((lesson) => ({
    //   ...lesson,
    //   profile: lesson.profile && tutorsById[lesson.profile.id],
    // }));
    lessons.set(orderedLessons);
  }

  delete data.lessons;
  course.set(data);
}
