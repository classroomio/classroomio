<script lang="ts">
  import CirclePlayIcon from '@lucide/svelte/icons/circle-play';
  import { Button, type ButtonSize, type ButtonVariant } from '../../base/button';
  import VideoGuideDialog from './video-guide-dialog.svelte';

  interface Props {
    videoId: string;
    title: string;
    label: string;
    closeLabel?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    open?: boolean;
    class?: string;
    testId?: string;
  }

  let {
    videoId,
    title,
    label,
    closeLabel,
    variant = 'outline',
    size = 'default',
    open = $bindable(false),
    class: className,
    testId
  }: Props = $props();
</script>

<Button {variant} {size} class={className} {testId} onclick={() => (open = true)}>
  <CirclePlayIcon class="ui:size-4" />
  {label}
</Button>

<VideoGuideDialog bind:open {videoId} {title} {closeLabel} testId={testId ? `${testId}-dialog` : undefined} />
