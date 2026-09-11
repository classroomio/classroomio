import type { StatusFilter, EnrollmentFilter, CompletionFilter, ViewMode } from './types';

export const LEARNING_PATHS_VIEW_MODE_KEY = 'cio_lp_view_mode';
export const DEFAULT_VIEW_MODE: ViewMode = 'grid';

export const STATUS_FILTER_OPTIONS: { id: StatusFilter; labelKey: string; fallback: string }[] = [
  { id: 'all', labelKey: 'learningPath.listing.filters.all', fallback: 'All' },
  { id: 'draft', labelKey: 'learningPath.listing.filters.draft', fallback: 'Draft' },
  { id: 'published', labelKey: 'learningPath.listing.filters.published', fallback: 'Published' },
  { id: 'archived', labelKey: 'learningPath.listing.filters.archived', fallback: 'Archived' }
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
