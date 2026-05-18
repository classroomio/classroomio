<script lang="ts">
  import * as Page from '@cio/ui/base/page';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<Page.Root class="w-full pb-10">
  {@render children?.()}
</Page.Root>
