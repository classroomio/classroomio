<script>
  import { page } from '$app/stores';

  import { PageNotFound } from '$lib/components/Page';

  $: query = new URLSearchParams($page.url.search);
  $: isOrg = query.get('type') === 'org';
</script>

<PageNotFound {isOrg} />
