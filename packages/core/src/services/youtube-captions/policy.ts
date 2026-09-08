import { canFetchYouTubeCaptions } from '@cio/utils/plans';

import { env } from '../../config/env';
import { getOrgPlanName } from '../agent/usage';

/**
 * Cost units debited from the org's AI credit balance per billed provider call.
 *
 * Supadata bills 1 credit flat per native-caption request at any video length.
 * Pro is $17 / 3,000 credits = $0.00567 per credit; token packs are
 * $5 / 5M units = $0.000001 per unit, so break-even is ~5,667 units. Rounded up
 * to 6,000, one fetch costs the same as ~6k model tokens — Early Adopter (3M)
 * gets ~500 fetches/month, Enterprise (15M) ~2,500.
 */
export const CAPTION_FETCH_COST_UNITS = 6_000;

/** `ai_token_usage.model` label for caption spend, so it is attributable in usage charts. */
export const CAPTION_FETCH_MODEL_LABEL = 'supadata-youtube-captions';

/**
 * A playlist expansion is also a single flat Supadata credit (video IDs only —
 * titles come from the free oEmbed endpoint), so it is priced identically.
 */
export const PLAYLIST_FETCH_COST_UNITS = CAPTION_FETCH_COST_UNITS;
export const PLAYLIST_FETCH_MODEL_LABEL = 'supadata-youtube-playlist';

export function isSelfHostedInstance(): boolean {
  return env.PUBLIC_IS_SELFHOSTED === 'true';
}

/**
 * The single source of truth for whether an org may spend a Supadata call on
 * YouTube data (captions and playlist expansion alike). Free (`BASIC`) cloud
 * orgs are blocked; self-hosted is ungated because it brings its own key.
 */
export async function canOrgFetchYoutubeCaptions(orgId: string): Promise<boolean> {
  const planName = await getOrgPlanName(orgId);

  return canFetchYouTubeCaptions(planName, isSelfHostedInstance());
}
