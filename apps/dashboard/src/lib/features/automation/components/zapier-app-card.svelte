<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import * as Card from '@cio/ui/base/card';
  import type { TZapierPartnerApp } from '@cio/utils/constants/zapier';

  import ZapierAppMark from '$features/automation/components/zapier-app-mark.svelte';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    app: TZapierPartnerApp;
    description: string;
    href: string;
    logoUrl?: string | null;
  }

  let { app, description, href, logoUrl = null }: Props = $props();

  const T = 'automation.zapier.directory';
</script>

<a
  {href}
  class="ui:focus-visible:ring-ring/50 block rounded-lg focus-visible:ring-[3px] focus-visible:outline-none"
  data-testid="zapier-app-card-{app.slug}"
>
  <Card.Root class="ui:hover:border-ring h-full gap-0 px-3.5 py-3.5 transition-colors">
    <div class="flex items-start gap-3">
      <ZapierAppMark {app} {logoUrl} size="sm" />

      <div class="min-w-0 flex-1">
        <p class="text-[13.5px] leading-tight font-semibold tracking-[-0.01em]">{app.name}</p>
        <p class="ui:text-muted-foreground mt-0.5 text-xs leading-[1.45]">{description}</p>
        <p class="ui:text-muted-foreground mt-1 text-[11.5px]">
          {$t('automation.zapier.recipes.ways_to_use', { count: app.recipes.length })}
        </p>

        {#if app.isPopular}
          <Badge variant="secondary" class="mt-1.5">{$t(`${T}.popular`)}</Badge>
        {:else if app.isRecent}
          <Badge variant="outline" class="mt-1.5">{$t(`${T}.recent`)}</Badge>
        {/if}
      </div>
    </div>
  </Card.Root>
</a>
