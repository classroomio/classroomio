<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    onCreatePath: () => void;
    onCreateCourse?: () => void;
  }

  let { onCreatePath, onCreateCourse }: Props = $props();
</script>

<div
  class="border-border bg-card/50 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center"
>
  <div class="bg-primary/10 text-primary mb-4 flex size-13 items-center justify-center rounded-xl">
    <PathIcon size={26} />
  </div>

  <h3 class="text-foreground mb-1.5 text-base font-semibold">
    {$t('learningPath.listing.empty.title')}
  </h3>

  <p class="text-muted-foreground mb-5 max-w-[44ch] text-sm">
    {$t('learningPath.listing.empty.description')}
  </p>

  <div class="flex flex-wrap items-center justify-center gap-2.5">
    {#if onCreateCourse}
      <Button variant="outline" onclick={onCreateCourse}>
        <PlusIcon class="mr-1.5 size-4" />
        {$t('learningPath.listing.empty.create_course')}
      </Button>
    {/if}
    <Button variant="primary" onclick={onCreatePath}>
      <PlusIcon class="mr-1.5 size-4" />
      {$t('learningPath.listing.empty.create_path')}
    </Button>
  </div>
</div>
