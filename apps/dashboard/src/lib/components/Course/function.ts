import { ROUTES } from './constants';

export function getGroupMemberId(people, profileId) {
  const groupMember = people.find((person) => person.profile_id === profileId);

  return groupMember ? groupMember.id : null;
}

export function getNavItemRoute(courseId, routeId?: string) {
  const path = `/${ROUTES.COURSES}/${courseId}`;

  if (!routeId) {
    return path;
  }

  return `${path}/${routeId}`;
}

export function getLessonsRoute(courseId, lessonId?: string) {
  const path = getNavItemRoute(courseId, ROUTES.LESSONS);

  if (!lessonId) {
    return path;
  }

  return `${path}/${lessonId}`;
}

export function getLectureNo(index, initNo = '0') {
  if (index <= 9) {
    return `${initNo}${index}`;
  }

  return index;
}

export function formatAnswers(data) {
  const answers: Record<string, string> = {};
  const questionByIdAndName = {};

  for (const question of data.questions) {
    questionByIdAndName[question.id] = question.name;
  }

  for (const answer of data.answers) {
    const questionName = questionByIdAndName[answer.question_id];

    answers[questionName] =
      Array.isArray(answer.answers) && answer.answers.length ? answer.answers : answer.open_answer;
  }

  return answers;
}
