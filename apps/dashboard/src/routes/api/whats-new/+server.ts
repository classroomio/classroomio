import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestEvent } from './$types';

const WEBSITE_URL = dev ? 'http://localhost:5174' : 'https://classroomio.com';
const MAX_ENTRIES = 5;

/**
 * Serves the latest changelog entries from the marketing site, so the browser never calls it cross-origin.
 * Returns an empty list when the site cannot be reached, which hides the sidebar card.
 */
export const GET = async ({ fetch }: RequestEvent) => {
  try {
    const response = await fetch(`${WEBSITE_URL}/api/changelog?limit=${MAX_ENTRIES}`);

    if (!response.ok) {
      throw new Error(`Changelog request returned ${response.status}`);
    }

    const payload = (await response.json()) as { entries?: unknown[] };

    return json({ entries: payload.entries ?? [] }, { headers: { 'cache-control': 'private, max-age=300' } });
  } catch (error) {
    console.error('whats-new error:', error);

    return json({ entries: [] });
  }
};
