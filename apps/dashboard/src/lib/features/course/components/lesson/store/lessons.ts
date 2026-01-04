import type { Lesson, LessonSection, ListLessons } from '$features/course/utils/types';

import type { Course } from '$features/course/types';
import { courseApi } from '$features/course/api';
import { lessonApi } from '$features/course/api';
import { lessonValidation } from '$lib/utils/functions/validator';
import { snackbar } from '$features/ui/snackbar/store';
import { writable } from 'svelte/store';

export const lessonVideoUpload = writable({
  error: null as string | null,
  isCancelled: false,
  isModalOpen: false,
  isUploading: false,
  uploadProgress: 0
});

export const lessonDocUpload = writable({
  error: null as string | null,
  isCancelled: false,
  isModalOpen: false,
  isUploading: false,
  uploadProgress: 0
});

export async function handleDelete(lessonId: Lesson['id'] | undefined) {
  // Need to implement soft delete
  if (!lessonId) {
    return;
  }
  const courseId = courseApi.course?.id;
  if (!courseId) return;

  await lessonApi.delete(courseId, lessonId);

  if (lessonApi.success) {
    lessonApi.lessons = lessonApi.lessons.filter((lesson) => lesson.id !== lessonId);
    lessonApi.sections = lessonApi.sections.map((section) => {
      section.lessons = section.lessons.filter((lesson) => lesson.id !== lessonId);
      return section;
    });

    snackbar.success('snackbar.generic.success_delete');
  }
}

export async function handleSaveLesson(lesson: Partial<ListLessons[number]>, courseId: Course['id']) {
  const result = lessonValidation(lesson);

  if (Object.keys(result).length) {
    return { validationRes: result, lesson: null };
  }

  const lessonData = {
    title: lesson.title || '',
    lessonAt: lesson.lessonAt!,
    callUrl: lesson.callUrl!,
    teacherId: lesson.teacherId!,
    isUnlocked: lesson.isUnlocked!,
    sectionId: lesson.sectionId!
  };

  if (lesson.id) {
    await lessonApi.update(courseId, lesson.id, lessonData);
    if (lessonApi.success && lessonApi.lesson) {
      return { lesson: lessonApi.lesson as Lesson };
    }
  } else {
    await lessonApi.create(courseId, { ...lessonData, courseId });
    if (lessonApi.success && lessonApi.lesson) {
      return { lesson: lessonApi.lesson as Lesson };
    }
  }
  return { validationRes: null, lesson: null };
}
export async function handleSaveLessonSection(section: Partial<LessonSection>, courseId: Course['id']) {
  const result = lessonValidation(section);

  if (Object.keys(result).length) {
    return result;
  }

  const sectionData = {
    title: section.title!
  };

  if (section.id) {
    await lessonApi.updateSection(courseId, section.id, sectionData);
    if (lessonApi.success && lessonApi.lesson) {
      return [lessonApi.lesson];
    }
  } else {
    await lessonApi.createSection(courseId, { ...sectionData, courseId });
    if (lessonApi.success && lessonApi.lesson) {
      return [lessonApi.lesson];
    }
  }

  return null;
}

export function resetDocumentUploadStore() {
  lessonDocUpload.set({
    isUploading: false,
    isModalOpen: false,
    uploadProgress: 0,
    error: null,
    isCancelled: false
  });
}

export function cancelDocumentUpload() {
  lessonDocUpload.update((store) => ({
    ...store,
    isCancelled: true,
    isUploading: false,
    error: 'Upload cancelled by user'
  }));
}

export function cancelVideoUpload() {
  lessonVideoUpload.update((store) => ({
    ...store,
    isCancelled: true,
    isUploading: false
  }));
}
