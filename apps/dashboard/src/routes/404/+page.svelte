<script>
  import { page } from '$app/state';

  import { PageNotFound } from '$lib/components/Page';

  let query = $derived(new URLSearchParams(page.url.search));
  let isOrg = $derived(query.get('type') === 'org');
</script>

<PageNotFound {isOrg} />
