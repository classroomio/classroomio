<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';

  interface Props {
    rowCount?: number;
  }

  let { rowCount = 20 }: Props = $props();
</script>

<div class="space-y-2">
  {#each Array(rowCount) as _, i (i)}
    <Skeleton class="h-12 w-full" />
  {/each}
</div>
