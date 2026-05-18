import type { CourseMembers, SubmissionAnswer } from './types';

import type { AnswerData } from '@cio/question-types';
import type { Question } from '../types';
import { ROUTES } from './constants';

export function getGroupMemberId(people: CourseMembers, profileId: string): string | undefined {
  const groupMember = people.find((person) => person.profileId === profileId);

  return groupMember?.id;
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

export function getActiveCourseNavKey(pathname: string, courseId: string): string | null {
  if (!courseId) return null;

  const base = `/${ROUTES.COURSES}/${courseId}`;
  if (!pathname.startsWith(base)) return null;

  const rest = pathname.slice(base.length).replace(/^\//, '');
  const segment = rest.split('/')[0];

  if (!segment) return 'course.navItems.nav_news_feed';
  if (segment === ROUTES.LESSONS || segment === 'exercises') return 'course.navItems.nav_content';
  if (segment === 'analytics') return 'course.navItems.nav_analytics';
  if (segment === 'attendance') return 'course.navItems.nav_attendance';
  if (segment === 'submissions') return 'course.navItems.nav_submissions';
  if (segment === 'marks') return 'course.navItems.nav_marks';
  if (segment === 'compliance') return 'course.navItems.nav_compliance';
  if (segment === 'certificates') return 'course.navItems.nav_certificates';
  if (segment === 'landingpage') return 'course.navItems.nav_landing_page';
  if (segment === 'people') return 'course.navItems.nav_people';
  if (segment === 'ai-tutor') return 'course.navItems.nav_ai_tutor';
  if (segment === 'settings') return 'course.navItems.nav_settings';

  return null;
}

export function getLectureNo(index, initNo = '0') {
  if (index <= 9) {
    return `${initNo}${index}`;
  }

  return index;
}

export function calcProgressRate(progressRate?: number, totalLessons?: number): number {
  if (!progressRate || !totalLessons) {
    return 0;
  }

  return Math.round((progressRate / totalLessons) * 100);
}

/**
 * Calculates combined course progress from lessons and exercises.
 * Uses (lessonsCompleted + exercisesCompleted) / (totalLessons + totalExercises) when both exist.
 * Falls back to lesson-only progress when there are no exercises.
 */
export function calcCourseProgress(params: {
  lessonsCompleted: number;
  totalLessons: number;
  exercisesCompleted?: number;
  totalExercises?: number;
}): number {
  const { lessonsCompleted, totalLessons, exercisesCompleted = 0, totalExercises = 0 } = params;
  const totalItems = totalLessons + totalExercises;
  if (totalItems === 0) return 0;

  const completedItems = lessonsCompleted + exercisesCompleted;

  return Math.round((completedItems / totalItems) * 100);
}

export function formatAnswers(data: {
  questions: Question[];
  answers: SubmissionAnswer[];
}): Record<string, AnswerData> {
  const answers: Record<string, AnswerData> = {};
  const questionKeyById: Record<string, string> = {};

  for (const question of data.questions) {
    const key = question.name ? String(question.name) : String(question.id);
    questionKeyById[String(question.id)] = key;
  }

  for (const answer of data.answers) {
    const questionKey = questionKeyById[String(answer.questionId)];
    if (questionKey && answer.answerData) {
      answers[questionKey] = answer.answerData;
    }
  }

  return answers;
}
