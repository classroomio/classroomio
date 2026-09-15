import type { StatusFilter, EnrollmentFilter, CompletionFilter, ViewMode } from './types';

export const LEARNING_PATHS_VIEW_MODE_KEY = 'pathView';
export const DEFAULT_VIEW_MODE: ViewMode = 'grid';

/** Named sort keys for learning path lists (URL `sort`, localStorage, filter UI). */
export const PathSortBy = {
  DateCreated: 'date_created',
  LastUpdatedAt: 'last_updated_at',
  Published: 'published',
  Courses: 'courses'
} as const;

export type PathSortBy = (typeof PathSortBy)[keyof typeof PathSortBy];

export const DEFAULT_PATH_SORT: PathSortBy = PathSortBy.DateCreated;

/** URL `order` param and filter toggle (ascending vs descending). */
export const PathSortOrder = {
  Asc: 'asc',
  Desc: 'desc'
} as const;

export type PathSortOrder = (typeof PathSortOrder)[keyof typeof PathSortOrder];

export const DEFAULT_SORT_ORDER: PathSortOrder = PathSortOrder.Desc;

export const PATH_SORT_OPTIONS = [
  { value: PathSortBy.DateCreated, label: 'courses.course_filter.date_created' },
  { value: PathSortBy.LastUpdatedAt, label: 'courses.course_filter.last_updated_at' },
  { value: PathSortBy.Published, label: 'courses.course_filter.published' },
  { value: PathSortBy.Courses, label: 'learningPath.builder.title' }
] as const;

const PATH_SORT_VALUES = new Set<string>(Object.values(PathSortBy));

export function parsePathSortValue(value: string | null | undefined): PathSortBy {
  if (value == null || value === '') {
    return DEFAULT_PATH_SORT;
  }
  if (PATH_SORT_VALUES.has(value)) {
    return value as PathSortBy;
  }
  return DEFAULT_PATH_SORT;
}

const PATH_SORT_ORDER_VALUES = new Set<string>(Object.values(PathSortOrder));

export function parsePathSortOrder(value: string | null | undefined): PathSortOrder {
  if (value != null && PATH_SORT_ORDER_VALUES.has(value)) {
    return value as PathSortOrder;
  }
  return DEFAULT_SORT_ORDER;
}

export const STATUS_FILTER_OPTIONS: { id: StatusFilter; labelKey: string; fallback: string }[] = [
  { id: 'all', labelKey: 'learningPath.listing.filters.all', fallback: 'All' },
  { id: 'published', labelKey: 'courses.course_card.published', fallback: 'Published' },
  { id: 'unpublished', labelKey: 'courses.course_card.unpublished', fallback: 'Unpublished' }
];

export const ENROLLMENT_FILTER_OPTIONS: { id: EnrollmentFilter; labelKey: string; fallback: string }[] = [
  { id: 'all', labelKey: 'learningPath.listing.filters.all', fallback: 'All' },
  { id: 'none', labelKey: 'learningPath.listing.filters.no_learners', fallback: 'No learners yet' },
  { id: '1-49', labelKey: 'learningPath.listing.filters.enrollment_1_49', fallback: '1–49' },
  { id: '50+', labelKey: 'learningPath.listing.filters.enrollment_50_plus', fallback: '50+' }
];

export const COMPLETION_FILTER_OPTIONS: { id: CompletionFilter; labelKey: string; fallback: string }[] = [
  { id: 'all', labelKey: 'learningPath.listing.filters.all', fallback: 'All' },
  { id: 'low', labelKey: 'learningPath.listing.filters.low', fallback: 'Low (under 25%)' },
  { id: 'medium', labelKey: 'learningPath.listing.filters.medium', fallback: 'Medium (25–75%)' },
  { id: 'high', labelKey: 'learningPath.listing.filters.high', fallback: 'High (75%+)' }
];

export const PATH_CARD_GRADIENTS = [
  'linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815))',
  'linear-gradient(135deg, oklch(0.596 0.145 163.225), oklch(0.696 0.17 162.48))',
  'linear-gradient(135deg, oklch(0.666 0.179 58.318), oklch(0.769 0.188 70.08))',
  'linear-gradient(135deg, oklch(0.585 0.233 277.117), oklch(0.606 0.25 292.717))'
];
