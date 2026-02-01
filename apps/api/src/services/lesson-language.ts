import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TLessonLanguage, TLocale, TNewLessonLanguage } from '@db/types';
import {
  getLessonLanguageByLessonIdAndLocale,
  getLessonLanguagesByLessonId,
  updateLessonLanguage,
  upsertLessonLanguage
} from '@cio/db/queries/lesson/language';

import { getLessonById } from '@cio/db/queries/lesson/lesson';

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
  data: Omit<TNewLessonLanguage, 'lessonId'>
): Promise<TLessonLanguage> {
  try {
    // Verify lesson exists
    const lesson = await getLessonById(lessonId);
    if (!lesson) {
      throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
    }

    const language = await upsertLessonLanguage({
      ...data,
      lessonId
    });

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
  data: Partial<TNewLessonLanguage>
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

    const language = await updateLessonLanguage(lessonId, locale, data);
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
