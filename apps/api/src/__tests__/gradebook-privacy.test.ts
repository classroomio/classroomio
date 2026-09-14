import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/mark', () => ({
  getMarksByCourseId: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({
  getCourseMembers: vi.fn(),
  getCourseMember: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseWithRelations: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn(),
  getGroupMemberIdByCourseAndProfile: vi.fn()
}));

import { ROLE } from '@cio/utils/constants';
import { getMarksByCourseId, type Mark } from '@cio/db/queries/mark';
import { getCourseMember, getCourseMembers, type CourseMemberWithProfile } from '@cio/db/queries/course/people';
import { getCourseWithRelations } from '@cio/db/queries/course';
import { getGroupMemberIdByCourseAndProfile, isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getGradebook } from '@api/services/mark/gradebook';
import { getMarks } from '@api/services/mark';

const COURSE_ID = 'course-1';
const STUDENT_PROFILE_ID = 'profile-student-1';
const OTHER_STUDENT_PROFILE_ID = 'profile-student-2';
const INSTRUCTOR_PROFILE_ID = 'profile-instructor-1';
const STUDENT_MEMBER_ID = 'member-student-1';
const OTHER_STUDENT_MEMBER_ID = 'member-student-2';

function member(
  overrides: Partial<CourseMemberWithProfile> & Pick<CourseMemberWithProfile, 'id' | 'profileId' | 'roleId'>
): CourseMemberWithProfile {
  return {
    email: null,
    groupId: 'group-1',
    createdAt: null,
    certificateEarnedAt: null,
    certificationEmailSentAt: null,
    profile: {
      id: overrides.profileId ?? 'profile',
      fullname: 'Student',
      username: null,
      avatarUrl: null,
      email: 'student@test.com'
    },
    ...overrides
  } as CourseMemberWithProfile;
}

function mark(overrides: Partial<Mark> & Pick<Mark, 'exerciseId' | 'groupmemberId'>): Mark {
  return {
    courseId: COURSE_ID,
    exerciseTitle: 'Quiz',
    exercisePoints: 10,
    statusId: 3,
    totalPointsGotten: 8,
    ...overrides
  };
}

const studentOne = member({
  id: STUDENT_MEMBER_ID,
  profileId: STUDENT_PROFILE_ID,
  roleId: ROLE.STUDENT,
  profile: {
    id: STUDENT_PROFILE_ID,
    fullname: 'Ada Student',
    username: 'ada',
    avatarUrl: null,
    email: 'ada@test.com'
  }
});

const studentTwo = member({
  id: OTHER_STUDENT_MEMBER_ID,
  profileId: OTHER_STUDENT_PROFILE_ID,
  roleId: ROLE.STUDENT,
  profile: {
    id: OTHER_STUDENT_PROFILE_ID,
    fullname: 'Other Student',
    username: 'other',
    avatarUrl: null,
    email: 'other@test.com'
  }
});

const instructor = member({
  id: 'member-instructor-1',
  profileId: INSTRUCTOR_PROFILE_ID,
  roleId: ROLE.TUTOR,
  profile: {
    id: INSTRUCTOR_PROFILE_ID,
    fullname: 'Tutor',
    username: 'tutor',
    avatarUrl: null,
    email: 'tutor@test.com'
  }
});

const allMarks: Mark[] = [
  mark({ exerciseId: 'ex-1', groupmemberId: STUDENT_MEMBER_ID, totalPointsGotten: 9, exerciseTitle: 'Quiz 1' }),
  mark({ exerciseId: 'ex-1', groupmemberId: OTHER_STUDENT_MEMBER_ID, totalPointsGotten: 4, exerciseTitle: 'Quiz 1' }),
  mark({ exerciseId: 'ex-2', groupmemberId: STUDENT_MEMBER_ID, totalPointsGotten: 10, exerciseTitle: 'Quiz 2' }),
  mark({ exerciseId: 'ex-2', groupmemberId: OTHER_STUDENT_MEMBER_ID, totalPointsGotten: 2, exerciseTitle: 'Quiz 2' })
];

const studentOwnMarks = allMarks.filter((row) => row.groupmemberId === STUDENT_MEMBER_ID);

