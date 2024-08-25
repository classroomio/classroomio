//   import { t } from '$lib/utils/functions/translations';

export const SECTION_KEYS = {
  HEADER: 'header',
  REQUIREMENT: '#requirement',
  DESCRIPTION: '#description',
  GOALS: '#goals',
  LESSONS: '#lessons',
  REVIEWS: '#reviews',
  INSTRUCTOR: '#instructor'
};

export const NAV_ITEMS = [
  {
    key: SECTION_KEYS.REQUIREMENT,
    label: 'course.navItem.landing_page.editor.title.requirement'
  },
  {
    key: SECTION_KEYS.DESCRIPTION,
    label: 'course.navItem.landing_page.editor.title.description'
  },
  {
    key: SECTION_KEYS.GOALS,
    label: 'course.navItem.landing_page.editor.title.goals'
  },
  {
    key: SECTION_KEYS.LESSONS,
    label: 'course.navItems.nav_content'
  },
  {
    key: SECTION_KEYS.REVIEWS,
    label: 'course.navItem.landing_page.editor.title.reviews'
  },
  {
    key: SECTION_KEYS.INSTRUCTOR,
    label: 'course.navItem.landing_page.editor.title.instructor'
  }
];
