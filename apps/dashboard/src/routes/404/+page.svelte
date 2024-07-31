<script>
  import { page } from '$app/stores';

  import NotFound from '$lib/components/NotFound/NotFound.svelte';

  $: query = new URLSearchParams($page.url.search);
  $: isOrg = query.get('type') === 'org';
</script>

<NotFound {isOrg} />
