<script>
  import { page } from '$app/state';
  import { Button } from '@cio/ui/base/button';
  import SearchXIcon from '@lucide/svelte/icons/search-x';
  import { Empty } from '@cio/ui/custom/empty';

  let query = $derived(new URLSearchParams(page.url.search));
  let isOrg = $derived(query.get('type') === 'org');

  function handleClick() {
    window.location.href = isOrg ? 'https://classroomio.com' : '/';
  }
</script>

<Empty
  title={isOrg ? "Organization doesn't exist!" : 'Page not found'}
  description="The page you are looking for doesn't exist or has been moved. Please go back to the homepage."
  icon={SearchXIcon}
  variant="page"
  layout="full-page"
  showLogo={true}
>
  <Button onclick={handleClick}>Back to Safety</Button>
</Empty>
