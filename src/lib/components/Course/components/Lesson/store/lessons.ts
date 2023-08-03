import { writable } from 'svelte/store';
import type { Writable, Updater } from 'svelte/store';
import { createLesson, updateLesson, deleteLesson } from '$lib/utils/services/courses';

import type { Lesson, Course } from '$lib/utils/types';

export const lessons: Writable<Lesson[]> = writable([]);
export const lesson = writable({
  id: null,
  totalExercises: 0,
  is_complete: false,
  materials: {
    note: null,
    slide_url: null,
    video_url: null
  },
  exercises: []
});
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
        is_unlocked: false,
        is_complete: false
      }
    ];
  }) as Updater<any>);
}

export function handleDelete(lessonId: Lesson['id']) {
  return async () => {
    // Need to implement soft delete
    if (lessonId) {
      const { error } = await deleteLesson(lessonId);

      if (error) {
        return alert('Please delete all exercises first');
      }
    }

    lessons.update((_lessons) => _lessons.filter((lesson) => lesson.id !== lessonId));
    console.log(`lessonId`, lessonId);
  };
}

export async function handleSaveLesson(lesson: Lesson, course_id: Course['id']) {
  console.log(`handleSaveLesson lesson`, lesson);
  const newLesson = {
    title: lesson.title,
    lesson_at: lesson.lesson_at,
    call_url: lesson.call_url,
    teacher_id: lesson.profile ? lesson.profile.id : undefined,
    course_id,
    is_unlocked: lesson.is_unlocked,
    is_complete: lesson.is_complete
  };

  let newLessonData: any[] | null = null;

  if (typeof lesson.id === 'string') {
    // No need to get the result of update cause we have all in local state
    await updateLesson(newLesson, lesson.id);
  } else {
    const { data } = await createLesson(newLesson);

    newLessonData = data;
  }

  lessons.update((l) =>
    l.map((_lesson) => {
      if (!_lesson.id && newLessonData) {
        _lesson.id = newLessonData[0].id;
      } else if (typeof lesson.id === 'string' && lesson.id === _lesson.id) {
        return { ..._lesson, is_complete: lesson.is_complete };
      }

      return _lesson;
    })
  );
}

export async function handleUpdateLessonMaterials(lesson: any, lessonId: Lesson['id']) {
  const materials = {
    ...lesson.materials
  };

  delete materials.totalExercises;

  return await updateLesson(materials, lessonId);
}
