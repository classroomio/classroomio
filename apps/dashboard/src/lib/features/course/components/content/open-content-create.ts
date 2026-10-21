import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { courseApi } from '$features/course/api';
import { isSingleActivityCourse } from '$features/course/utils/course-format';
import { getOrderedNavigableContent } from '$features/course/utils/content';
import { ContentType } from '@cio/utils/constants/content';
import { contentCreateStoreUtils, contentEditingStore } from './store';

export function openAddContentModal(courseId: string, sectionId = '') {
  void goto(resolve(`/courses/${courseId}/lessons`, {}));
  contentEditingStore.set(undefined);
  contentCreateStoreUtils.close();

  const courseItems = getOrderedNavigableContent(courseApi.course);
  const courseHasActivity = courseItems.some((item) => item.type === ContentType.Activity);

  if (isSingleActivityCourse(courseApi.course)) {
    if (!courseHasActivity) {
      contentCreateStoreUtils.openActivity();
    }
    return;
  }

  const contentGroupingEnabled = courseApi.course?.metadata?.isContentGroupingEnabled ?? true;

  if (sectionId) {
    contentCreateStoreUtils.openContentUnit(sectionId);
    return;
  }

  contentCreateStoreUtils.openDefault();
}
