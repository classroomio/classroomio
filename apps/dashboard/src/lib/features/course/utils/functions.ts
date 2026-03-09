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
  const questionByIdAndName: Record<string, string> = {};

  for (const question of data.questions) {
    questionByIdAndName[String(question.id)] = question.name ?? '';
  }

  for (const answer of data.answers) {
    const questionName = questionByIdAndName[String(answer.questionId)];
    if (questionName && answer.answerData) {
      answers[questionName] = answer.answerData;
    }
  }

  return answers;
}
