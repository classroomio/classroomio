import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { courseApi } from '$features/course/api';
import { contentCreateStoreUtils, contentEditingStore } from './store';

export function openAddContentModal(courseId: string, sectionId = '') {
  void goto(resolve(`/courses/${courseId}/lessons`, {}));
  contentEditingStore.set(undefined);
  contentCreateStoreUtils.close();

  const contentGroupingEnabled = courseApi.course?.metadata?.isContentGroupingEnabled ?? true;

  if (sectionId) {
    contentCreateStoreUtils.openContentUnit(sectionId);
    return;
  }

  if (contentGroupingEnabled) {
    contentCreateStoreUtils.openSection();
    return;
  }

  contentCreateStoreUtils.openDefault();
}
