<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { ORG_ANALYTICS_PAGE } from '@cio/utils/constants/analytics-pages';

  $effect(() => {
    if ($isOrgAdmin === null) return;

    const child = $isOrgAdmin ? ORG_ANALYTICS_PAGE.slug : 'marketing';
    void goto(`/org/${page.params.slug}/analytics/${child}`, { replaceState: true });
  });
</script>
