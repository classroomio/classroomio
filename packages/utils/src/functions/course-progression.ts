import { UNGROUPED_SECTION_KEY } from './course-content';
import { ContentType } from '../constants/content';

export type ProgressionLockReason = 'teacher_locked' | 'progression_blocked';

type NavigableCourseContent<T extends { order?: number | null }> = {
  grouped: boolean;
  sections: Array<{ id?: string; order?: number | null; items: T[] }>;
  items: T[];
};

/**
 * Flattens sectioned or flat course content into a single ordered array of items based on section and item orders.
 */
export function flattenNavigableItems<T extends { order?: number | null }>(content: NavigableCourseContent<T>): T[] {
  if (content.grouped) {
    const rootEntries = content.sections.flatMap((section, sectionIndex) => {
      const sortedItems = [...section.items].sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
      if (section.id === UNGROUPED_SECTION_KEY) {
        return sortedItems.map((item) => ({ order: item.order ?? 0, items: [item] }));
      }

      return [{ order: section.order ?? sectionIndex + 1, items: sortedItems }];
    });
    rootEntries.push(...content.items.map((item) => ({ order: item.order ?? 0, items: [item] })));
    rootEntries.sort((left, right) => left.order - right.order);
    return rootEntries.flatMap((entry) => entry.items);
  }

  return [...content.items].sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
}

/**
 * Evaluates whether a lesson with a given completion policy blocks sequential progression.
 */
function lessonBlocksProgression(policy?: string | null): boolean {
  return policy !== 'none';
}

/**
 * Evaluates whether an exercise blocks sequential progression (always true).
 */
function exerciseBlocksProgression(): boolean {
  return true;
}

/**
 * Determines whether a course content item blocks sequential progression.
 */
function itemBlocksProgression(type?: ContentType, completionPolicy?: string | null): boolean {
  if (type === ContentType.Lesson) {
    return lessonBlocksProgression(completionPolicy ?? 'manual');
  }

  if (type === ContentType.Exercise) {
    return exerciseBlocksProgression();
  }

  return false;
}

type CourseProgressionItem = {
  id: string;
  type?: ContentType;
  order?: number | null;
  completionPolicy?: string | null;
  isUnlocked?: boolean | null;
  isComplete?: boolean | null;
  accessible?: boolean;
  lockReason?: ProgressionLockReason | null;
};

type ComputeProgressionAccessParams<T extends CourseProgressionItem> = {
  navigableItems: T[];
  progressionMode: 'free' | 'sequential';
  isComplete?: (item: T) => boolean;
  getCompletionPolicy?: (item: T) => string | null | undefined;
  getIsUnlocked?: (item: T) => boolean;
};

type AccessMap = Map<string, { accessible: boolean; lockReason: ProgressionLockReason | null }>;

/**
 * Computes progression access (accessible flag and lockReason) across an ordered array of navigable items.
 */
export function computeProgressionAccess<T extends CourseProgressionItem>(
  params: ComputeProgressionAccessParams<T>
): AccessMap {
  const { navigableItems, progressionMode, isComplete, getCompletionPolicy, getIsUnlocked } = params;
  const accessById: AccessMap = new Map();
  let priorBlockingComplete = true;

  for (const item of navigableItems) {
    const isUnlocked = getIsUnlocked ? getIsUnlocked(item) : (item.isUnlocked ?? true);
    const teacherLocked = !isUnlocked;
    const progressionLocked = progressionMode === 'sequential' && !priorBlockingComplete;

    let accessible = !teacherLocked && !progressionLocked;
    let lockReason: ProgressionLockReason | null = null;

    if (teacherLocked) {
      accessible = false;
      lockReason = 'teacher_locked';
    } else if (progressionLocked) {
      accessible = false;
      lockReason = 'progression_blocked';
    }

    accessById.set(item.id, { accessible, lockReason });

    const itemComplete = isComplete ? isComplete(item) : Boolean(item.isComplete);
    const policy = getCompletionPolicy ? getCompletionPolicy(item) : item.completionPolicy;
    const blocks = itemBlocksProgression(item.type, policy);

    if (blocks && !itemComplete) {
      priorBlockingComplete = false;
    }
  }

  return accessById;
}

/**
 * Annotates a content item with its computed access and lock reason.
 */
export function annotateContentItem<T extends CourseProgressionItem>(item: T, accessById: AccessMap): T {
  const access = accessById.get(item.id);
  if (!access) return item;

  return {
    ...item,
    accessible: access.accessible,
    lockReason: access.lockReason
  };
}
