<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import ClockIcon from '@lucide/svelte/icons/clock';

  interface Props {
    tabName: string;
  }

  let { tabName }: Props = $props();
</script>

<div class="mx-auto max-w-[720px] py-12">
  <Card.Root class="flex flex-col items-center justify-center border-dashed p-10 text-center">
    <div class="ui:bg-primary/10 ui:text-primary mb-4 flex size-12 items-center justify-center rounded-xl">
      <ClockIcon class="size-6" />
    </div>

    <h2 class="text-foreground mb-2 text-lg font-semibold">
      {tabName} — Coming Soon
    </h2>

    <p class="text-muted-foreground max-w-[48ch] text-sm">
      This workspace tab will be available in Phase 3. Course management and setup are fully functional in this release.
    </p>
  </Card.Root>
</div>
