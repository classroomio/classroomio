import { get } from 'svelte/store';
import { courseApi, exerciseApi, lessonApi } from '$features/course/api';
import { isUpdatingRequirement } from '$features/course/utils/content-requirement-store';
import {
  getRequirementPolicy,
  isContentRequired,
  isRequirementTarget
} from '$features/course/utils/content-requirement-utils';
import type { ContentType } from '@cio/utils/constants/content';
import { setRequirement } from './content-action-helpers';

export type RequirementActionItem = {
  type: ContentType;
  contentId: string;
  completionPolicy?: string | null;
};

/**
 * Sets each lesson or exercise to required or optional by saving its completion policy
 * ("none" is optional), one request at a time, and patches the loaded course content.
 * Items already in the requested state are skipped. Returns how many were saved and how many failed,
 * or null when another update is already running.
 */
export async function applyRequirement(courseId: string, items: RequirementActionItem[], required: boolean) {
  if (get(isUpdatingRequirement)) return null;

  const pending = items.filter(isRequirementTarget).filter((item) => isContentRequired(item) !== required);
  let changed = 0;
  let failed = 0;

  isUpdatingRequirement.set(true);

  try {
    for (const item of pending) {
      const saved = await setRequirement({ item, required, courseId, lessonApi, exerciseApi });

      if (!saved) {
        failed += 1;
        continue;
      }

      courseApi.updateContentItem(item.contentId, item.type, {
        completionPolicy: getRequirementPolicy(item.type, required)
      });
      changed += 1;
    }
  } finally {
    isUpdatingRequirement.set(false);
  }

  return { changed, failed };
}
