import { presignApi } from '../api';
import type { CourseMembers } from './types';
import { ROUTES } from './constants';
import { deserializeStoredAnswer } from '@cio/question-types';

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

export function formatAnswers(data) {
  const answers: Record<string, string | string[]> = {};
  const questionByIdAndName = {};
  const questionTypeById = {};

  for (const question of data.questions) {
    questionByIdAndName[question.id] = question.name;
    questionTypeById[question.id] = question.questionTypeId;
  }

  for (const answer of data.answers) {
    const questionName = questionByIdAndName[answer.questionId];
    if (questionName) {
      const rawValue = Array.isArray(answer.answers) && answer.answers.length ? answer.answers : answer.openAnswer;
      const questionTypeId = questionTypeById[answer.questionId];
      answers[questionName] = deserializeStoredAnswer(questionTypeId, rawValue) ?? rawValue;
    }
  }

  return answers;
}

/**
 * Enriches FILE_UPLOAD answers (objects with fileKey) with presigned download URLs.
 * Used when displaying submitted/graded exercise answers so users can download files.
 */
export async function enrichFileUploadAnswersWithUrls(
  answers: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const fileKeys: string[] = [];
  const keysByAnswerKey: string[] = [];

  for (const [answerKey, value] of Object.entries(answers)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && 'fileKey' in value) {
      const key = (value as { fileKey: string }).fileKey;
      if (typeof key === 'string' && key.length > 0) {
        fileKeys.push(key);
        keysByAnswerKey.push(answerKey);
      }
    }
  }

  if (fileKeys.length === 0) return answers;

  try {
    const urls = await presignApi.getDocumentDownloadUrls(fileKeys);
    if (Object.keys(urls).length === 0) return answers;

    const enriched = { ...answers };
    fileKeys.forEach((fileKey, i) => {
      const answerKey = keysByAnswerKey[i];
      const url = urls[fileKey];
      if (answerKey && url && enriched[answerKey] && typeof enriched[answerKey] === 'object') {
        enriched[answerKey] = { ...(enriched[answerKey] as object), fileUrl: url };
      }
    });
    return enriched;
  } catch {
    return answers;
  }
}
