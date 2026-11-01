export const DOWNLOADS_DATABASE_NAME = 'offline-downloads.db';

/** Root folder under the app's document directory; each user's files live in a folder named by their id. */
export const DOWNLOADS_FOLDER = 'offline';

export const PROGRESS_FLUSH_MS = 250;

/** Space kept free beyond the estimate so a download never fills the device. */
export const FREE_SPACE_MARGIN_BYTES = 200 * 1024 * 1024;

/** Media links in a stored manifest are reused only while they have at least this long left. */
export const LINK_MIN_REMAINING_MS = 60 * 1000;

/** Images above this size stay online instead of being inlined into the offline lesson page. */
export const INLINE_IMAGE_MAX_BYTES = 6 * 1024 * 1024;

export const DOWNLOAD_SETTINGS_KEY = 'downloads.settings';

export const AUTO_DOWNLOAD_SEEN_KEY = 'downloads.auto-seen';
