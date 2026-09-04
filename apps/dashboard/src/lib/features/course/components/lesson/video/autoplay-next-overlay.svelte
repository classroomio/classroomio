<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import XIcon from '@lucide/svelte/icons/x';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    nextLessonTitle: string;
    countdownDuration?: number;
    onCancel: () => void;
    onNavigate: () => void;
  }

  let { nextLessonTitle, countdownDuration = 5, onCancel, onNavigate }: Props = $props();

  let remaining = $state(countdownDuration);
  let timer: ReturnType<typeof setInterval> | null = null;

  const RING_RADIUS = 45;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const progress = $derived(((countdownDuration - remaining) / countdownDuration) * 100);
  const strokeDashoffset = $derived(RING_CIRCUMFERENCE * (1 - progress / 100));

  onMount(() => {
    timer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timer!);
        timer = null;
        onNavigate();
      }
    }, 1000);
  });

  onDestroy(() => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  });
</script>

<div
  class="absolute inset-0 z-30 flex items-center justify-center rounded-md bg-black/80"
  role="dialog"
  aria-label={$t('course.autoplay.up_next')}
>
  <div class="flex flex-col items-center gap-4 text-center">
    <div class="relative">
      <svg
        class="size-20 -rotate-90"
        style="transform-box: fill-box; transform-origin: center;"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          stroke-width="6"
          class="text-white/20"
        />
        <circle
          cx="50"
          cy="50"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          stroke-width="6"
          stroke-linecap="round"
          class="text-white transition-[stroke-dashoffset] duration-1000 ease-linear"
          stroke-dasharray={RING_CIRCUMFERENCE}
          stroke-dashoffset={strokeDashoffset}
        />
      </svg>
      <div class="absolute inset-0 flex items-center justify-center">
        <span class="text-lg font-semibold text-white">{remaining}</span>
      </div>
    </div>

    <div class="flex flex-col items-center gap-1">
      <span class="text-sm text-white/60">{$t('course.autoplay.up_next')}</span>
      <span class="max-w-[240px] truncate text-base font-medium text-white">{nextLessonTitle}</span>
    </div>

    <button
      type="button"
      class="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
      onclick={onCancel}
    >
      <XIcon size={14} />
      {$t('course.autoplay.cancel')}
    </button>
  </div>
</div>
