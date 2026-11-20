<script lang="ts">
  import { resolve } from '$app/paths';
  import * as Card from '@cio/ui/base/card';
  import type { TZapierPartnerApp } from '@cio/utils/constants/zapier';

  import ZapierAppMark from '$features/automation/components/zapier-app-mark.svelte';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    app: TZapierPartnerApp;
    href: string;
    /** Name-only card for compact rows such as related apps. */
    compact?: boolean;
  }

  let { app, href, compact = false }: Props = $props();
</script>

<a
  href={resolve(href, {})}
  class="ui:focus-visible:ring-ring/50 block h-full rounded-xl focus-visible:ring-[3px] focus-visible:outline-none"
  data-testid="zapier-app-card-{app.slug}"
>
  {#if compact}
    <Card.Root class="ui:hover:bg-muted/50 h-full flex-row items-center gap-3 p-3 transition-colors">
      <ZapierAppMark {app} />
      <p class="min-w-0 truncate text-sm font-medium">{app.name}</p>
    </Card.Root>
  {:else}
    <Card.Root class="ui:hover:border-ring h-full gap-0 px-3.5 py-3.5 transition-colors">
      <div class="flex items-start gap-3">
        <ZapierAppMark {app} size="sm" />

        <div class="min-w-0 flex-1">
          <p class="text-[13.5px] leading-tight font-semibold tracking-[-0.01em]">{app.name}</p>
          <p class="ui:text-muted-foreground mt-0.5 text-xs leading-[1.45]">
            {$t(`automation.zapier.apps.${app.slug}.description`)}
          </p>
          <p class="ui:text-muted-foreground mt-1 text-[11.5px]">
            {$t('automation.zapier.recipes.ways_to_use', { count: app.recipes.length })}
          </p>
        </div>
      </div>
    </Card.Root>
  {/if}
</a>
