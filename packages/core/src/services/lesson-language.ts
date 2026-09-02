import { AppError, ErrorCodes } from '@cio/utils/errors';
import { sanitizeOptionalHtml } from '../utils/sanitize-html';
import type { TLessonLanguage, TLocale, TNewLessonLanguage } from '@cio/db/types';
import {
  deleteLessonLanguage,
  getLessonLanguageByLessonIdAndLocale,
  getLessonLanguagesByLessonId,
  updateLessonLanguage,
  upsertLessonLanguage
} from '@cio/db/queries/lesson/language';

import { getLessonById } from '@cio/db/queries/lesson/lesson';
import { touchCourseUpdatedAt } from '@cio/db/queries/course';
import { db } from '@cio/db/drizzle';
import { recordLessonLanguageVersion } from './lesson-version';
import type { TLessonVersionIntent } from '@cio/utils/constants/lesson-version';

/**
 * How a content write should show up in version history. Defaults to `auto`
 * (prunable, coalesced into the author's open editing session); callers that
 * know the write is a deliberate checkpoint pass `manual` or `publish`, and bulk
 * writes that shouldn't appear in a tutor's history at all pass `none`.
 */
export interface LessonVersionOptions {
  authorId?: string | null;
  versionIntent?: TLessonVersionIntent;
  versionLabel?: string | null;
}

/**
 * Gets all language translations for a lesson
 * @param lessonId - The lesson ID
 * @returns Array of lesson languages
 */
export async function listLessonLanguages(lessonId: string): Promise<TLessonLanguage[]> {
  try {
    const languages = await getLessonLanguagesByLessonId(lessonId);
    return languages;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch lesson languages',
      ErrorCodes.LESSON_LANGUAGE_FETCH_FAILED,
      500
    );
  }
}

/**
 * Gets a single lesson language by locale
 * @param lessonId - The lesson ID
 * @param locale - The locale
 * @returns Lesson language or null if not found
 */
export async function getLessonLanguage(lessonId: string, locale: TLocale): Promise<TLessonLanguage | null> {
  try {
    const language = await getLessonLanguageByLessonIdAndLocale(lessonId, locale);
    return language;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch lesson language',
      ErrorCodes.LESSON_LANGUAGE_FETCH_FAILED,
      500
    );
  }
}

/**
 * Creates or updates a lesson language translation
 * @param lessonId - The lesson ID
 * @param data - Lesson language data
 * @returns Created or updated lesson language
 */
export async function upsertLessonLanguageService(
  lessonId: string,
  data: Omit<TNewLessonLanguage, 'lessonId'>,
  options: LessonVersionOptions = {}
): Promise<TLessonLanguage> {
  try {
    // Verify lesson exists
    const lesson = await getLessonById(lessonId);
    if (!lesson) {
      throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
    }

    const content = sanitizeOptionalHtml(data.content);
    const intent = options.versionIntent ?? 'auto';

    // One transaction so a failed snapshot can't leave the content committed
    // without its history entry, and vice versa.
    const language = await db.transaction(async (tx) => {
      const saved = await upsertLessonLanguage({ ...data, content, lessonId }, tx);

      await recordLessonLanguageVersion({
        lessonLanguageId: saved.id,
        content: saved.content,
        authorId: options.authorId ?? null,
        intent,
        label: options.versionLabel ?? null,
        dbClient: tx
      });

      return saved;
    });

    if (lesson.courseId) {
      await touchCourseUpdatedAt(lesson.courseId);
    }

    return language;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create or update lesson language',
      ErrorCodes.LESSON_LANGUAGE_CREATE_FAILED,
      500
    );
  }
}

/**
 * Updates a lesson language translation
 * @param lessonId - The lesson ID
 * @param locale - The locale
 * @param data - Lesson language update data
 * @returns Updated lesson language
 */
export async function updateLessonLanguageService(
  lessonId: string,
  locale: TLocale,
  data: Partial<TNewLessonLanguage>,
  options: LessonVersionOptions = {}
): Promise<TLessonLanguage> {
  try {
    // Verify lesson exists
    const lesson = await getLessonById(lessonId);
    if (!lesson) {
      throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
    }

    const existing = await getLessonLanguageByLessonIdAndLocale(lessonId, locale);
    if (!existing) {
      throw new AppError('Lesson language not found', ErrorCodes.LESSON_LANGUAGE_NOT_FOUND, 404);
    }

    const content = sanitizeOptionalHtml(data.content);
    const intent = options.versionIntent ?? 'auto';
    const isContentWrite = data.content !== undefined;

    const language = await db.transaction(async (tx) => {
      const saved = await updateLessonLanguage(lessonId, locale, { ...data, content }, tx);

      // A metadata-only update is not a content change, so it earns no snapshot.
      if (isContentWrite) {
        await recordLessonLanguageVersion({
          lessonLanguageId: saved.id,
          content: saved.content,
          authorId: options.authorId ?? null,
          intent,
          label: options.versionLabel ?? null,
          dbClient: tx
        });
      }

      return saved;
    });

    if (lesson.courseId) {
      await touchCourseUpdatedAt(lesson.courseId);
    }

    return language;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update lesson language',
      ErrorCodes.LESSON_LANGUAGE_UPDATE_FAILED,
      500
    );
  }
}

export async function deleteLessonLanguageService(lessonId: string, locale: TLocale): Promise<TLessonLanguage> {
  try {
    const lesson = await getLessonById(lessonId);
    if (!lesson) {
      throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
    }

    const existing = await getLessonLanguageByLessonIdAndLocale(lessonId, locale);
    if (!existing) {
      throw new AppError('Lesson language not found', ErrorCodes.LESSON_LANGUAGE_NOT_FOUND, 404);
    }

    const deleted = await deleteLessonLanguage(lessonId, locale);
    if (!deleted) {
      throw new AppError('Lesson language not found', ErrorCodes.LESSON_LANGUAGE_NOT_FOUND, 404);
    }

    if (lesson.courseId) {
      await touchCourseUpdatedAt(lesson.courseId);
    }

    return deleted;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete lesson language',
      ErrorCodes.LESSON_LANGUAGE_DELETE_FAILED,
      500
    );
  }
}
