<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    tabName: string;
  }

  let { tabName }: Props = $props();
</script>

<div class="mx-auto max-w-180 py-12">
  <Card.Root class="flex flex-col items-center justify-center border-dashed p-10 text-center">
    <div class="ui:bg-primary/10 ui:text-primary mb-4 flex size-12 items-center justify-center rounded-xl">
      <ClockIcon class="size-6" />
    </div>

    <h2 class="text-foreground mb-2 text-lg font-semibold">
      {$t('learningPath.workspace.coming_soon.title', { tab: tabName })}
    </h2>

    <p class="text-muted-foreground max-w-[48ch] text-sm">
      {$t('learningPath.workspace.coming_soon.description')}
    </p>
  </Card.Root>
</div>
