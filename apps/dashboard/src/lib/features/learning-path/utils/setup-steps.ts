import { t } from '$lib/utils/functions/translations';
import type { LearningPathDetail, SetupStep } from './types';

/**
 * The landing step counts only when the author customized real page copy.
 * Any saved key (e.g. a derived instructor or a toggled setting) must not
 * mark it complete while the title and body are still blank.
 */
export function hasLandingContent(path: LearningPathDetail): boolean {
  const landingPage = path.landingPage;

  if (!landingPage) return false;

  return Boolean(
    landingPage.title?.trim() ||
      landingPage.description?.trim() ||
      landingPage.requirements?.trim() ||
      landingPage.goals?.trim() ||
      (landingPage.skills && landingPage.skills.length > 0) ||
      (landingPage.reviews && landingPage.reviews.length > 0) ||
      (landingPage.faqs && landingPage.faqs.length > 0)
  );
}

export function getSetupSteps(path: LearningPathDetail | null | undefined, basePath: string): SetupStep[] {
  if (!path) return [];

  const isNameAndDescDone = Boolean(path.name.trim() && path.description.trim());
  const isAddCoursesDone = Boolean(path.courses && path.courses.length > 0);
  const isOrderDone = Boolean(path.courseOrderSetAt || (path.courses && path.courses.length >= 2));
  const isPriceDone = path.cost !== undefined && path.cost !== null;
  const isLandingDone = hasLandingContent(path);
  const isPublishDone = Boolean(path.isPublished);

  const rawSteps = [
    {
      id: 'name',
      titleKey: 'learningPath.setup.step_name_title',
      descKey: 'learningPath.setup.step_name_desc',
      actionTextKey: 'learningPath.setup.step_name_action',
      href: `${basePath}/settings`,
      isCompleted: isNameAndDescDone
    },
    {
      id: 'courses',
      titleKey: 'learningPath.setup.step_courses_title',
      descKey: 'learningPath.setup.step_courses_desc',
      actionTextKey: 'learningPath.setup.step_courses_action',
      href: basePath,
      isCompleted: isAddCoursesDone
    },
    {
      id: 'order',
      titleKey: 'learningPath.setup.step_order_title',
      descKey: 'learningPath.setup.step_order_desc',
      actionTextKey: 'learningPath.setup.step_order_action',
      href: `${basePath}?reorder=true`,
      isCompleted: isOrderDone
    },
    {
      id: 'price',
      titleKey: 'learningPath.setup.step_price_title',
      descKey: 'learningPath.setup.step_price_desc',
      actionTextKey: 'learningPath.setup.step_price_action',
      href: `${basePath}/settings`,
      isCompleted: isPriceDone
    },
    {
      id: 'landing',
      titleKey: 'learningPath.setup.step_landing_title',
      descKey: 'learningPath.setup.step_landing_desc',
      actionTextKey: 'learningPath.setup.step_landing_action',
      href: `${basePath}/landingpage`,
      isCompleted: isLandingDone
    },
    {
      id: 'publish',
      titleKey: 'learningPath.setup.step_publish_title',
      descKey: 'learningPath.setup.step_publish_desc',
      actionTextKey: 'learningPath.setup.step_publish_action',
      href: `${basePath}/settings`,
      isCompleted: isPublishDone
    }
  ];

  // The first incomplete step is "current"
  let foundCurrent = false;
  return rawSteps.map((step) => {
    let isCurrent = false;
    if (!step.isCompleted && !foundCurrent) {
      isCurrent = true;
      foundCurrent = true;
    }

    const title = t.get(step.titleKey);
    const description = t.get(step.descKey);
    const actionText = t.get(step.actionTextKey);

    return {
      id: step.id,
      title,
      description,
      actionText,
      href: step.href,
      isCompleted: step.isCompleted,
      isCurrent
    };
  });
}

export function getSetupProgress(steps: SetupStep[]): {
  completed: number;
  total: number;
  percent: number;
} {
  const completed = steps.filter((s) => s.isCompleted).length;
  const total = steps.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percent };
}
