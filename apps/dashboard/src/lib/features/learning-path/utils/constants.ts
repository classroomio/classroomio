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
  { value: PathSortBy.DateCreated, label: 'learningPath.listing.filters.sort_date_created' },
  { value: PathSortBy.LastUpdatedAt, label: 'learningPath.listing.filters.sort_last_updated_at' },
  { value: PathSortBy.Published, label: 'learningPath.listing.filters.sort_published' },
  { value: PathSortBy.Courses, label: 'learningPath.listing.filters.sort_courses' }
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

export const STATUS_FILTER_OPTIONS: { id: StatusFilter; labelKey: string }[] = [
  { id: 'all', labelKey: 'learningPath.listing.filters.all' },
  { id: 'published', labelKey: 'learningPath.listing.filters.published' },
  { id: 'unpublished', labelKey: 'learningPath.listing.filters.unpublished' }
];

export const ENROLLMENT_FILTER_OPTIONS: { id: EnrollmentFilter; labelKey: string }[] = [
  { id: 'all', labelKey: 'learningPath.listing.filters.all' },
  { id: 'none', labelKey: 'learningPath.listing.filters.no_learners' },
  { id: '1-49', labelKey: 'learningPath.listing.filters.enrollment_1_49' },
  { id: '50+', labelKey: 'learningPath.listing.filters.enrollment_50_plus' }
];

export const COMPLETION_FILTER_OPTIONS: { id: CompletionFilter; labelKey: string }[] = [
  { id: 'all', labelKey: 'learningPath.listing.filters.all' },
  { id: 'low', labelKey: 'learningPath.listing.filters.low' },
  { id: 'medium', labelKey: 'learningPath.listing.filters.medium' },
  { id: 'high', labelKey: 'learningPath.listing.filters.high' }
];
