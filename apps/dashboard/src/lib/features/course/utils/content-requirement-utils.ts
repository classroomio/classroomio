import { ContentType } from '@cio/utils/constants/content';

export type RequirementContentType = ContentType.Lesson | ContentType.Exercise;

export type RequirementPolicy = 'manual' | 'submitted' | 'none';

type RequirementItem = {
  type: ContentType;
  completionPolicy?: string | null;
  isComplete?: boolean | null;
};

export function isRequirementTarget<T extends { type: ContentType }>(
  item: T
): item is T & { type: RequirementContentType } {
  return item.type === ContentType.Lesson || item.type === ContentType.Exercise;
}

export function isContentRequired(item: { completionPolicy?: string | null }) {
  return item.completionPolicy !== 'none';
}

export function getRequirementPolicy(type: RequirementContentType, required: boolean): RequirementPolicy {
  if (!required) return 'none';

  return type === ContentType.Lesson ? 'manual' : 'submitted';
}

export function countRequirements(items: RequirementItem[]) {
  const targets = items.filter(isRequirementTarget);
  const required = targets.filter(isContentRequired);
  const requiredDone = required.filter((item) => item.isComplete).length;

  return {
    total: targets.length,
    required: required.length,
    optional: targets.length - required.length,
    requiredDone
  };
}

export function hasOptionalItem(items: RequirementItem[]) {
  return items.filter(isRequirementTarget).some((item) => !isContentRequired(item));
}
