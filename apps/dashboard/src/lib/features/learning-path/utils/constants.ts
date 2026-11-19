import type { CompletionFilter, EnrollmentFilter, PathSortBy, PathSortOrder, StatusFilter, ViewMode } from './types';

export const LEARNING_PATHS_VIEW_MODE_KEY = 'pathView';
export const DEFAULT_VIEW_MODE: ViewMode = 'grid';

/** Named sort keys for learning path lists (URL `sort`, localStorage, filter UI). Values match the backend `LEARNING_PATH_LIST_SORT_BY`. */
export const PATH_SORT_BY = {
  DateCreated: 'date_created',
  LastUpdatedAt: 'last_updated_at',
  Published: 'published',
  Courses: 'courses'
} as const;

export const DEFAULT_PATH_SORT: PathSortBy = PATH_SORT_BY.DateCreated;

/** URL `order` param and filter toggle (ascending vs descending). Values match the backend `LEARNING_PATH_LIST_SORT_ORDERS`. */
export const PATH_SORT_ORDER = {
  Asc: 'asc',
  Desc: 'desc'
} as const;

export const DEFAULT_SORT_ORDER: PathSortOrder = PATH_SORT_ORDER.Desc;

export const PATH_SORT_OPTIONS = [
  { value: PATH_SORT_BY.DateCreated, label: 'learningPath.listing.filters.sort_date_created' },
  { value: PATH_SORT_BY.LastUpdatedAt, label: 'learningPath.listing.filters.sort_last_updated_at' },
  { value: PATH_SORT_BY.Published, label: 'learningPath.listing.filters.sort_published' },
  { value: PATH_SORT_BY.Courses, label: 'learningPath.listing.filters.sort_courses' }
] as const;

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
