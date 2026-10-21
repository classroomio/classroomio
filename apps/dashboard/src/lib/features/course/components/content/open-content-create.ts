import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { contentCreateStoreUtils, contentEditingStore } from './store';

export function openAddContentModal(courseId: string, sectionId = '') {
  void goto(resolve(`/courses/${courseId}/lessons`, {}));
  contentEditingStore.set(undefined);
  contentCreateStoreUtils.close();

  if (sectionId) {
    contentCreateStoreUtils.openContentUnit(sectionId);
    return;
  }

  contentCreateStoreUtils.openDefault();
}
