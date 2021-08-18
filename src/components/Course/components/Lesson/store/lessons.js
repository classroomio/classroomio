import { writable } from 'svelte/store';
import {
  createLesson,
  updateLesson,
  deleteLesson,
} from '../../../../../utils/services/courses';

export const lessons = writable([]);
export const lesson = writable({
  id: null,
  materials: {
    note: '',
    slide: '',
    video: '',
  },
  exercises: [],
});
export const isLessonDirty = writable(false);

export const tutors = writable([
  {
    id: 1,
    text: 'Sergey Semko',
  },
  {
    id: 3,
    text: 'Jonathan Nelson',
  },
  {
    id: 4,
    text: 'Sasha Pokidin',
  },
  {
    id: 5,
    text: 'Natasha Rudenko',
  },
  {
    id: 6,
    text: 'Yulia Marushko',
  },
]);

export function handleAddLesson() {
  lessons.update((_lessons) => {
    return [
      ..._lessons,
      {
        id: null,
        title: 'Untitled lesson',
        profile: undefined,
        call_url: undefined,
        lesson_at: new Date(),
        is_complete: false,
      },
    ];
  });
}

export function handleDelete(lessonId) {
  return async () => {
    // Need to implement soft delete
    if (lessonId) {
      const { error } = await deleteLesson(lessonId);

      if (error) {
        return alert('Please delete all exercises first');
      }
    }

    lessons.update((_lessons) =>
      _lessons.filter((lesson) => lesson.id !== lessonId)
    );
    console.log(`lessonId`, lessonId);
  };
}

export async function handleSaveLesson(lesson, course_id) {
  const newLesson = {
    title: lesson.title,
    lesson_at: lesson.lesson_at,
    call_url: lesson.call_url,
    teacher_id: lesson.profile ? lesson.profile.id : null,
    course_id,
    is_complete: lesson.is_complete,
  };

  let updatedLesson;

  if (typeof lesson.id === 'string') {
    // No need to get the result of update cause we have all in local state
    await updateLesson(newLesson, lesson.id);
  } else {
    const { data } = await createLesson(newLesson);

    updatedLesson = data;
  }

  lessons.update((l) =>
    l.map((lesson) => {
      if (!lesson.id && updatedLesson) {
        lesson.id = updatedLesson[0].id;
      }

      return lesson;
    })
  );
}

export async function handleUpdateLessonMaterials(lesson) {
  return await updateLesson(lesson.materials, lesson.id);
}
