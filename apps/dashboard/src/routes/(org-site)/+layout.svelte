<script lang="ts">
  import { PageRestricted } from '$features/ui';
  import OrgSiteFavicon from '$features/app/org-site-favicon.svelte';
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
    analytics.pageView({ kind: 'landing' });
  });

  afterNavigate(({ to }) => {
    if (!to) return;

    const isCoursePage = /\/course\//.test(to.url.pathname);
    analytics.pageView({
      kind: isCoursePage ? 'course' : 'landing',
      path: to.url.pathname
    });
  });
</script>

<OrgSiteFavicon org={data.org} />

{#if data.org?.isRestricted || $currentOrg.isRestricted}
  <PageRestricted />
{:else}
  {@render children?.()}
{/if}
