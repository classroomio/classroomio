<script lang="ts">
  import { PageRestricted } from '$features/ui';
  import { currentOrg } from '$lib/utils/store/org';
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import { analytics } from '@cio/analytics/client';
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
    if (!env.PUBLIC_SERVER_URL) return;

    analytics.init({
      endpoint: `${env.PUBLIC_SERVER_URL.replace(/\/$/, '')}/dash/track`,
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

{#if data.org?.isRestricted || $currentOrg.isRestricted}
  <PageRestricted />
{:else}
  {@render children?.()}
{/if}
