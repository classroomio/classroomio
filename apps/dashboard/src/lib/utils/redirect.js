import { goto } from '$app/navigation';
import { globalStore } from './store/app';
import { get } from 'svelte/store';

let isOrg = get(globalStore);

export function redirectToLesson(settings, courseId) {
  if (!settings && isOrg.isOrgSite) {
    goto(`${courseId}/lessons?next=true`);
  }
}
