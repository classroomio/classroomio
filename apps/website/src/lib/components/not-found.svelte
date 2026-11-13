<script>
  import { goto } from '$app/navigation';
  import { Empty } from '@cio/ui/custom/empty';
  import { MachineBrokenTrack } from '@cio/ui/custom/animation';
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

{#snippet brokenTrack()}
  <div class="mx-auto h-52 w-full max-w-[340px]" style:--machine-face="var(--color-white)">
    <MachineBrokenTrack />
  </div>
{/snippet}

<div class="{className} flex min-h-[80vh] w-full items-center justify-center px-6">
  <Empty
    title={isOrg ? "Organization doesn't exist!" : 'Page not found'}
    description="The page you are looking for doesn't exist or has been moved. Please go back to the homepage."
    media={brokenTrack}
    variant="page"
  >
    <CtaButton onclick={handleClick}>Go Home</CtaButton>
  </Empty>
</div>
