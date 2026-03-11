import { env } from './env';

/**
 * Returns the base URL for the dashboard app, used for invite links, email links, etc.
 * When DASHBOARD_ORIGIN is set (e.g. self-hosted), it takes precedence.
 * Otherwise: dev → localhost:5173, prod → app.classroomio.com (or subdomain for cloud).
 */
export function getDashboardBaseUrl(orgSiteName?: string): string {
  if (env.DASHBOARD_ORIGIN) {
    return env.DASHBOARD_ORIGIN.replace(/\/$/, '');
  }

  if (env.NODE_ENV === 'development') {
    return 'http://localhost:5173';
  }

  const subdomain = orgSiteName || 'app';

  return `https://${subdomain}.classroomio.com`;
}
