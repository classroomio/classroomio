import type { Course, Lesson, LessonComment, LessonCompletion, LessonPage, LessonSection } from '$lib/utils/types';
import type { Updater, Writable } from 'svelte/store';
import {
  createLesson,
  createLessonSection,
  deleteLesson,
  deleteLessonSection,
  updateLesson,
  updateLessonSection
} from '$lib/utils/services/courses';

import { LOCALE } from '$lib/utils/types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { lessonValidation } from '$lib/utils/functions/validator';
import { snackbar } from '$lib/components/Snackbar/store';
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
  uploadedDocument: null,
  uploadProgress: 0
});

export const lessons: Writable<Lesson[]> = writable([]);

export const lessonSections: Writable<LessonSection[]> = writable([]);

export const lessonCommentsChannel: Writable<RealtimeChannel> = writable();

export const lesson = writable<LessonPage>({
  id: null,
  locale: LOCALE.EN,
  title: '',
  totalExercises: 0,
  totalComments: 0,
  isSaving: false,
  isFetching: false,
  materials: {
    note: '',
    slide_url: '',
    videos: [],
    documents: []
  },
  exercises: [],
  lesson_completion: []
});

export const lessonByTranslation = writable<{
  [key: string]: Record<LOCALE, string>;
}>({});

export const lessonComments = writable<LessonComment[]>([]);

export const isLessonDirty = writable(false);

export function setLesson({
  id,
  lessonData,
  locale,
  totalExercises,
  totalComments
}: {
  id: string;
  lessonData: Lesson & { lesson_language: { locale: LOCALE; content: string }[] };
  locale: LOCALE;
  totalExercises: number;
  totalComments: number;
}) {
  if (!lessonData) return;

  let lesson_completion: LessonCompletion[] = [];

  if (Array.isArray(lessonData.lesson_completion)) {
    lesson_completion = [...lessonData.lesson_completion];
  }

  lesson.update((l) => ({
    ...l,
    id: id,
    title: lessonData.title,
    totalExercises,
    totalComments: totalComments,
    materials: {
      videos: lessonData.videos || [],
      note: lessonData.note,
      slide_url: lessonData.slide_url,
      documents: lessonData.documents || []
    },
    lesson_completion,
    exercises: [],
    locale: locale
  }));

  if (Array.isArray(lessonData.lesson_language)) {
    lessonByTranslation.update((lessLocales) => {
      return {
        ...lessLocales,
        [id]: lessonData.lesson_language.reduce(
          (acc, cur) => {
            acc[cur.locale] = cur.content;
            return acc;
          },
          {} as Record<LOCALE, string>
        )
      };
    });
  }
}

export function handleAddLesson() {
  lessons.update((_lessons) => {
    const newLesson = {
      id: '',
      title: 'Untitled lesson',
      lesson_at: new Date().toDateString(),
      is_unlocked: false,
      course_id: '',
      created_at: new Date().toDateString(),
      lesson_completion: []
    } as Lesson;

    return [..._lessons, newLesson];
  });
}

export async function handleDelete(lessonId: Lesson['id'] | undefined) {
  // Need to implement soft delete
  if (!lessonId) {
    return;
  }
  const { error } = await deleteLesson(lessonId);

  if (error) {
    snackbar.error(error.message);
    return console.error('Error deleting course', error);
  }

  lessons.update((_lessons) => _lessons.filter((lesson) => lesson.id !== lessonId));
  lessonSections.update((_sections) =>
    _sections.map((section) => {
      section.lessons = section.lessons.filter((lesson) => lesson.id !== lessonId);
      return section;
    })
  );

  snackbar.success('snackbar.generic.success_delete');

  console.log(`lessonId`, lessonId);
}

export async function handleDeleteSection(sectionId: LessonSection['id'] | undefined) {
  // Need to implement soft delete
  if (!sectionId) {
    return;
  }
  const { error } = await deleteLessonSection(sectionId);

  if (error) {
    snackbar.error(error.message);
    return console.error('Error deleting course', error);
  }

  lessonSections.update((_sections) => _sections.filter((section) => section.id !== sectionId));
  lessons.update((_lessons) => _lessons.filter((lesson) => lesson.section_id !== sectionId));

  snackbar.success('snackbar.generic.success_delete');

  console.log(`sectionId`, sectionId);
}

export async function handleSaveLesson(lesson: Lesson, courseId: Course['id']) {
  const result = lessonValidation(lesson);

  if (Object.keys(result).length) {
    return result;
  }

  console.log(`handleSaveLesson lesson`, lesson);
  const newLesson = {
    title: lesson.title,
    lesson_at: lesson?.lesson_at,
    call_url: lesson?.call_url,
    teacher_id: lesson?.profile ? lesson?.profile.id : undefined,
    course_id: courseId,
    is_unlocked: lesson.is_unlocked,
    section_id: lesson.section_id
  };

  let newLessonData: Lesson | null | undefined = null;

  if (lesson.id) {
    // No need to get the result of update cause we have all in local state
    await updateLesson(newLesson, lesson.id);
  } else {
    const { data } = await createLesson(newLesson);

    newLessonData = data?.[0];
  }
  return newLessonData;
}
export async function handleSaveLessonSection(section: Partial<LessonSection>, courseId: Course['id']) {
  const result = lessonValidation(section);

  if (Object.keys(result).length) {
    return result;
  }
  console.log(`handleSaveLessonSection lesson`, section);

  const newSection: Partial<LessonSection> = {
    id: section.id,
    title: section.title,
    course_id: courseId
  };

  let newSectionData: any[] | null = null;

  if (newSection.id) {
    // No need to get the result of update cause we have all in local state
    await updateLessonSection(newSection, newSection.id);
  } else {
    const { data } = await createLessonSection(newSection);

    newSectionData = data;
  }

  return newSectionData;
}

export async function handleUpdateLessonMaterials(lesson: any, lessonId: Lesson['id']) {
  const materials = {
    ...lesson.materials
  };
  delete materials.lesson_completion;
  delete materials.profile;

  return await updateLesson(materials, lessonId);
}

export const deleteLessonVideo = (index: any) => {
  lesson.update((currentLesson) => ({
    ...currentLesson,
    materials: {
      ...currentLesson.materials,
      videos: currentLesson.materials.videos.filter((video, i) => i !== index)
    }
  }));
};

export const deleteLessonDocument = (index: any) => {
  lesson.update((currentLesson) => ({
    ...currentLesson,
    materials: {
      ...currentLesson.materials,
      documents: (currentLesson.materials.documents || []).filter((document, i) => i !== index)
    }
  }));
};

export function resetDocumentUploadStore() {
  lessonDocUpload.set({
    isUploading: false,
    isModalOpen: false,
    uploadProgress: 0,
    uploadedDocument: null,
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
