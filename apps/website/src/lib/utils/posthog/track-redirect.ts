import { redirect, type RequestEvent } from '@sveltejs/kit';
import { client } from '$lib/utils/posthog';
import { getDistinctId } from '$lib/utils/posthog/distinct-id';

export async function trackAndRedirect(
  { request, platform }: Pick<RequestEvent, 'request' | 'platform'>,
  event: string,
  destination: string
): Promise<void> {
  client.capture({ distinctId: getDistinctId(request), event });

  const flushPromise = client.flushAsync().catch(() => undefined);

  if (platform?.ctx) {
    platform.ctx.waitUntil(flushPromise);
  } else {
    await flushPromise;
  }

  redirect(307, destination);
}
