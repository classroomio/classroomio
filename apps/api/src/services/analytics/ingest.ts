import { insertPageEvents } from '@cio/db/queries/analytics';
import type { TIngestBatch, TTrackEvent } from '@cio/utils/validation/dash';

type EnrichmentContext = {
  country: string | null;
  userAgent: string | null;
  userId: string | null;
};

function deriveDeviceType(userAgent: string | null): string | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return 'tablet';
  if (/mobi|android|iphone|ipod/.test(ua)) return 'mobile';
  if (/bot|crawler|spider|crawling/.test(ua)) return 'bot';
  return 'desktop';
}

function clampCountry(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toUpperCase();
  if (trimmed.length !== 2) return null;
  return trimmed;
}

export async function ingestEventBatch(batch: TIngestBatch, ctx: EnrichmentContext) {
  const occurredAtFallback = new Date().toISOString();
  const country = clampCountry(ctx.country);
  const deviceType = deriveDeviceType(ctx.userAgent);

  const rows = batch.events.map((event: TTrackEvent) => ({
    occurredAt: event.occurredAt ?? occurredAtFallback,
    sessionId: batch.sessionId,
    eventType: event.eventType,
    orgId: event.orgId ?? null,
    userId: ctx.userId,
    courseId: event.courseId ?? null,
    noteId: event.noteId ?? null,
    path: event.path ?? null,
    referrerHost: event.referrerHost ?? null,
    utmSource: event.utmSource ?? null,
    utmMedium: event.utmMedium ?? null,
    utmCampaign: event.utmCampaign ?? null,
    country,
    deviceType,
    locale: event.locale ?? null,
    props: (event.props ?? {}) as Record<string, unknown>
  }));

  const inserted = await insertPageEvents(rows);
  return { inserted };
}
