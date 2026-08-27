import { env } from '$env/dynamic/public';

/**
 * Flag indicating whether AI features are enabled in the dashboard.
 *
 * Possible `PUBLIC_IS_AI_ENABLED` values and resulting `IS_AI_ENABLED` value:
 * - `'false'`       => `false` (AI features disabled)
 * - `'true'`        => `true`  (AI features enabled)
 * - `undefined`     => `true`  (AI features enabled by default)
 * - Any other string => `true`  (AI features enabled)
 */
export const IS_AI_ENABLED = env.PUBLIC_IS_AI_ENABLED !== 'false';