describe('gradebook privacy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseWithRelations).mockResolvedValue(null);
  });

  it('returns every student and score to instructors', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getMarksByCourseId).mockResolvedValue(allMarks);
    vi.mocked(getCourseMembers).mockResolvedValue([studentOne, studentTwo, instructor]);

    const gradebook = await getGradebook(COURSE_ID, INSTRUCTOR_PROFILE_ID);

    expect(getGroupMemberIdByCourseAndProfile).not.toHaveBeenCalled();
    expect(getCourseMember).not.toHaveBeenCalled();
    expect(getMarksByCourseId).toHaveBeenCalledWith(COURSE_ID);
    expect(gradebook.students.map((row) => row.id)).toEqual([STUDENT_MEMBER_ID, OTHER_STUDENT_MEMBER_ID]);
    expect(gradebook.studentMarksByExerciseId).toEqual({
      [STUDENT_MEMBER_ID]: { 'ex-1': '9', 'ex-2': '10' },
      [OTHER_STUDENT_MEMBER_ID]: { 'ex-1': '4', 'ex-2': '2' }
    });
  });

  it('returns only the viewing student and their scores to students', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);
    vi.mocked(getGroupMemberIdByCourseAndProfile).mockResolvedValue(STUDENT_MEMBER_ID);
    vi.mocked(getMarksByCourseId).mockResolvedValue(studentOwnMarks);
    vi.mocked(getCourseMember).mockResolvedValue(studentOne);

    const gradebook = await getGradebook(COURSE_ID, STUDENT_PROFILE_ID);

    expect(getCourseMembers).not.toHaveBeenCalled();
    expect(getMarksByCourseId).toHaveBeenCalledWith(COURSE_ID, STUDENT_MEMBER_ID);
    expect(getCourseMember).toHaveBeenCalledWith(COURSE_ID, STUDENT_MEMBER_ID);
    expect(gradebook.students).toEqual([studentOne]);
    expect(gradebook.studentMarksByExerciseId).toEqual({
      [STUDENT_MEMBER_ID]: { 'ex-1': '9', 'ex-2': '10' }
    });
    expect(gradebook.studentMarksByExerciseId[OTHER_STUDENT_MEMBER_ID]).toBeUndefined();
  });

  it('strips other learners from a student gradebook even if marks leak from the query', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);
    vi.mocked(getGroupMemberIdByCourseAndProfile).mockResolvedValue(STUDENT_MEMBER_ID);
    vi.mocked(getMarksByCourseId).mockResolvedValue(allMarks);
    vi.mocked(getCourseMember).mockResolvedValue(studentOne);

    const gradebook = await getGradebook(COURSE_ID, STUDENT_PROFILE_ID);

    expect(gradebook.students.map((row) => row.id)).toEqual([STUDENT_MEMBER_ID]);
    expect(Object.keys(gradebook.studentMarksByExerciseId)).toEqual([STUDENT_MEMBER_ID]);
    expect(gradebook.studentMarksByExerciseId[OTHER_STUDENT_MEMBER_ID]).toBeUndefined();
  });

  it('returns an empty student gradebook when the viewer has no course membership row', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);
    vi.mocked(getGroupMemberIdByCourseAndProfile).mockResolvedValue(null);

    const gradebook = await getGradebook(COURSE_ID, STUDENT_PROFILE_ID);

    expect(getMarksByCourseId).not.toHaveBeenCalled();
    expect(getCourseMembers).not.toHaveBeenCalled();
    expect(gradebook.students).toEqual([]);
    expect(gradebook.studentMarksByExerciseId).toEqual({});
  });
});

describe('getMarks privacy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns every mark to instructors', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getMarksByCourseId).mockResolvedValue(allMarks);

    const marks = await getMarks(COURSE_ID, INSTRUCTOR_PROFILE_ID);

    expect(getGroupMemberIdByCourseAndProfile).not.toHaveBeenCalled();
    expect(getMarksByCourseId).toHaveBeenCalledWith(COURSE_ID);
    expect(marks).toEqual(allMarks);
  });

  it('requests only the viewing student marks', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);
    vi.mocked(getGroupMemberIdByCourseAndProfile).mockResolvedValue(STUDENT_MEMBER_ID);
    vi.mocked(getMarksByCourseId).mockResolvedValue(studentOwnMarks);

    const marks = await getMarks(COURSE_ID, STUDENT_PROFILE_ID);

    expect(getMarksByCourseId).toHaveBeenCalledWith(COURSE_ID, STUDENT_MEMBER_ID);
    expect(marks.every((row) => row.groupmemberId === STUDENT_MEMBER_ID)).toBe(true);
  });

  it('returns no marks when a student has no course membership row', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);
    vi.mocked(getGroupMemberIdByCourseAndProfile).mockResolvedValue(null);

    const marks = await getMarks(COURSE_ID, STUDENT_PROFILE_ID);

    expect(getMarksByCourseId).not.toHaveBeenCalled();
    expect(marks).toEqual([]);
  });
});
