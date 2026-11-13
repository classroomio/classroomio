<script lang="ts">
  import { PageRestricted } from '$features/ui';
  import { currentOrg } from '$lib/utils/store/org';
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { tracking } from '@cio/tracking/client';
  import { getRequestBaseUrl } from '$lib/utils/services/api';
  import type { Snippet } from 'svelte';
  import type { PublicOrg } from '$features/app/types';

  interface Props {
    children?: Snippet;
    data: {
      isOrgSite: boolean;
      org: PublicOrg | null;
    };
  }

  let { children, data }: Props = $props();

  onMount(() => {
    const apiBaseUrl = getRequestBaseUrl();
    if (!apiBaseUrl) return;

    tracking.init({
      endpoint: `${apiBaseUrl.replace(/\/$/, '')}/dash/track`,
      orgId: data.org?.id ?? undefined
    });
    tracking.pageView({ kind: 'landing' });
  });

  afterNavigate(({ to }) => {
    if (!to) return;

    const isCoursePage = /\/course\//.test(to.url.pathname);
    tracking.pageView({
      kind: isCoursePage ? 'course' : 'landing',
      path: to.url.pathname
    });
  });
</script>

{#if data.org?.isRestricted || $currentOrg.isRestricted}
  <PageRestricted />
{:else}
  {@render children?.()}
{/if}
