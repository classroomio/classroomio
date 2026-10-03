import { t } from '$lib/utils/functions/translations';
import { ROUTE_NAME, ROUTE_SECTIONS } from '$lib/routing/routes';
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

/**
 * Evaluates whether pricing has been configured for the path.
 *
 * - If paid (`landingPage.paymentEnabled === true`), requires a positive cost and a payment link.
 * - If explicitly free (`landingPage.paymentEnabled === false`), pricing is considered done.
 * - If cost is greater than 0, pricing has been set.
 * - If paymentEnabled is undefined and cost is 0, the creator has not configured pricing yet.
 */
export function isPriceConfigured(path: LearningPathDetail): boolean {
  const landingPage = path.landingPage;

  if (landingPage?.paymentEnabled === true) {
    const cost = Number(path.cost) || 0;
    const hasPaymentLink = Boolean(landingPage.paymentLink?.trim());
    return cost > 0 && hasPaymentLink;
  }

  if (landingPage?.paymentEnabled === false) {
    return true;
  }

  if (Number(path.cost) > 0) {
    return true;
  }

  return false;
}

export function getSetupSteps(path: LearningPathDetail | null | undefined, basePath: string): SetupStep[] {
  if (!path) return [];

  const isNameAndDescDone = Boolean(path.name.trim() && path.description.trim());
  const isAddCoursesDone = Boolean(path.courses && path.courses.length > 0);
  const isOrderDone = Boolean(path.courses && path.courses.length > 0 && path.courseOrderSetAt);
  const isPriceDone = isPriceConfigured(path);
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
      href: path.courses && path.courses.length >= 2 ? `${basePath}?reorder=true` : basePath,
      isCompleted: isOrderDone
    },
    {
      id: 'price',
      titleKey: 'learningPath.setup.step_price_title',
      descKey: 'learningPath.setup.step_price_desc',
      actionTextKey: 'learningPath.setup.step_price_action',
      href: `${basePath}/landingpage?section=pricing`,
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
      href: `${basePath}/settings?highlight=${ROUTE_SECTIONS[ROUTE_NAME.LEARNING_PATH_SETTINGS].PUBLISH}`,
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
