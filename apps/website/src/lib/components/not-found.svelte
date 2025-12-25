<script>
  import { goto } from '$app/navigation';
  import { Empty } from '@cio/ui/custom/empty';
  import SearchXIcon from '@lucide/svelte/icons/search-x';
  import { Button } from '@cio/ui/base/button';

  /**
   * @typedef {Object} Props
   * @property {boolean} [isOrg]
   * @property {string} [className]
   */

  /** @type {Props} */
  let { isOrg = false, className = '' } = $props();

  function handleClick() {
    if (!isOrg) {
      return goto('/');
    }

    return goto('https://classroomio.com');
  }
</script>

<div class="{className} min-h-[80vh] w-screen flex items-center justify-center">

  <Empty
   title={isOrg ? 'Organization doesn\'t exist!' : 'Page not found'}
   description="The page you are looking for doesn't exist or has been moved. Please go back to the homepage."
   icon={SearchXIcon}
   variant="page"
   >
    <Button
      onclick={handleClick}
    >
      Go Home
    </Button>
  </Empty>
</div>
