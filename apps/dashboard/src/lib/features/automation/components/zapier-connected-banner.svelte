<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import { getZapierAccess, ZAPIER_URLS } from '$features/automation/utils/zapier-utils';
  import type { ZapierConnection } from '$features/automation/utils/types';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    connection: ZapierConnection;
    organizationName: string;
    zapsHref: string;
  }

  let { connection, organizationName, zapsHref }: Props = $props();

  const T = 'automation.zapier.app_page';
  const access = $derived(getZapierAccess(connection.scopes));
  const accessLabel = $derived(
    access === 'read_write' ? $t(`${T}.connected_read_write`) : $t(`${T}.connected_read_only`)
  );
</script>

<div
  class="mx-auto flex max-w-[760px] flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-green-600/20 bg-green-600/[0.08] px-3.5 py-2.5 text-[13px]"
  data-testid="zapier-connected-banner"
>
  <span class="size-2 shrink-0 rounded-full bg-green-600" aria-hidden="true"></span>

  <p class="min-w-0 flex-1">
    <span class="font-semibold">{$t(`${T}.connected_title`, { org: organizationName })}</span>
    <span class="ui:text-muted-foreground">{accessLabel}</span>
  </p>

  <a class="text-xs font-semibold underline underline-offset-[3px] hover:no-underline" href="{zapsHref}#zapier-access">
    {$t(`${T}.connected_view`)}
  </a>

  <a
    class="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-[3px] hover:no-underline"
    href={ZAPIER_URLS.connections}
    target="_blank"
    rel="noopener noreferrer"
  >
    {$t(`${T}.connected_zapier`)}
    <ArrowUpRightIcon class="custom size-3" />
  </a>
</div>
