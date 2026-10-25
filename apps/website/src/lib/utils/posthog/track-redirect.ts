import { redirect, type RequestEvent } from '@sveltejs/kit';
import { client } from '$lib/utils/posthog';
import { getDistinctId } from '$lib/utils/posthog/distinct-id';

type TrackContext = Pick<RequestEvent, 'request' | 'platform'>;

/** Captures the event and keeps the Worker alive until PostHog has it. */
export async function trackEvent({ request, platform }: TrackContext, event: string): Promise<void> {
  client.capture({ distinctId: getDistinctId(request), event });

  const flushPromise = client.flushAsync().catch(() => undefined);

  if (platform?.ctx) {
    platform.ctx.waitUntil(flushPromise);
  } else {
    await flushPromise;
  }
}

export async function trackAndRedirect(context: TrackContext, event: string, destination: string): Promise<void> {
  await trackEvent(context, event);

  redirect(307, destination);
}
