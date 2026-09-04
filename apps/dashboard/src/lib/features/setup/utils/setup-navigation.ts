import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { currentOrg } from '$lib/utils/store/org';
import { snackbar } from '$features/ui/snackbar/store';
import { setupProgressApi } from '../api/setup-progress.svelte';
import { goAndHighlight } from '$lib/routing/go-and-highlight';
import { ROUTE_NAME, ROUTE_SECTIONS } from '$lib/routing/routes';

export const SETUP_STEPS = {
  UPDATE_PROFILE: 'profile',
  UPDATE_ORG_PROFILE: 'organization',
  CREATE_COURSE: 'course',
  CREATE_LESSON: 'lesson',
  CREATE_EXERCISE: 'exercise',
  PUBLISH_COURSE: 'publish'
} as const;

export type SetupStepId = (typeof SETUP_STEPS)[keyof typeof SETUP_STEPS];

export function getSetupPagePath(siteName: string): string {
  return `/org/${siteName}/setup`;
}

function isStepCompleted(stepId: string): boolean {
  return setupProgressApi.setupList.find((item) => item.id === stepId)?.is_completed === true;
}

export function goToSetupItem(id: string) {
  const siteName = get(currentOrg).siteName;
  if (!siteName) {
    return;
  }

  const courses = setupProgressApi.progress.courses || [];
  const lessons = setupProgressApi.progress.lessons || [];
  const courseId = courses[0]?.id;
  const lessonId = lessons[0]?.id;

  switch (id) {
    case SETUP_STEPS.CREATE_COURSE:
      goto(`/org/${siteName}/courses?create=true`);
      return;

    case SETUP_STEPS.CREATE_LESSON:
      if (isStepCompleted(SETUP_STEPS.CREATE_COURSE) && courseId) {
        goto(`/courses/${courseId}/lessons`);
        return;
      }

      snackbar.info('setup.info_course');
      return;

    case SETUP_STEPS.CREATE_EXERCISE:
      if (isStepCompleted(SETUP_STEPS.CREATE_LESSON) && courseId && lessonId) {
        goto(`/courses/${courseId}/lessons/${lessonId}`);
        return;
      }

      snackbar.info('setup.info_lesson');
      return;

    case SETUP_STEPS.PUBLISH_COURSE:
      if (isStepCompleted(SETUP_STEPS.CREATE_COURSE) && courseId) {
        goAndHighlight(ROUTE_NAME.COURSE_SETTINGS, ROUTE_SECTIONS[ROUTE_NAME.COURSE_SETTINGS].PUBLISH, {
          id: courseId
        });
        return;
      }

      snackbar.info('setup.info_course');
      return;

    case SETUP_STEPS.UPDATE_PROFILE:
      goto(`/org/${siteName}/settings`);
      return;

    case SETUP_STEPS.UPDATE_ORG_PROFILE:
      goto(`/org/${siteName}/settings/org`);
      return;
  }
}
