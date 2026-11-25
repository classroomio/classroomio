import { writable } from 'svelte/store';
import {
  getRequirementKey,
  isContentRequired,
  type RequirementMap,
  type RequirementTarget
} from './content-requirement-utils';

export const contentRequirements = writable<RequirementMap>({});

export function toggleContentRequirement(target: RequirementTarget) {
  contentRequirements.update((requirements) => ({
    ...requirements,
    [getRequirementKey(target)]: !isContentRequired(requirements, target)
  }));
}

export function setContentRequirements(targets: RequirementTarget[], required: boolean) {
  contentRequirements.update((requirements) => {
    const next = { ...requirements };
    for (const target of targets) {
      next[getRequirementKey(target)] = required;
    }

    return next;
  });
}
