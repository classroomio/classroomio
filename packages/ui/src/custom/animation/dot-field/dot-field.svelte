<script module lang="ts">
  const TWO_PI = Math.PI * 2;

  /** Resolves `color-mix(in srgb, var(--primary) …)` for canvas dot fills (inherits `--primary` from this component’s DOM subtree). */
  function primaryMixOnRoot(el: HTMLElement, primaryPercent: number): string {
    const probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText =
      'position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;' +
      `color:var(--primary)`;
    el.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();

    return resolved || 'rgba(128, 128, 128, 0.25)';
  }

  type Dot = {
    ax: number;
    ay: number;
    sx: number;
    sy: number;
    vx: number;
    vy: number;
    x: number;
    y: number;
  };
</script>

<script lang="ts">
  import { cn } from '../../../tools';

  type Props = {
    dotRadius?: number;
    dotSpacing?: number;
    cursorRadius?: number;
    cursorForce?: number;
    bulgeOnly?: boolean;
    bulgeStrength?: number;
    glowRadius?: number;
    sparkle?: boolean;
    waveAmplitude?: number;
    glowColor?: string;
    class?: string;
  };

  let {
    dotRadius = 1.5,
    dotSpacing = 14,
    cursorRadius = 500,
    cursorForce = 0.1,
    bulgeOnly = true,
    bulgeStrength = 67,
    glowRadius = 160,
    sparkle = false,
    waveAmplitude = 0,
    glowColor = '#ffffff',
    class: className = ''
  }: Props = $props();

  let root: HTMLDivElement | undefined;
  let canvas: HTMLCanvasElement | undefined;
  let glowEl: SVGCircleElement | undefined;
  const glowId = `dot-field-glow-${crypto.randomUUID().slice(0, 10)}`;

  let dots: Dot[] = [];
  const mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
  let size = { w: 0, h: 0, offsetX: 0, offsetY: 0 };
  let glowOpacity = 0;
  let engagement = 0;

  $effect(() => {
    void dotRadius;
    void dotSpacing;
    void cursorRadius;
    void cursorForce;
    void bulgeOnly;
    void bulgeStrength;
    void sparkle;
    void waveAmplitude;
    void glowColor;

    const currentGlow = glowEl;
    if (!canvas || !root) return;

    const canvasEl: HTMLCanvasElement = canvas;
    const rootEl: HTMLDivElement = root;

    const fillGradientFrom = primaryMixOnRoot(rootEl, 40);
    const fillGradientTo = primaryMixOnRoot(rootEl, 22);

    const ctx = canvasEl.getContext('2d', { alpha: true });

    if (!ctx) return;

    const context = ctx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let resizeTimer: ReturnType<typeof setTimeout>;
    let raf = 0;
    let frameCount = 0;

    function buildDots(w: number, h: number) {
      const step = dotRadius + dotSpacing;
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      const nextDots: Dot[] = new Array(rows * cols);
      let idx = 0;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ax = padX + col * step + step / 2;
          const ay = padY + row * step + step / 2;
          nextDots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
        }
      }

      dots = nextDots;
    }

    function doResize() {
      const rect = rootEl.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      canvasEl.width = w * dpr;
      canvasEl.height = h * dpr;
      canvasEl.style.width = `${w}px`;
      canvasEl.style.height = `${h}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      size = {
        w,
        h,
        offsetX: rect.left + window.scrollX,
        offsetY: rect.top + window.scrollY
      };

      buildDots(w, h);
    }

    function resize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 100);
    }

    function onMouseMove(e: MouseEvent) {
      mouse.x = e.pageX - size.offsetX;
      mouse.y = e.pageY - size.offsetY;
    }

    function updateMouseSpeed() {
      const dx = mouse.prevX - mouse.x;
      const dy = mouse.prevY - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      mouse.speed += (dist - mouse.speed) * 0.5;
      if (mouse.speed < 0.001) mouse.speed = 0;
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
    }

    const speedInterval = setInterval(updateMouseSpeed, 20);

    function tick() {
      frameCount++;
      const len = dots.length;
      const { w, h } = size;
      const t = frameCount * 0.02;

      const targetEngagement = Math.min(mouse.speed / 5, 1);
      engagement += (targetEngagement - engagement) * 0.06;
      if (engagement < 0.001) engagement = 0;

      glowOpacity += (engagement - glowOpacity) * 0.08;
      if (currentGlow) {
        currentGlow.setAttribute('cx', String(mouse.x));
        currentGlow.setAttribute('cy', String(mouse.y));
        currentGlow.style.opacity = String(glowOpacity);
      }

      context.clearRect(0, 0, w, h);
      const grad = context.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, fillGradientFrom);
      grad.addColorStop(1, fillGradientTo);
      context.fillStyle = grad;

      const crSq = cursorRadius * cursorRadius;
      const rad = dotRadius / 2;

      context.beginPath();

      for (let i = 0; i < len; i++) {
        const d = dots[i];
        const dx = mouse.x - d.ax;
        const dy = mouse.y - d.ay;
        const distSq = dx * dx + dy * dy;

        if (distSq < crSq && engagement > 0.01) {
          const dist = Math.sqrt(distSq);
          const angle = Math.atan2(dy, dx);
          if (bulgeOnly) {
            const falloff = 1 - dist / cursorRadius;
            const push = falloff * falloff * bulgeStrength * engagement;
            d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
            d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
          } else {
            const safeDist = Math.max(dist, 0.001);
            const move = (500 / safeDist) * (mouse.speed * cursorForce);
            d.vx += Math.cos(angle) * -move;
            d.vy += Math.sin(angle) * -move;
          }
        } else if (bulgeOnly) {
          d.sx += (d.ax - d.sx) * 0.1;
          d.sy += (d.ay - d.sy) * 0.1;
        }

        if (!bulgeOnly) {
          d.vx *= 0.9;
          d.vy *= 0.9;
          d.x = d.ax + d.vx;
          d.y = d.ay + d.vy;
          d.sx += (d.x - d.sx) * 0.1;
          d.sy += (d.y - d.sy) * 0.1;
        }

        let drawX = d.sx;
        let drawY = d.sy;
        if (waveAmplitude > 0) {
          drawY += Math.sin(d.ax * 0.03 + t) * waveAmplitude;
          drawX += Math.cos(d.ay * 0.03 + t * 0.7) * waveAmplitude * 0.5;
        }

        if (sparkle) {
          const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0;
          if (hash % 100 < 3) {
            context.moveTo(drawX + rad * 1.8, drawY);
            context.arc(drawX, drawY, rad * 1.8, 0, TWO_PI);
          } else {
            context.moveTo(drawX + rad, drawY);
            context.arc(drawX, drawY, rad, 0, TWO_PI);
          }
        } else {
          context.moveTo(drawX + rad, drawY);
          context.arc(drawX, drawY, rad, 0, TWO_PI);
        }
      }

      context.fill();
      raf = requestAnimationFrame(tick);
    }

    doResize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(speedInterval);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  });
</script>

<div bind:this={root} class={cn('relative h-full w-full', className)}>
  <canvas bind:this={canvas} class="absolute inset-0 h-full w-full"></canvas>
  <svg class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
    <defs>
      <radialGradient id={glowId}>
        <stop offset="0%" stop-color="#fff" />
        <stop offset="100%" stop-color="#fff" />
      </radialGradient>
    </defs>
    <circle
      bind:this={glowEl}
      cx="-9999"
      cy="-9999"
      r={glowRadius}
      fill="url(#{glowId})"
      style:opacity="0"
      style:will-change="opacity"
    />
  </svg>
</div>
