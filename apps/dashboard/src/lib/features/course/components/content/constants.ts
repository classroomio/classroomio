import { ContentType } from '@cio/utils/constants/content';
import type { StepperState } from './types';

/** Translation key for primary action (resolve with t() in components) */
export const ADD_CONTENT_CREATE_KEY = 'course.navItem.lessons.add_content_create';
export const ADD_CONTENT_CREATE_SECTION_KEY = 'course.navItem.lessons.add_content_create_section';
export const ADD_CONTENT_CREATE_LESSON_KEY = 'course.navItem.lessons.add_content_create_lesson';

/** Default stepper state used as fallback in the modal and when resetting */
export const DEFAULT_STEPPER_STATE: StepperState = {
  currentStep: 0,
  totalSteps: 1,
  canProceed: false,
  isSubmitting: false,
  primaryActionLabel: '' // Set from translation in component
};

/** Default state for the section create stepper */
export const SECTION_STEPPER_DEFAULT_STATE: StepperState = {
  ...DEFAULT_STEPPER_STATE,
  primaryActionLabel: '' // Set from translation in section-create-stepper
};

/** Default state for the lesson create stepper */
export const LESSON_STEPPER_DEFAULT_STATE: StepperState = {
  ...DEFAULT_STEPPER_STATE,
  primaryActionLabel: '' // Set from translation in lesson-create-stepper
};

/** Default state for the exercise create stepper (label set at runtime from i18n) */
export const EXERCISE_STEPPER_DEFAULT_STATE: StepperState = {
  currentStep: 0,
  totalSteps: 2,
  canProceed: false,
  isSubmitting: false,
  primaryActionLabel: ''
};

/** Content type options shown in the add-content modal (title/description are translation keys) */
export const CONTENT_OPTIONS = [
  {
    id: 'section',
    type: ContentType.Section,
    titleKey: 'course.navItem.lessons.add_content_options.section_title',
    descriptionKey: 'course.navItem.lessons.add_content_options.section_description'
  },
  {
    id: 'lesson',
    type: ContentType.Lesson,
    titleKey: 'course.navItem.lessons.add_content_options.lesson_title',
    descriptionKey: 'course.navItem.lessons.add_content_options.lesson_description'
  },
  {
    id: 'exercise',
    type: ContentType.Exercise,
    titleKey: 'course.navItem.lessons.add_content_options.exercise_title',
    descriptionKey: 'course.navItem.lessons.add_content_options.exercise_description'
  }
] as const;

/** Exercise creation flow type (from scratch, template, or AI) */
export const EXERCISE_CREATE_TYPE = {
  SCRATCH: 0,
  TEMPLATE: 1,
  AI: 2
} as const;

export type ExerciseCreateType = (typeof EXERCISE_CREATE_TYPE)[keyof typeof EXERCISE_CREATE_TYPE];
