/**
 * The public YouTube playlist the weekly changelog walkthrough videos are published to. Each video is matched to
 * the changelog entry published the same day.
 */
export const CHANGELOG_PLAYLIST_ID = 'PLMEG4cJ-nGcA';

/**
 * Manual overrides, keyed by UserJot entry id (`id` in `GET /v1/changelogs`) with a YouTube video id as the value.
 * Use it when the playlist match is wrong or a video lives outside the playlist. Wins over the playlist match.
 */
export const CHANGELOG_VIDEO_OVERRIDES: Record<string, string> = {};
