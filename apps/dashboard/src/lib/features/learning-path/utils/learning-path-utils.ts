import type { LearningPathSummary, LearningPathMetrics, LearningPathStatus } from './types';

/**
 * Calculates aggregate performance metrics from learning paths
 */
export function computeMetrics(paths: LearningPathSummary[]): LearningPathMetrics {
  const activePaths = paths.filter((p) => p.status === 'ACTIVE').length;
  const enrolledLearners = paths.reduce((sum, p) => sum + (p.memberCount || 0), 0);
  const completions = paths.reduce((sum, p) => sum + (p.completionsCount || 0), 0);

  // Completion rate across all enrolled learners
  const completionRate =
    enrolledLearners > 0
      ? Math.round((completions / enrolledLearners) * 100)
      : paths.length > 0
        ? Math.round(paths.reduce((sum, p) => sum + (p.completionRate || 0), 0) / paths.length)
        : 0;

  return {
    activePaths,
    enrolledLearners,
    completions,
    completionRate
  };
}

/**
 * Maps database status to UI badge variant
 */
export function getStatusBadgeVariant(status: LearningPathStatus): 'success' | 'warning' | 'muted' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'DRAFT':
      return 'warning';
    case 'ARCHIVED':
      return 'muted';
    default:
      return 'muted';
  }
}

/**
 * Human-readable label for status (Decision 25 renames)
 */
export function getStatusDisplayLabel(status: LearningPathStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Published';
    case 'DRAFT':
      return 'Draft';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return status;
  }
}

/**
 * Standardized CTA text per PRD Decision 31 / AC #31
 */
export function formatPathCta(path: LearningPathSummary): 'Manage' | 'Continue setup' {
  if (path.status === 'DRAFT' && path.memberCount === 0) {
    return 'Continue setup';
  }
  return 'Manage';
}

/**
 * Generates an SEO-friendly URL slug from a title
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Formats a timestamp into a relative human-readable string
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 0) {
    if (diffHours <= 1) return 'Updated recently';
    return `Updated ${diffHours} hours ago`;
  }
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays < 7) return `Updated ${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return 'Updated 1 week ago';
  if (diffWeeks < 4) return `Updated ${diffWeeks} weeks ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `Updated ${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
}
