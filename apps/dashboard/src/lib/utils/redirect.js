import { goto } from '$app/navigation';
import { globalStore } from './store/app';
import { get } from 'svelte/store';

export function redirectToLesson(settings, courseId) {
  let isOrg = get(globalStore);

  if (!settings && isOrg.isOrgSite) {
    goto(`${courseId}/lessons?next=true`);
  }
}
