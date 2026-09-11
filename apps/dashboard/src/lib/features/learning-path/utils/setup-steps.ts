import type { LearningPathDetail, SetupStep } from './types';

export function getSetupSteps(path: LearningPathDetail, basePath: string): SetupStep[] {
  const isNameDone = Boolean(path.name?.trim() && path.description?.trim());
  const isAddCoursesDone = Boolean(path.courses && path.courses.length > 0);
  const isOrderDone = Boolean(path.courseOrderSetAt);
  const isPriceDone = path.cost !== undefined && path.cost !== null;
  const isLandingDone = Boolean(path.landingPage?.headline?.trim());
  const isActivateDone = path.status === 'ACTIVE';

  const rawSteps = [
    {
      id: 'name',
      titleKey: 'learningPath.setup.step_name_title',
      descKey: 'learningPath.setup.step_name_desc',
      defaultTitle: 'Name & describe your path',
      defaultDesc: 'Give the path a clear, outcome-based name and a short summary.',
      actionTextKey: 'learningPath.setup.step_name_action',
      defaultAction: 'Edit details',
      href: `${basePath}/settings`,
      isCompleted: isNameDone
    },
    {
      id: 'courses',
      titleKey: 'learningPath.setup.step_courses_title',
      descKey: 'learningPath.setup.step_courses_desc',
      defaultTitle: 'Add courses',
      defaultDesc: 'Pick the courses that make up this learning path.',
      actionTextKey: 'learningPath.setup.step_courses_action',
      defaultAction: 'Add courses',
      href: `${basePath}/courses`,
      isCompleted: isAddCoursesDone
    },
    {
      id: 'order',
      titleKey: 'learningPath.setup.step_order_title',
      descKey: 'learningPath.setup.step_order_desc',
      defaultTitle: 'Set the course order',
      defaultDesc: 'Drag courses into the order learners should complete them.',
      actionTextKey: 'learningPath.setup.step_order_action',
      defaultAction: 'Set order',
      href: `${basePath}/courses`,
      isCompleted: isOrderDone
    },
    {
      id: 'price',
      titleKey: 'learningPath.setup.step_price_title',
      descKey: 'learningPath.setup.step_price_desc',
      defaultTitle: 'Set your price',
      defaultDesc: 'Price the path as a bundle — learners see the savings vs individual courses.',
      actionTextKey: 'learningPath.setup.step_price_action',
      defaultAction: 'Set price',
      href: `${basePath}/settings`,
      isCompleted: isPriceDone
    },
    {
      id: 'landing',
      titleKey: 'learningPath.setup.step_landing_title',
      descKey: 'learningPath.setup.step_landing_desc',
      defaultTitle: 'Customize your landing page',
      defaultDesc: 'Outcomes, skills, instructors, testimonials, and FAQs on the public path page.',
      actionTextKey: 'learningPath.setup.step_landing_action',
      defaultAction: 'Customize',
      href: `${basePath}/landing`,
      isCompleted: isLandingDone
    },
    {
      id: 'activate',
      titleKey: 'learningPath.setup.step_activate_title',
      descKey: 'learningPath.setup.step_activate_desc',
      defaultTitle: 'Activate the path',
      defaultDesc: 'Set the status to Active so it appears on your landing page and LMS.',
      actionTextKey: 'learningPath.setup.step_activate_action',
      defaultAction: 'Activate',
      href: `${basePath}/settings`,
      isCompleted: isActivateDone
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
    return {
      id: step.id,
      title: step.defaultTitle,
      description: step.defaultDesc,
      actionText: step.defaultAction,
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
