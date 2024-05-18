import { goto } from '$app/navigation';
import { globalStore } from '$lib/utils/store/app';
import { get } from 'svelte/store';

export function redirectToLesson(settings, courseId) {
  const globalStoreVal = get(globalStore);

  if (!settings && globalStoreVal.isOrgSite) {
    goto(`${courseId}/lessons?next=true`);
  }
}
