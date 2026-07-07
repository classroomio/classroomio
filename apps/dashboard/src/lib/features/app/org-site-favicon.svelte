<script lang="ts">
  import type { AccountOrg } from '$features/app/types';
  import { getOrgFaviconHref } from '$lib/utils/functions/org-branding';

  interface Props {
    org: Pick<AccountOrg, 'favicon' | 'avatarUrl'> | null | undefined;
  }

  let { org }: Props = $props();

  const faviconHref = $derived(getOrgFaviconHref(org));
</script>

<svelte:head>
  {#if faviconHref}
    <link rel="icon" href={faviconHref} />
  {/if}
</svelte:head>
