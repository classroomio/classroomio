import { canFetchYouTubeCaptions } from '@cio/utils/plans';

import { env } from '../../config/env';
import { getOrgPlanName } from '../agent/usage';

/**
 * Supadata bills 1 flat credit per request. Pro is $17/3,000 credits = $0.00567;
 * token packs are $5/5M units = $0.000001/unit, so break-even is ~5,667 units.
 * At 6,000, Early Adopter (3M) gets ~500 fetches/month and Enterprise (15M) ~2,500.
 */
export const CAPTION_FETCH_COST_UNITS = 6_000;
export const CAPTION_FETCH_MODEL_LABEL = 'supadata-youtube-captions';

/** A playlist expansion is also one flat credit, so it is priced identically. */
export const PLAYLIST_FETCH_COST_UNITS = CAPTION_FETCH_COST_UNITS;
export const PLAYLIST_FETCH_MODEL_LABEL = 'supadata-youtube-playlist';

export function isSelfHostedInstance(): boolean {
  return env.PUBLIC_IS_SELFHOSTED === 'true';
}

/**
 * Whether an org may use Supadata at all — captions and playlist expansion alike.
 * Self-hosted is ungated because it brings its own key.
 */
export async function canOrgFetchYoutubeCaptions(orgId: string): Promise<boolean> {
  const planName = await getOrgPlanName(orgId);

  return canFetchYouTubeCaptions(planName, isSelfHostedInstance());
}
