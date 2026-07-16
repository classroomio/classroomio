import { AppError, ErrorCodes } from '@api/utils/errors';
import { createCourse } from '@cio/core/services/course/course';
import { createCourseSection } from '@cio/core/services/course/section';
import { createLesson } from '@cio/core/services/lesson/lesson';
import { sanitizeHtml } from '@cio/core/utils/sanitize-html';
import { getNoteById, updateNote } from '@cio/db/queries/notes';
import type { TConvertNoteToCourse } from '@cio/utils/validation/notes';
import { assertNoteWriteAccess, isOrgTeamRole } from './access';

async function getWritableWorkspaceNote(organizationId: string, userId: string, roleId: number, noteId: string) {
  const note = await getNoteById(noteId);

  if (!note || note.organizationId !== organizationId) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  if (!isOrgTeamRole(roleId)) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  assertNoteWriteAccess({ note, organizationId, userId });

  return note;
}

export async function convertNoteToCourseService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  data: TConvertNoteToCourse
) {
  const note = await getWritableWorkspaceNote(organizationId, userId, roleId, noteId);

  if (note.origin !== 'workspace') {
    throw new AppError('Only workspace notes can be converted to courses', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (note.isTemplate) {
    throw new AppError('Templates cannot be converted to courses', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const totalLessons =
    data.unsectionedLessons.length + data.sections.reduce((count, section) => count + section.lessons.length, 0);

  if (totalLessons === 0) {
    throw new AppError('Add at least one lesson before creating a course', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const { course } = await createCourse(userId, {
    title: data.courseTitle.trim(),
    description: '',
    type: 'SELF_PACED',
    organizationId
  });

  let lessonOrder = 0;

  for (const lesson of data.unsectionedLessons) {
    await createLesson(course.id, {
      title: lesson.title.trim(),
      note: sanitizeHtml(lesson.content),
      courseId: course.id,
      order: lessonOrder
    });
    lessonOrder += 1;
  }

  for (const [sectionIndex, section] of data.sections.entries()) {
    const createdSection = await createCourseSection(course.id, {
      title: section.title.trim(),
      courseId: course.id,
      order: sectionIndex
    });

    for (const [lessonIndex, lesson] of section.lessons.entries()) {
      await createLesson(course.id, {
        title: lesson.title.trim(),
        note: sanitizeHtml(lesson.content),
        courseId: course.id,
        sectionId: createdSection.id,
        order: lessonIndex
      });
    }
  }

  await updateNote(noteId, {
    convertedCourseId: course.id,
    updatedAt: new Date().toISOString()
  });

  return {
    courseId: course.id,
    courseSlug: course.slug,
    lessonCount: totalLessons,
    sectionCount: data.sections.length
  };
}
