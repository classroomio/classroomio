<script>
  import { goto } from '$app/navigation';
  import { Empty } from '@cio/ui/custom/empty';
  import SearchXIcon from '@lucide/svelte/icons/search-x';
  import CtaButton from './ui/cta-button.svelte';

  /**
   * @typedef {Object} Props
   * @property {boolean} [isOrg]
   * @property {string} [className]
   */

  /** @type {Props} */
  let { isOrg = false, className = '' } = $props();

  function handleClick() {
    return goto('https://classroomio.com');
  }
</script>

<div class="{className} flex min-h-[80vh] w-full items-center justify-center px-6">
  <Empty
    title={isOrg ? "Organization doesn't exist!" : 'Page not found'}
    description="The page you are looking for doesn't exist or has been moved. Please go back to the homepage."
    icon={SearchXIcon}
    variant="page"
  >
    <CtaButton onclick={handleClick}>Go Home</CtaButton>
  </Empty>
</div>
