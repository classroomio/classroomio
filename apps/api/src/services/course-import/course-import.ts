import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  createCourseImportDraft,
  getCourseImportDraftById,
  getCourseImportDraftByIdempotencyKey,
  updateCourseImportDraft
} from '@cio/db/queries/course-import';
import type { TCourseImportDraft, TLocale } from '@db/types';
import type {
  TCourseImportDraftCreate,
  TCourseImportDraftPayload,
  TCourseImportDraftPublish,
  TCourseImportDraftUpdate
} from '@cio/utils/validation/course-import';
import { ZCourseImportDraftPayload } from '@cio/utils/validation/course-import';
import { createCourse, updateCourse } from '@api/services/course/course';
import { createCourseSection } from '@api/services/course/section';
import { createLesson } from '@api/services/lesson';
import { upsertLessonLanguageService } from '@api/services/lesson-language';

type DraftSummary = {
  sectionCount: number;
  lessonCount: number;
  localeCount: number;
  warningCount: number;
};

function buildDraftSummary(draft: TCourseImportDraftPayload): DraftSummary {
  return {
    sectionCount: draft.sections.length,
    lessonCount: draft.lessons.length,
    localeCount: new Set(draft.lessonLanguages.map((item) => item.locale)).size,
    warningCount: draft.warnings.length
  };
}

function parseStoredDraft(record: TCourseImportDraft): TCourseImportDraftPayload {
  return ZCourseImportDraftPayload.parse(record.draft);
}

export async function createCourseImportDraftService(orgId: string, profileId: string, data: TCourseImportDraftCreate) {
  try {
    if (data.idempotencyKey) {
      const existing = await getCourseImportDraftByIdempotencyKey(orgId, data.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    return await createCourseImportDraft({
      organizationId: orgId,
      createdByProfileId: profileId,
      sourceType: data.sourceType,
      status: 'DRAFT',
      title: data.draft.course.title,
      locale: data.draft.course.locale,
      idempotencyKey: data.idempotencyKey,
      summary: {
        ...buildDraftSummary(data.draft),
        ...(data.summary ?? {})
      },
      draft: data.draft,
      warnings: data.draft.warnings,
      sourceArtifacts: data.sourceArtifacts ?? data.draft.sourceReferences ?? []
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create course import draft',
      ErrorCodes.COURSE_IMPORT_CREATE_FAILED,
      500
    );
  }
}

export async function getCourseImportDraftService(orgId: string, draftId: string) {
  try {
    const draft = await getCourseImportDraftById(orgId, draftId);
    if (!draft) {
      throw new AppError('Course import draft not found', ErrorCodes.COURSE_IMPORT_DRAFT_NOT_FOUND, 404);
    }

    return draft;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch course import draft',
      ErrorCodes.COURSE_IMPORT_FETCH_FAILED,
      500
    );
  }
}

export async function updateCourseImportDraftService(orgId: string, draftId: string, data: TCourseImportDraftUpdate) {
  try {
    const existing = await getCourseImportDraftService(orgId, draftId);

    if (existing.status === 'PUBLISHED') {
      throw new AppError('Published drafts cannot be edited', ErrorCodes.FORBIDDEN, 403);
    }

    const nextDraft = data.draft ?? parseStoredDraft(existing);
    const nextWarnings = data.warnings ?? nextDraft.warnings;
    const updated = await updateCourseImportDraft(orgId, draftId, {
      title: nextDraft.course.title,
      locale: nextDraft.course.locale,
      draft: nextDraft,
      warnings: nextWarnings,
      summary: {
        ...(existing.summary ?? {}),
        ...buildDraftSummary(nextDraft),
        ...(data.summary ?? {})
      },
      sourceArtifacts: data.sourceArtifacts ?? existing.sourceArtifacts
    });

    if (!updated) {
      throw new AppError('Course import draft not found', ErrorCodes.COURSE_IMPORT_DRAFT_NOT_FOUND, 404);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update course import draft',
      ErrorCodes.COURSE_IMPORT_UPDATE_FAILED,
      500
    );
  }
}

export async function publishCourseImportDraftService(
  orgId: string,
  profileId: string,
  draftId: string,
  overrides: TCourseImportDraftPublish
) {
  try {
    const existing = await getCourseImportDraftService(orgId, draftId);

    if (existing.status === 'PUBLISHED' && existing.publishedCourseId) {
      return {
        courseId: existing.publishedCourseId,
        createdSections: 0,
        createdLessons: 0,
        localeCount: 0
      };
    }

    const draft = parseStoredDraft(existing);
    const courseTitle = overrides.title ?? draft.course.title;
    const courseDescription = overrides.description ?? draft.course.description;
    const courseType = overrides.type ?? draft.course.type;
    const courseMetadata = overrides.metadata ?? draft.course.metadata;

    const sectionExternalIds = new Set(draft.sections.map((section) => section.externalId));
    draft.lessons.forEach((lesson) => {
      if (!sectionExternalIds.has(lesson.sectionExternalId)) {
        throw new AppError(`Lesson "${lesson.title}" references an unknown section`, ErrorCodes.VALIDATION_ERROR, 400);
      }
    });

    const courseResult = await createCourse(profileId, {
      title: courseTitle,
      description: courseDescription,
      type: courseType,
      organizationId: orgId
    });

    const courseId = courseResult.course.id;

    if (courseMetadata) {
      await updateCourse(courseId, { metadata: courseMetadata });
    }

    const sectionIdMap = new Map<string, string>();
    for (const section of [...draft.sections].sort((a, b) => a.order - b.order)) {
      const createdSection = await createCourseSection(courseId, {
        courseId,
        title: section.title,
        order: section.order
      });

      sectionIdMap.set(section.externalId, createdSection.id);
    }

    const lessonIdMap = new Map<string, string>();
    for (const lesson of [...draft.lessons].sort((a, b) => a.order - b.order)) {
      const sectionId = sectionIdMap.get(lesson.sectionExternalId);
      if (!sectionId) {
        throw new AppError('Referenced section was not created', ErrorCodes.VALIDATION_ERROR, 400);
      }

      const createdLesson = await createLesson(courseId, {
        courseId,
        title: lesson.title,
        sectionId,
        order: lesson.order,
        isUnlocked: lesson.isUnlocked,
        public: lesson.public
      });

      lessonIdMap.set(lesson.externalId, createdLesson.id);
    }

    for (const lessonLanguage of draft.lessonLanguages) {
      const lessonId = lessonIdMap.get(lessonLanguage.lessonExternalId);
      if (!lessonId) {
        throw new AppError('Referenced lesson was not created', ErrorCodes.VALIDATION_ERROR, 400);
      }

      await upsertLessonLanguageService(lessonId, {
        locale: lessonLanguage.locale as TLocale,
        content: lessonLanguage.content
      });
    }

    await updateCourseImportDraft(orgId, draftId, {
      status: 'PUBLISHED',
      publishedCourseId: courseId,
      summary: {
        ...(existing.summary ?? {}),
        ...buildDraftSummary(draft),
        publishedCourseId: courseId
      }
    });

    return {
      courseId,
      createdSections: sectionIdMap.size,
      createdLessons: lessonIdMap.size,
      localeCount: new Set(draft.lessonLanguages.map((item) => item.locale)).size
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to publish course import draft',
      ErrorCodes.COURSE_IMPORT_PUBLISH_FAILED,
      500
    );
  }
}
