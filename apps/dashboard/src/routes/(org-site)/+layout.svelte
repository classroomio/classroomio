<script lang="ts">
  import type { AccountOrg } from '$features/app/types';
  import { PageRestricted } from '$features/ui';
  import { setTheme } from '$lib/utils/functions/theme';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';
  import { user } from '$lib/utils/store/user';
  import { onMount } from 'svelte';

  interface Props {
    children?: import('svelte').Snippet;
    data: {
      isOrgSite: boolean;
      orgSiteName: string;
      org: AccountOrg | null;
      locals: App.Locals;
    };
  }

  let { children, data }: Props = $props();

  onMount(() => {
    const loadingIndicator = document.getElementById('app-loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }

    if (data?.locals?.user) {
      user.set({
        ...$user,
        isLoggedIn: true,
        currentSession: data.locals.user
      });
    }

    if (!data.isOrgSite || !data.org) return;

    $globalStore.orgSiteName = data.orgSiteName || '';
    $globalStore.isOrgSite = data.isOrgSite;

    currentOrg.set(data.org);
    setTheme(data.org.theme || 'blue');
  });
</script>

{#if data.org?.isRestricted || $currentOrg.isRestricted}
  <PageRestricted />
{:else}
  {@render children?.()}
{/if}
