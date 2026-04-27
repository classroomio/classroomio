<script lang="ts">
  import { page } from '$app/state';

  import { UpgradeModal, PageLoadProgress, PageRestricted } from '$features/ui';
  import { CommandPalette, KeyboardShortcutListener } from '$features/search';
  import { isPublicRoute } from '$lib/utils/functions/routes/isPublicRoute';
  import { currentOrg } from '$lib/utils/store/org';
  import { authClient } from '$lib/utils/services/auth/client';

  interface Props {
    children?: import('svelte').Snippet;
    data: {
      isOrgSite: boolean;
      orgSiteName: string;
      org: import('$features/app/types').AccountOrg | null;
      skipAuth: boolean;
      locals: App.Locals;
    };
  }

  let { children, data }: Props = $props();

  let path = $derived(page.url.pathname);

  const session = authClient.useSession();

  $effect(() => {
    if ($session.isPending || $session.isRefetching || !!$session.data) {
      return;
    }

    if (data.skipAuth) return;

    if (isPublicRoute(path) && (path !== '/' || data.isOrgSite)) {
      return;
    }

    if (!$session.data && !path.startsWith('/login')) {
      window.location.href = '/login';
    }
  });
</script>

<UpgradeModal />
<CommandPalette />
<KeyboardShortcutListener />

{#if data.org?.isRestricted || $currentOrg.isRestricted}
  <PageRestricted />
{:else}
  <PageLoadProgress zIndex={10000} />

  {@render children?.()}
{/if}
