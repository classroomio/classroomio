<script>
  import { onMount } from 'svelte';

  /**
   * Reusable animated particle cloud, same family as the hero.
   *
   * @typedef {Object} ClusterSpec
   * @property {number} x         Normalized 0–1 x position
   * @property {number} y         Normalized 0–1 y position
   * @property {number} rx
   * @property {number} ry
   * @property {number} density
   * @property {number} warmth    0 (cool) → 1 (warm/brand blue)
   *
   * @typedef {Object} Props
   * @property {ClusterSpec[]} [clusters]   Density centers. Defaults to the hero's 4-cluster diagonal.
   * @property {number} [intensity]         Multiplier for particle count (default 1)
   * @property {boolean} [highlights]       Render glowing twinkle stars + constellation lines (default true)
   * @property {string} [class]             Extra classes for the canvas element
   */

  /** @type {Props} */
  let {
    clusters: clusterSpec = [
      { x: 0.3, y: 0.72, rx: 90, ry: 130, density: 0.55, warmth: 0.1 },
      { x: 0.52, y: 0.55, rx: 150, ry: 100, density: 0.95, warmth: 0.38 },
      { x: 0.74, y: 0.38, rx: 190, ry: 150, density: 1.25, warmth: 0.78 },
      { x: 0.92, y: 0.22, rx: 120, ry: 85, density: 0.7, warmth: 1.0 }
    ],
    intensity = 1,
    highlights: showHighlights = true,
    class: className = ''
  } = $props();

  let canvas;

  onMount(() => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let particles = [];
    let highlights = [];
    let clusters = [];
    let rafId;
    let time = 0;

    function warmRGB(wm) {
      const r = Math.round(110 - wm * 80);
      const g = Math.round(130 - wm * 50);
      const b = Math.round(180 + wm * 50);
      return [r, g, b];
    }

    function gaussian2d(rx, ry) {
      const u1 = Math.max(Math.random(), 1e-6);
      const u2 = Math.random();
      const r = Math.sqrt(-2 * Math.log(u1));
      const t = 2 * Math.PI * u2;
      return [r * Math.cos(t) * rx, r * Math.sin(t) * ry];
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      seed();
    }

    function seed() {
      particles = [];
      highlights = [];

      // Scale cluster sizes (and therefore particle counts) with viewport width.
      // Reference width is 1100px (the content max-width). Mobile shrinks to ~50%, never bigger than 1×.
      const scale = Math.max(0.5, Math.min(1, w / 1100));
      clusters = clusterSpec.map((c) => ({
        x: c.x * w,
        y: c.y * h,
        rx: c.rx * scale,
        ry: c.ry * scale,
        density: c.density,
        warmth: c.warmth
      }));

      for (const c of clusters) {
        const count = Math.floor(((c.rx * c.ry) / 18) * c.density * intensity);
        for (let i = 0; i < count; i++) {
          const [dx, dy] = gaussian2d(c.rx * 0.34, c.ry * 0.34);
          const z = Math.random();
          let r, a;
          if (z < 0.32) {
            r = 0.3 + Math.random() * 0.6;
            a = 0.1 + Math.random() * 0.18;
          } else if (z < 0.85) {
            r = 0.55 + Math.random() * 1.05;
            a = 0.28 + Math.random() * 0.38;
          } else {
            r = 1.0 + Math.random() * 1.6;
            a = 0.5 + Math.random() * 0.45;
          }
          particles.push({
            bx: c.x + dx,
            by: c.y + dy,
            r,
            a,
            warmth: Math.min(1, Math.max(0, c.warmth + (Math.random() - 0.5) * 0.18)),
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.7,
            amp: 0.6 + Math.random() * 1.8
          });
        }
      }

      const fringeCount = Math.floor(w * 0.18 * intensity);
      for (let i = 0; i < fringeCount; i++) {
        const c = clusters[1 + (i % Math.max(1, clusters.length - 1))] || clusters[0];
        const [dx, dy] = gaussian2d(c.rx * 1.4, c.ry * 1.4);
        particles.push({
          bx: c.x + dx,
          by: c.y + dy,
          r: 0.25 + Math.random() * 0.4,
          a: 0.06 + Math.random() * 0.15,
          warmth: c.warmth,
          phase: Math.random() * Math.PI * 2,
          speed: 0.2 + Math.random() * 0.4,
          amp: 0.8 + Math.random() * 1.6
        });
      }

      if (showHighlights) {
        const starCount = 38;
        for (let i = 0; i < starCount; i++) {
          const c = clusters[Math.max(0, clusters.length - 2) + (i % 2)] || clusters[0];
          const [dx, dy] = gaussian2d(c.rx * 0.45, c.ry * 0.45);
          highlights.push({
            x: c.x + dx,
            y: c.y + dy,
            r: 1.2 + Math.random() * 1.6,
            phase: Math.random() * Math.PI * 2,
            speed: 0.8 + Math.random() * 0.7,
            warmth: c.warmth
          });
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      time += 0.0035;

      ctx.globalCompositeOperation = 'source-over';
      for (const c of clusters) {
        const radius = Math.max(c.rx, c.ry) * 1.7;
        const [r, g, b] = warmRGB(c.warmth);
        const grd = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, radius);
        grd.addColorStop(0, `rgba(${r},${g},${b},${0.1 * c.density})`);
        grd.addColorStop(0.45, `rgba(${r},${g},${b},${0.04 * c.density})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(c.x - radius, c.y - radius, radius * 2, radius * 2);
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = Math.sin(time * p.speed + p.phase) * p.amp;
        const dy = Math.cos(time * p.speed * 0.65 + p.phase) * p.amp * 0.7;
        const x = p.bx + dx;
        const y = p.by + dy;
        const [r, g, b] = warmRGB(p.warmth);
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${p.a})`;
        ctx.fill();
      }

      if (showHighlights) {
        ctx.lineWidth = 0.55;
        for (let i = 0; i < highlights.length; i++) {
          const a = highlights[i];
          for (let j = i + 1; j < highlights.length; j++) {
            const b = highlights[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 12000) {
              const d = Math.sqrt(d2);
              const alpha = (1 - d / 110) * 0.22;
              if (alpha > 0) {
                const wm = (a.warmth + b.warmth) * 0.5;
                const [rr, gg, bb] = warmRGB(wm);
                ctx.strokeStyle = `rgba(${rr},${gg},${bb},${alpha})`;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
              }
            }
          }
        }

        ctx.globalCompositeOperation = 'screen';
        for (const hl of highlights) {
          const tw = 0.55 + 0.45 * Math.sin(time * hl.speed + hl.phase);
          const [r, g, b] = warmRGB(hl.warmth);
          const haloR = hl.r * 7.5;
          const grd = ctx.createRadialGradient(hl.x, hl.y, 0, hl.x, hl.y, haloR);
          grd.addColorStop(0, `rgba(${r},${g},${b},${0.55 * tw})`);
          grd.addColorStop(0.35, `rgba(${r},${g},${b},${0.13 * tw})`);
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(hl.x, hl.y, haloR, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(hl.x, hl.y, hl.r * (0.85 + 0.3 * tw), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(225,236,255,${0.9 * tw})`;
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      rafId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  });
</script>

<canvas bind:this={canvas} class="pointer-events-none {className}" aria-hidden="true"></canvas>
