<script lang="ts">
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import type { TZapierPartnerApp } from '@cio/utils/constants/zapier';

  import ZapierAppCard from '$features/automation/components/zapier-app-card.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';

  interface Props {
    title: string;
    apps: TZapierPartnerApp[];
  }

  let { title, apps }: Props = $props();

  const directoryPath = $derived(`${$currentOrgPath}/automation/zapier/apps`);
</script>

<Field.Set class="gap-3">
  <div class="flex items-center justify-between gap-2">
    <Field.Legend class="mb-0">{title}</Field.Legend>
    <Button variant="link" size="sm" href={directoryPath} class="px-0" testId="zapier-see-all-apps">
      {$t('automation.zapier.see_all_apps')}
      <ArrowRightIcon size={14} />
    </Button>
  </div>
  <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
    {#each apps as app (app.slug)}
      <ZapierAppCard {app} href={`${directoryPath}/${app.slug}`} compact />
    {/each}
  </div>
</Field.Set>
