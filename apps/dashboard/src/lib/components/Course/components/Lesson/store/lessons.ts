import { writable } from 'svelte/store';
import type { Writable, Updater } from 'svelte/store';
import { createLesson, updateLesson, deleteLesson } from '$lib/utils/services/courses';
import type { Lesson, Course, LessonPage, LessonComment } from '$lib/utils/types';
import { LOCALE } from '$lib/utils/types';
import { snackbar } from '$lib/components/Snackbar/store';
import { lessonValidation } from '$lib/utils/functions/validator';

export const uploadCourseVideoStore = writable({
  isModalOpen: false
});

export const lessons: Writable<Lesson[]> = writable([]);

export const lesson = writable<LessonPage>({
  id: null,
  locale: LOCALE.EN,
  totalExercises: 0,
  totalComments: 0,
  isSaving: false,
  isFetching: false,
  materials: {
    note: '',
    slide_url: '',
    videos: []
  },
  exercises: [],
  lesson_completion: []
});

export const lessonByTranslation = writable<{
  [key: string]: Record<LOCALE, string>;
}>({});

export const lessonComments = writable<LessonComment[]>([]);

export const isLessonDirty = writable(false);

export function handleAddLesson() {
  lessons.update(((_lessons) => {
    return [
      ..._lessons,
      {
        id: null,
        title: 'Untitled lesson',
        // profile: undefined,
        call_url: undefined,
        lesson_at: new Date(),
        is_unlocked: false
      }
    ];
  }) as Updater<any>);
}

export async function handleDelete(lessonId: Lesson['id'] | undefined) {
  // Need to implement soft delete
  if (lessonId) {
    const { error } = await deleteLesson(lessonId);

    if (error) {
      snackbar.error(error.message);
      return console.error('Error deleting course', error);
    }

    lessons.update((_lessons) => _lessons.filter((lesson) => lesson.id !== lessonId));
  }

  console.log(`lessonId`, lessonId);
}

export async function handleSaveLesson(lesson: Lesson, course_id: Course['id']) {
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
    course_id,
    is_unlocked: lesson.is_unlocked
  };

  let newLessonData: any[] | null = null;

  if (typeof lesson.id === 'string') {
    // No need to get the result of update cause we have all in local state
    await updateLesson(newLesson, lesson.id);
  } else {
    const { data } = await createLesson(newLesson);

    newLessonData = data;
  }
  return newLessonData;
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
