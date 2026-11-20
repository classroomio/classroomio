import type { LearningPackage } from '@cio/course-builder';

import { reorderCourseContent } from '../course/content';
import { createCourse } from '../course/course';
import {
  createCourseImportDraftService,
  publishCourseImportDraftToExistingCourseService
} from '../course-import/course-import';
import { listExercises } from '../exercise/exercise';
import { listLessons } from '../lesson/lesson';
import { toCourseImportDraft } from './export';

export interface PublishPackageCourseInput {
  organizationId: string;
  profileId: string;
  pkg: LearningPackage;
  courseKey: string;
  /** Makes the draft idempotent: publishing the same course again reuses its draft. */
  idempotencyKey: string;
  /** A course an earlier attempt already created; it is filled again instead of creating another. */
  existingCourseId?: string | null;
  /** Called once the course exists, before it is filled, so a retry can pass it back as `existingCourseId`. */
  onCourseCreated?: (courseId: string) => Promise<void>;
}

export interface PublishedPackageCourse {
  courseId: string;
  courseImportDraftId: string;
  sections: number;
  lessons: number;
  exercises: number;
  warnings: unknown[];
}

/**
 * The import numbers a section's exercises apart from its lessons, while the outline sorts both together, so each
 * section check would show after the section's first lesson. Puts every section's exercises after its lessons.
 */
async function moveChecksAfterLessons(courseId: string): Promise<void> {
  const [lessons, exercises] = await Promise.all([listLessons(courseId), listExercises(courseId)]);
  const byOrder = (left: { order: unknown }, right: { order: unknown }) => Number(left.order) - Number(right.order);
  const sectionIds = [...new Set(lessons.map((lesson) => lesson.sectionId).filter((id): id is string => !!id))];
  const items = sectionIds.flatMap((sectionId) => {
    const sectionLessons = lessons.filter((lesson) => lesson.sectionId === sectionId).sort(byOrder);
    const sectionExercises = exercises.filter((exercise) => exercise.sectionId === sectionId).sort(byOrder);

    return [
      ...sectionLessons.map((lesson, index) => ({
        id: lesson.id,
        type: 'LESSON' as const,
        sectionId,
        order: index + 1
      })),
      ...sectionExercises.map((exercise, index) => ({
        id: exercise.id,
        type: 'EXERCISE' as const,
        sectionId,
        order: sectionLessons.length + index + 1
      }))
    ];
  });
  if (items.length) await reorderCourseContent(courseId, { items });
}

/**
 * Creates one course of a learning package in an organisation, unpublished: saves its course import draft
 * (`sourceType: 'website'`), creates the course, fills it from the draft, then moves each section check after its
 * section's lessons.
 */
export async function publishPackageCourse(input: PublishPackageCourseInput): Promise<PublishedPackageCourse> {
  const draft = toCourseImportDraft(input.pkg, input.courseKey);
  const sourceArtifacts = input.pkg.report.sources.map((source) => ({ type: 'website' as const, label: source.url }));
  const saved = await createCourseImportDraftService(input.organizationId, input.profileId, {
    sourceType: 'website',
    idempotencyKey: input.idempotencyKey,
    draft,
    sourceArtifacts
  });

  let courseId = input.existingCourseId ?? null;
  if (!courseId) {
    const { course } = await createCourse(
      input.profileId,
      {
        title: draft.course.title,
        description: draft.course.description,
        type: 'SELF_PACED',
        organizationId: input.organizationId
      },
      'dashboard'
    );
    courseId = course.id;
    await input.onCourseCreated?.(courseId);
  }

  await publishCourseImportDraftToExistingCourseService(input.organizationId, saved.id, {
    courseId,
    syncMode: 'merge'
  });
  await moveChecksAfterLessons(courseId);

  return {
    courseId,
    courseImportDraftId: saved.id,
    sections: draft.sections.length,
    lessons: draft.lessons.length,
    exercises: draft.exercises?.length ?? 0,
    warnings: draft.warnings
  };
}
