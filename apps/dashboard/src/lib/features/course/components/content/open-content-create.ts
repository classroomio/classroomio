import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { courseApi } from '$features/course/api';
import { isSingleActivityCourse } from '$features/course/utils/course-format';
import { ContentType } from '@cio/utils/constants/content';
import { contentCreateStoreUtils, contentEditingStore } from './store';

export function openAddContentModal(courseId: string, sectionId = '') {
  void goto(resolve(`/courses/${courseId}/lessons`, {}));
  contentEditingStore.set(undefined);
  contentCreateStoreUtils.close();

  if (isSingleActivityCourse(courseApi.course)) {
    const content = courseApi.course?.content;
    const items = content?.grouped ? content.sections.flatMap((section) => section.items) : (content?.items ?? []);
    if (items.some((item) => item.type === ContentType.Activity)) return;

    contentCreateStoreUtils.openActivity();
    return;
  }

  const contentGroupingEnabled = courseApi.course?.metadata?.isContentGroupingEnabled ?? true;

  if (sectionId) {
    contentCreateStoreUtils.openContentUnit(sectionId);
    return;
  }

  contentCreateStoreUtils.openDefault();
}
