<script lang="ts">
  import { PageRestricted } from '$features/ui';
  import { currentOrg } from '$lib/utils/store/org';

  interface Props {
    children?: import('svelte').Snippet;
    data: {
      isOrgSite: boolean;
      org: import('$features/app/types').AccountOrg | null;
    };
  }

  let { children, data }: Props = $props();
</script>

{#if data.org?.isRestricted || $currentOrg.isRestricted}
  <PageRestricted />
{:else}
  {@render children?.()}
{/if}
