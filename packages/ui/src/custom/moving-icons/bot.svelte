<script lang="ts">
  interface IconProps {
    color?: string;
    size?: number;
    strokeWidth?: number;
    class?: string;
    /** When provided, the bot's eyes track the cursor as it moves within this element. */
    trackElement?: HTMLElement | null;
    /** Maximum eye offset in SVG units. Larger = eyes move further when looking around. */
    maxEyeOffset?: number;
    /** Distance in px from the bot at which eye offset saturates. */
    trackRadius?: number;
  }

  let {
    color = 'currentColor',
    size = 24,
    strokeWidth = 2,
    class: className = '',
    trackElement = null,
    maxEyeOffset = 1.6,
    trackRadius = 240
  }: IconProps = $props();

  let eyeY1 = $state(13);
  let eyeY2 = $state(15);
  let eyeOffsetX = $state(0);
  let eyeOffsetY = $state(0);
  let isBlinking = $state(false);
  let svgEl = $state<SVGSVGElement | null>(null);

  function animateEyes(
    startY1: number,
    startY2: number,
    endY1: number,
    endY2: number,
    duration: number,
    delay = 0
  ): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const startTime = performance.now();
        const step = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          eyeY1 = startY1 + (endY1 - startY1) * eased;
          eyeY2 = startY2 + (endY2 - startY2) * eased;

          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(step);
      }, delay);
    });
  }

  function blink() {
    if (isBlinking) return;
    isBlinking = true;
    animateEyes(13, 15, 14, 14, 250, 200).then(() =>
      animateEyes(14, 14, 13, 15, 250).then(() => {
        isBlinking = false;
      })
    );
  }

  function handleTrackMove(event: MouseEvent) {
    if (!svgEl) return;

    const rect = svgEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const distance = Math.hypot(dx, dy);

    if (distance === 0) {
      eyeOffsetX = 0;
      eyeOffsetY = 0;
      return;
    }

    const magnitude = Math.min(distance / trackRadius, 1);
    eyeOffsetX = (dx / distance) * maxEyeOffset * magnitude;
    eyeOffsetY = (dy / distance) * maxEyeOffset * magnitude;
  }

  function handleTrackLeave() {
    eyeOffsetX = 0;
    eyeOffsetY = 0;
  }

  $effect(() => {
    if (!trackElement) return;

    trackElement.addEventListener('mousemove', handleTrackMove);
    trackElement.addEventListener('mouseleave', handleTrackLeave);
    return () => {
      trackElement.removeEventListener('mousemove', handleTrackMove);
      trackElement.removeEventListener('mouseleave', handleTrackLeave);
    };
  });
</script>

<div class={className} aria-label="bot" role="img" onmouseenter={blink}>
  <svg
    bind:this={svgEl}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-linejoin="round"
    class="bot-icon"
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <line
      x1={15 + eyeOffsetX}
      y1={eyeY1 + eyeOffsetY}
      x2={15 + eyeOffsetX}
      y2={eyeY2 + eyeOffsetY}
      class="eye eye-right"
    />
    <line
      x1={9 + eyeOffsetX}
      y1={eyeY1 + eyeOffsetY}
      x2={9 + eyeOffsetX}
      y2={eyeY2 + eyeOffsetY}
      class="eye eye-left"
    />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .bot-icon {
    overflow: visible;
    transition: stroke 220ms ease-out;
  }
  .eye {
    transition:
      transform 120ms ease-out,
      x 120ms ease-out,
      y 120ms ease-out;
  }
</style>
