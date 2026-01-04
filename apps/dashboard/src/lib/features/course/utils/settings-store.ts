import type { TCourseType } from '@cio/db/types';
import { writable } from 'svelte/store';

export const settings = writable({
  logo: '',
  course_title: '',
  course_description: '',
  grading: false,
  type: 'LIVE_CLASS' as TCourseType,
  allow_new_students: false,
  tabs: [
    { id: 1, name: 'course.navItem.lessons.materials.tabs.note.title' },
    { id: 2, name: 'course.navItem.lessons.materials.tabs.slide.title' },
    { id: 3, name: 'course.navItem.lessons.materials.tabs.video.title' },
    { id: 4, name: 'course.navItem.lessons.materials.tabs.document.title' }
  ],
  lesson_download: false,
  is_published: false
});
