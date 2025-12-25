<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  import * as Page from '@cio/ui/base/page';
</script>

<Page.Root class="w-full pb-10 md:max-w-3xl lg:mx-auto">
  {@render children?.()}
</Page.Root>
