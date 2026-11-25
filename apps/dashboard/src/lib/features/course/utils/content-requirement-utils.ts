import { ContentType } from '@cio/utils/constants/content';

export type RequirementMap = Record<string, boolean>;

export type RequirementTarget = {
  type: ContentType;
  id: string;
};

type RequirementItem = RequirementTarget & {
  isComplete?: boolean | null;
};

export function getRequirementKey(target: RequirementTarget) {
  return `${target.type}:${target.id}`;
}

export function isContentRequired(requirements: RequirementMap, target: RequirementTarget) {
  return requirements[getRequirementKey(target)] ?? true;
}

export function isRequirementTarget(item: RequirementTarget) {
  return item.type === ContentType.Lesson || item.type === ContentType.Exercise;
}

export function countRequirements(items: RequirementItem[], requirements: RequirementMap) {
  const targets = items.filter(isRequirementTarget);
  const required = targets.filter((item) => isContentRequired(requirements, item));
  const requiredDone = required.filter((item) => item.isComplete).length;

  return {
    total: targets.length,
    required: required.length,
    optional: targets.length - required.length,
    requiredDone
  };
}

export function hasOptionalItem(items: RequirementItem[], requirements: RequirementMap) {
  return items.filter(isRequirementTarget).some((item) => !isContentRequired(requirements, item));
}
