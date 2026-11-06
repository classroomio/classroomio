<script lang="ts">
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import * as Card from '@cio/ui/base/card';
  import { ZAPIER_PARTNER_APPS, type TZapierPartnerApp } from '@cio/utils/constants/zapier';

  import ZapierAppMark from '$features/automation/components/zapier-app-mark.svelte';
  import { getZapierSimilarApps } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';

  interface Props {
    app: TZapierPartnerApp;
  }

  let { app }: Props = $props();

  const T = 'automation.zapier.app_page';
  const similarApps = getZapierSimilarApps(app);
  const directoryPath = $derived(`${$currentOrgPath}/automation/zapier/apps`);
</script>

<section class="flex flex-col gap-3" data-testid="zapier-similar-apps">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <h2 class="text-xl font-semibold tracking-[-0.02em]">{$t(`${T}.similar_title`)}</h2>

    <a
      class="ui:text-primary inline-flex items-center gap-1 text-[13px] font-semibold hover:underline"
      href={directoryPath}
    >
      {$t(`${T}.similar_see_all`, { count: ZAPIER_PARTNER_APPS.length })}
      <ArrowRightIcon class="custom size-3" />
    </a>
  </div>

  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {#each similarApps as similarApp (similarApp.slug)}
      <a
        class="ui:focus-visible:ring-ring/50 block rounded-lg focus-visible:ring-[3px] focus-visible:outline-none"
        href="{directoryPath}/{similarApp.slug}"
        data-testid="zapier-similar-app-{similarApp.slug}"
      >
        <Card.Root class="ui:hover:border-ring h-full gap-1 rounded-[14px] p-3.5 transition-colors">
          <div class="mb-2 flex items-center" aria-hidden="true">
            <span
              class="flex size-9 items-center justify-center rounded-[10px] bg-[#0542CC] text-xs font-bold text-white"
            >
              C
            </span>
            <span class="ui:ring-card -ml-2 rounded-[10px] ring-2">
              <ZapierAppMark app={similarApp} size="sm" />
            </span>
          </div>

          <p class="text-[13.5px] leading-tight font-semibold">
            {$t('automation.zapier.app_sheet.title', { app: similarApp.name })}
          </p>
          <p class="ui:text-muted-foreground text-[12.5px] leading-[1.45]">
            {$t(`automation.zapier.apps.${similarApp.slug}.description`)}
          </p>
        </Card.Root>
      </a>
    {/each}
  </div>
</section>
