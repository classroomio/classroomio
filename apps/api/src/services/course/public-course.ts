import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  generateTranscriptVttPresignedUrl,
  generateVideoDownloadPresignedUrls,
  TRANSCRIPT_VTT_PRESIGN_SECONDS
} from '@api/utils/s3';
import { fetchQuestionsAndOptions, transformQuestions } from '@api/services/exercise/utils';
import { getMediaTranscriptByAsset } from '@cio/db/queries';
import { getAssetsByIds } from '@cio/db/queries/assets';
import {
  getCourseRowBySlug,
  getPublicCourseItem as getPublicCourseItemQuery,
  getPublicCourseTreeBySlug,
  type PublicCourseItemContent,
  type PublicCourseTree
} from '@cio/db/queries/course';
import { getExerciseWithRelationsOptimized } from '@cio/db/queries/exercise';
import { getExerciseSectionsByExerciseId } from '@cio/db/queries/exercise/exercise-section';

/**
 * Anonymous-safe: fetch the full tree for a published public course by slug.
 * Callers should return 404 when this resolves to `null`.
 */
export async function getPublicCourseTreeService(courseSlug: string): Promise<PublicCourseTree | null> {
  try {
    return await getPublicCourseTreeBySlug(courseSlug);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to load public course', ErrorCodes.COURSE_FETCH_FAILED, 500);
  }
}

export type PublicItemResponse =
  | (Omit<Extract<PublicCourseItemContent, { kind: 'lesson' }>, 'courseOrganizationId'> & { kind: 'lesson' })
  | (Extract<PublicCourseItemContent, { kind: 'exercise' }> & {
      kind: 'exercise';
      questions: PublicExercisePayload;
    });

export interface PublicExercisePayload {
  unsectioned: PublicExerciseQuestion[];
  sections: Array<{
    id: string;
    title: string;
    description: string | null;
    order: number;
    colorTheme: string;
    afterBehavior: unknown;
    questions: PublicExerciseQuestion[];
  }>;
}

export interface PublicExerciseQuestion {
  id: number | string;
  title: string;
  questionTypeId: number;
  questionTypeKey: string;
  points: number;
  order: number | null;
  settings: Record<string, unknown>;
  options: Array<{
    id: number | string;
    label: string;
    /** Answer keys are intentionally shipped to the client for PUBLIC courses. */
    isCorrect: boolean;
    settings: Record<string, unknown>;
  }>;
}

/**
 * Anonymous-safe: fetch a single lesson or exercise by its per-course slug.
 * For exercises, questions + options are returned with answer keys included
 * because PUBLIC courses grade entirely on the client.
 */
export async function getPublicCourseItemService(
  courseSlug: string,
  itemSlug: string
): Promise<PublicItemResponse | null> {
  try {
    const baseItem = await getPublicCourseItemQuery(courseSlug, itemSlug);
    if (!baseItem) return null;

    if (baseItem.kind === 'lesson') {
      const { courseOrganizationId, ...lesson } = baseItem;

      let video = lesson.video;

      if (video?.type === 'upload') {
        let storageKey: string | undefined;

        if (video.assetId) {
          const assets = await getAssetsByIds([video.assetId], courseOrganizationId ?? undefined);
          storageKey = assets[0]?.storageKey ?? undefined;
        }

        if (!storageKey && video.key) {
          storageKey = video.key;
        }

        if (storageKey) {
          const urls = await generateVideoDownloadPresignedUrls([storageKey]);
          const signedLink = urls[storageKey];

          if (signedLink) {
            const { key: _omitKey, ...rest } = video;
            video = { ...rest, link: signedLink };
          }
        }
      }

      if (video?.assetId && courseOrganizationId) {
        const transcriptRow = await getMediaTranscriptByAsset(video.assetId, courseOrganizationId);
        let transcript: {
          vttUrl: string;
          vttUrlExpiresAt: string;
          language: string;
        } | null = null;

        if (transcriptRow) {
          const vttUrl = await generateTranscriptVttPresignedUrl(transcriptRow.vttStorageKey, transcriptRow.vttBucket);
          transcript = {
            vttUrl,
            vttUrlExpiresAt: new Date(Date.now() + TRANSCRIPT_VTT_PRESIGN_SECONDS * 1000).toISOString(),
            language: transcriptRow.language
          };
        }

        video = { ...video, transcript };
      }

      if (video?.key !== undefined) {
        const { key: _omitS3Key, ...withoutKey } = video;
        video = withoutKey;
      }

      return { ...lesson, video };
    }

    if (!baseItem.isUnlocked) {
      return {
        ...baseItem,
        questions: {
          unsectioned: [],
          sections: []
        }
      };
    }

    const { exercise, questions } = await getExerciseWithRelationsOptimized(baseItem.id);
    const questionTypeMap = new Map(questions.map((question) => [question.questionType.id, question.questionType]));
    const allOptions = questions.flatMap((question) => question.options ?? []);
    const strippedQuestions = questions.map(({ questionType: _type, options: _options, ...rest }) => rest);
    const transformed = transformQuestions(strippedQuestions, allOptions, questionTypeMap);
    const sectionRows = await getExerciseSectionsByExerciseId(exercise.id);

    const sectionMap = new Map(sectionRows.map((section) => [section.id, section]));
    const unsectioned: PublicExerciseQuestion[] = [];
    const sectionBuckets = new Map<string, PublicExerciseQuestion[]>();

    for (const question of transformed) {
      // `transformQuestions` only keeps `{ id, label }` on `question.questionType`, so the DB
      // `typename` (e.g. RADIO) must come from the map built before stripping relations.
      const questionTypeRow = questionTypeMap.get(question.questionTypeId);
      const payloadQuestion: PublicExerciseQuestion = {
        id: question.id,
        title: question.title ?? '',
        questionTypeId: question.questionTypeId,
        questionTypeKey: questionTypeRow?.typename ?? '',
        points: question.points ?? 0,
        order: typeof question.order === 'number' ? question.order : null,
        settings: (question.settings ?? {}) as Record<string, unknown>,
        options: (question.options ?? []).map((option) => ({
          id: option.id,
          label: option.label ?? '',
          isCorrect: option.isCorrect ?? false,
          settings: (option.settings ?? {}) as Record<string, unknown>
        }))
      };

      const sectionId = question.exerciseSectionId ?? null;
      if (sectionId && sectionMap.has(sectionId)) {
        const bucket = sectionBuckets.get(sectionId) ?? [];
        bucket.push(payloadQuestion);
        sectionBuckets.set(sectionId, bucket);
      } else {
        unsectioned.push(payloadQuestion);
      }
    }

    const sections = sectionRows.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      order: Number(section.order),
      colorTheme: section.colorTheme,
      afterBehavior: section.afterBehavior,
      questions: sectionBuckets.get(section.id) ?? []
    }));

    return {
      ...baseItem,
      questions: {
        unsectioned,
        sections
      }
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('getPublicCourseItemService error:', error);
    throw new AppError('Failed to load public course item', ErrorCodes.COURSE_FETCH_FAILED, 500);
  }
}

/**
 * Resolve a course slug to the backing course row with minimal fields. Used by
 * rate limiting / logging that need the course id without the full tree.
 */
export async function resolvePublicCourseBySlug(courseSlug: string) {
  return getCourseRowBySlug(courseSlug);
}
