<script lang="ts">
  import { PageRestricted } from '$features/ui';
  import { currentOrg } from '$lib/utils/store/org';
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { analytics } from '@cio/analytics/client';
  import { getRequestBaseUrl } from '$lib/utils/services/api';
  import type { Snippet } from 'svelte';
  import type { AccountOrg } from '$features/app/types';

  interface Props {
    children?: Snippet;
    data: {
      isOrgSite: boolean;
      org: AccountOrg | null;
    };
  }

  let { children, data }: Props = $props();

  onMount(() => {
    const apiBaseUrl = getRequestBaseUrl();
    if (!apiBaseUrl) return;

    analytics.init({
      endpoint: `${apiBaseUrl.replace(/\/$/, '')}/dash/track`,
      orgId: data.org?.id ?? undefined
    });

    if (!/^\/note\//.test(window.location.pathname)) {
      analytics.pageView({ kind: 'landing' });
    }
  });

  afterNavigate(({ to }) => {
    if (!to) return;

    const path = to.url.pathname;
    if (/^\/note\//.test(path)) return;

    const isCoursePage = /\/course\//.test(path);
    analytics.pageView({
      kind: isCoursePage ? 'course' : 'landing',
      path
    });
  });
</script>

{#if data.org?.isRestricted || $currentOrg.isRestricted}
  <PageRestricted />
{:else}
  {@render children?.()}
{/if}
