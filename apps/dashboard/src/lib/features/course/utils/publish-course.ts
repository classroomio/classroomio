import { generateSlug } from '@cio/utils/functions';
import { isObject } from '$lib/utils/functions/isObject';
import { courseApi } from '$features/course/api';
import type { Course } from '$features/course/utils/types';

export async function publishCourse(course: Course): Promise<boolean> {
  if (!course?.id) {
    return false;
  }

  let slug = course.slug?.trim() ? course.slug : undefined;
  if (!slug) {
    slug = generateSlug(course.title, { appendTimestamp: true });
  }

  const metadataPayload = {
    ...(isObject(course.metadata) ? course.metadata : {}),
    allowNewStudent: true
  };

  const result = await courseApi.update(
    course.id,
    {
      isPublished: true,
      slug,
      metadata: metadataPayload
    },
    { showSuccessToast: true }
  );

  return !!result;
}
