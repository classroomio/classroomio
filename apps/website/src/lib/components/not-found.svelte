<script>
  import { goto } from '$app/navigation';
  import { Empty } from '@cio/ui/custom/empty';
  import { MachineBrokenTrack, MachineRunnerBorder } from '@cio/ui/custom/animation';
  import CtaButton from './ui/cta-button.svelte';

  /**
   * @typedef {Object} Props
   * @property {boolean} [isOrg]
   * @property {string} [className]
   */

  /** @type {Props} */
  let { isOrg = false, className = '' } = $props();

  let runnerState = $state({ status: 'idle', passed: 0, isNewRecord: false });

  const isPlaying = $derived(runnerState.status !== 'idle');

  function handleClick() {
    return goto('https://classroomio.com');
  }
</script>

{#snippet gameBorder()}
  <MachineRunnerBorder snapshot={runnerState} />
{/snippet}

{#snippet brokenTrack()}
  <div class="mx-auto w-full {isPlaying ? '' : 'h-72 max-w-[480px]'}" style:--machine-face="var(--color-white)">
    <MachineBrokenTrack onstatechange={(next) => (runnerState = next)} />
  </div>
{/snippet}

<div class="{className} flex min-h-[80vh] w-full items-center justify-center px-6">
  <Empty
    title={isOrg ? "Organization doesn't exist!" : 'Page not found'}
    description="The page you are looking for doesn't exist or has been moved. Please go back to the homepage."
    media={brokenTrack}
    size="lg"
    mediaOnly={isPlaying}
    overlay={isPlaying ? gameBorder : undefined}
    variant="page"
  >
    <CtaButton onclick={handleClick}>Go Home</CtaButton>
  </Empty>
</div>
