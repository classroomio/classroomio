<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import { Button } from '@cio/ui/base/button';
  import * as EmptyBase from '@cio/ui/base/empty';
  import { MachineZapierNoZaps } from '@cio/ui/custom/animation';

  import ZapierOpenButton from '$features/automation/components/zapier-open-button.svelte';
  import { ZAPIER_URLS } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';

  const T = 'automation.zapier.zaps_empty';
</script>

<EmptyBase.Root class="ui:border-border w-full border border-dashed" data-testid="zapier-zaps-empty">
  <EmptyBase.Header>
    <EmptyBase.Media class="mb-3 w-full max-sm:hidden" style="--machine-face: var(--background)">
      <MachineZapierNoZaps class="mx-auto h-56 w-full max-w-[400px]" />
    </EmptyBase.Media>
    <EmptyBase.Title>{$t(`${T}.title`)}</EmptyBase.Title>
  </EmptyBase.Header>
  <EmptyBase.Content>
    <div class="flex flex-wrap justify-center gap-2">
      <ZapierOpenButton href={ZAPIER_URLS.editor} testId="zapier-empty-create-zap">
        {$t('automation.zapier.create_zap')}
        <ArrowUpRightIcon size={16} />
      </ZapierOpenButton>
      <Button variant="outline" href={`${$currentOrgPath}/automation/zapier/apps`} testId="zapier-explore-apps">
        {$t('automation.zapier.explore_apps')}
      </Button>
    </div>
  </EmptyBase.Content>
</EmptyBase.Root>
