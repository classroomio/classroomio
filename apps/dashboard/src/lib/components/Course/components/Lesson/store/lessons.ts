import type { Course, Lesson, LessonComment, LessonPage, LessonSection } from '$lib/utils/types';
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
import { lessonValidation } from '$lib/utils/functions/validator';
import { snackbar } from '$lib/components/Snackbar/store';
import { writable } from 'svelte/store';

export const uploadCourseVideoStore = writable({
  isUploading: false,
  isModalOpen: false
});

export const lessons: Writable<Lesson[]> = writable([]);

export const lessonSections: Writable<LessonSection[]> = writable([]);

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

  let newLessonData: any[] | null = null;

  if (lesson.id) {
    // No need to get the result of update cause we have all in local state
    await updateLesson(newLesson, lesson.id);
  } else {
    const { data } = await createLesson(newLesson);

    newLessonData = data;
  }
  return newLessonData;
}
export async function handleSaveLessonSection(
  section: Partial<LessonSection>,
  courseId: Course['id']
) {
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
