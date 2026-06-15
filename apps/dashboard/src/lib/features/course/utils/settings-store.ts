import type { TCourseType } from '@cio/db/types';
import type { TCourseCallout } from '@cio/utils/validation/course';
import { writable } from 'svelte/store';

type CourseSettings = {
  logo: string;
  courseTitle: string;
  courseDescription: string;
  grading: boolean;
  type: TCourseType;
  allowNewStudents: boolean;
  tabs: { id: number; name: string }[];
  lessonDownload: boolean;
  isPublished: boolean;
  isContentGroupingEnabled: boolean;
  progressionMode: 'free' | 'sequential';
  callout: TCourseCallout | null;
};

export const settings = writable<CourseSettings>({
  logo: '',
  courseTitle: '',
  courseDescription: '',
  grading: false,
  type: 'SELF_PACED' as TCourseType,
  allowNewStudents: false,
  tabs: [
    { id: 3, name: 'course.navItem.lessons.materials.tabs.video.title' },
    { id: 1, name: 'course.navItem.lessons.materials.tabs.note.title' },
    { id: 2, name: 'course.navItem.lessons.materials.tabs.slide.title' },
    { id: 4, name: 'course.navItem.lessons.materials.tabs.document.title' }
  ],
  lessonDownload: false,
  isPublished: false,
  isContentGroupingEnabled: true,
  progressionMode: 'free',
  callout: null
});
