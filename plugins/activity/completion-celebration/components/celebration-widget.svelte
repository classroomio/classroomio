<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { Sparkles, Trophy, Share2, Check } from '@lucide/svelte';
  import { isCourseLearnerView, isOrgStudent, isStudentExperience } from '$lib/utils/store/app';

  interface Props {
    courseTitle?: string;
    orgName?: string;
    certificate?: {
      id?: string;
      code?: string;
      recipientName?: string;
      courseTitle?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }

  let { courseTitle = '', orgName = '', certificate = {} }: Props = $props();
  const isLearner = $derived(Boolean($isCourseLearnerView || $isOrgStudent || $isStudentExperience));
  const displayTitle = $derived(courseTitle || certificate?.courseTitle || '');

  let canvasEl: HTMLCanvasElement | null = $state(null);
  let animationId: number | null = null;
  let copied = $state(false);

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    opacity: number;
  }

  function shootConfetti() {
    if (!browser || !canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const width = (canvasEl.width = canvasEl.offsetWidth);
    const height = (canvasEl.height = canvasEl.offsetHeight);

    const colors = [
      'hsl(217, 91%, 60%)',
      'hsl(142, 71%, 45%)',
      'hsl(38, 92%, 50%)',
      'hsl(330, 81%, 60%)',
      'hsl(262, 83%, 58%)',
      'hsl(189, 94%, 43%)'
    ];
    const particles: Particle[] = Array.from({ length: 65 }, () => ({
      x: width / 2,
      y: height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.8) * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 5 + 3,
      opacity: 1
    }));

    function step() {
      if (!ctx || !canvasEl) return;
      ctx.clearRect(0, 0, width, height);

      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.opacity -= 0.015;

        if (p.opacity > 0) {
          alive = true;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (alive) {
        animationId = requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }

    if (animationId) cancelAnimationFrame(animationId);
    step();
  }

  function handleShare() {
    if (!browser) return;
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      copied = true;
      setTimeout(() => (copied = false), 2500);
    });
  }

  onMount(() => {
    // Initial celebration burst
    if (!isLearner) return;
    const timer = setTimeout(shootConfetti, 400);
    return () => clearTimeout(timer);
  });

  onDestroy(() => {
    if (animationId && browser) cancelAnimationFrame(animationId);
  });
</script>

{#if isLearner}
  <div
    class="border-primary/20 from-primary/5 via-primary/10 relative my-4 overflow-hidden rounded-xl border bg-linear-to-r to-transparent p-4 shadow-xs sm:p-5"
  >
    <canvas bind:this={canvasEl} class="pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden="true"
    ></canvas>

    <div class="relative z-20 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div class="flex items-start gap-3.5">
        <div
          class="bg-primary/20 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-xs"
        >
          <Trophy class="h-5 w-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h4 class="text-foreground text-sm font-semibold sm:text-base">Outstanding Achievement!</h4>
            <span
              class="text-2xs inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300"
            >
              Certified
            </span>
          </div>
          <p class="text-muted-foreground mt-0.5 text-xs">
            You've successfully completed all requirements{displayTitle ? ` for ${displayTitle}` : ''}. Share your
            milestone with your network!
          </p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onclick={shootConfetti}
          class="border-border bg-background text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-2xs transition-colors"
        >
          <Sparkles class="h-3.5 w-3.5 text-amber-500" />
          <span>Celebrate</span>
        </button>

        <button
          type="button"
          onclick={handleShare}
          class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors"
        >
          {#if copied}
            <Check class="h-3.5 w-3.5" />
            <span>Link Copied!</span>
          {:else}
            <Share2 class="h-3.5 w-3.5" />
            <span>Share</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
