import { CLIENT_EVENTS, type ClientEventType } from '../events/taxonomy';
import { getSessionId, isDoNotTrack } from './session';
import { sendBeacon } from './beacon';

type TrackProps = Record<string, string | number | boolean | null | undefined>;

type QueuedEvent = {
  eventType: ClientEventType;
  occurredAt: string;
  orgId?: string;
  courseId?: string;
  noteId?: string;
  path?: string;
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  locale?: string;
  props?: TrackProps;
};

type AnalyticsConfig = {
  endpoint: string;
  orgId?: string;
  batchSize?: number;
  flushIntervalMs?: number;
};

const DEFAULT_BATCH = 10;
const DEFAULT_INTERVAL = 2000;

let config: AnalyticsConfig | null = null;
let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let unloadBound = false;

function pickReferrerHost(): string | undefined {
  if (typeof document === 'undefined' || !document.referrer) return undefined;
  try {
    return new URL(document.referrer).host || undefined;
  } catch {
    return undefined;
  }
}

function pickUtm(): Pick<QueuedEvent, 'utmSource' | 'utmMedium' | 'utmCampaign'> {
  if (typeof window === 'undefined') return {};
  const params = new URL(window.location.href).searchParams;
  return {
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined
  };
}

function flush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!config || queue.length === 0) return;

  const sessionId = getSessionId();
  if (!sessionId) {
    // Session cookie not yet set by server hook; drop silently.
    queue = [];
    return;
  }

  const batch = queue;
  queue = [];
  sendBeacon(config.endpoint, { sessionId, events: batch });
}

function scheduleFlush() {
  if (!config || timer) return;
  timer = setTimeout(flush, config.flushIntervalMs ?? DEFAULT_INTERVAL);
}

function bindUnload() {
  if (unloadBound || typeof window === 'undefined') return;
  unloadBound = true;
  window.addEventListener('pagehide', flush);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

export function init(opts: AnalyticsConfig): void {
  if (isDoNotTrack()) return;
  config = { batchSize: DEFAULT_BATCH, flushIntervalMs: DEFAULT_INTERVAL, ...opts };
  bindUnload();
}

export function track(eventType: ClientEventType, fields: Partial<QueuedEvent> = {}): void {
  if (!config || isDoNotTrack()) return;

  const event: QueuedEvent = {
    eventType,
    occurredAt: new Date().toISOString(),
    orgId: fields.orgId ?? config.orgId,
    courseId: fields.courseId,
    noteId: fields.noteId,
    path: fields.path ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
    referrerHost: fields.referrerHost ?? pickReferrerHost(),
    locale: fields.locale ?? (typeof navigator !== 'undefined' ? navigator.language : undefined),
    props: fields.props,
    ...pickUtm()
  };

  queue.push(event);
  if (queue.length >= (config.batchSize ?? DEFAULT_BATCH)) {
    flush();
  } else {
    scheduleFlush();
  }
}

export function pageView(
  fields: Partial<QueuedEvent> & { kind?: 'landing' | 'course' | 'note' } = {}
): void {
  const eventType: ClientEventType =
    fields.kind === 'course'
      ? CLIENT_EVENTS.COURSE_PAGE_VIEW
      : fields.kind === 'note'
        ? CLIENT_EVENTS.NOTE_PAGE_VIEW
        : CLIENT_EVENTS.LANDING_VIEW;
  track(eventType, fields);
}

export function flushNow(): void {
  flush();
}

export const analytics = { init, track, pageView, flushNow };
