<script module lang="ts">
  class Grad {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
    }

    dot2(x: number, y: number): number {
      return this.x * x + this.y * y;
    }
  }

  class Noise {
    grad3: Grad[];
    p: number[];
    perm: number[] = new Array(512);
    gradP: Grad[] = new Array(512);

    constructor(seed = 0) {
      this.grad3 = [
        new Grad(1, 1, 0),
        new Grad(-1, 1, 0),
        new Grad(1, -1, 0),
        new Grad(-1, -1, 0),
        new Grad(1, 0, 1),
        new Grad(-1, 0, 1),
        new Grad(1, 0, -1),
        new Grad(-1, 0, -1),
        new Grad(0, 1, 1),
        new Grad(0, -1, 1),
        new Grad(0, 1, -1),
        new Grad(0, -1, -1)
      ];
      this.p = [
        151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37,
        240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177,
        33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146,
        158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25,
        63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100,
        109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206,
        59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153,
        101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246,
        97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192,
        214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114,
        67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
      ];
      this.seed(seed);
    }

    seed(seed: number) {
      if (seed > 0 && seed < 1) seed *= 65536;
      seed = Math.floor(seed);
      if (seed < 256) seed |= seed << 8;

      for (let i = 0; i < 256; i++) {
        const v = i & 1 ? this.p[i] ^ (seed & 255) : this.p[i] ^ ((seed >> 8) & 255);
        this.perm[i] = this.perm[i + 256] = v;
        this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
      }
    }

    fade(t: number) {
      return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(a: number, b: number, t: number) {
      return (1 - t) * a + t * b;
    }

    perlin2(x: number, y: number): number {
      let X = Math.floor(x),
        Y = Math.floor(y);
      x -= X;
      y -= Y;
      X &= 255;
      Y &= 255;
      const n00 = this.gradP[X + this.perm[Y]].dot2(x, y);
      const n01 = this.gradP[X + this.perm[Y + 1]].dot2(x, y - 1);
      const n10 = this.gradP[X + 1 + this.perm[Y]].dot2(x - 1, y);
      const n11 = this.gradP[X + 1 + this.perm[Y + 1]].dot2(x - 1, y - 1);
      const u = this.fade(x);

      return this.lerp(this.lerp(n00, n10, u), this.lerp(n01, n11, u), this.fade(y));
    }
  }

  type Point = {
    x: number;
    y: number;
    wave: { x: number; y: number };
    cursor: { x: number; y: number; vx: number; vy: number };
  };

  /** Resolves `var(--primary)` for canvas strokes (inherits `--primary` from this component’s DOM subtree). */
  function primaryStrokeOnRoot(el: HTMLElement): string {
    const probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText =
      'position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;' +
      `color:var(--primary)`;
    el.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();

    return resolved || 'rgb(59, 130, 246)';
  }
</script>

<script lang="ts">
  import { cn } from '../../../tools';

  type Props = {
    /** Stroke color. Omit to use the theme primary color. */
    lineColor?: string;
    backgroundColor?: string;
    waveSpeedX?: number;
    waveSpeedY?: number;
    waveAmpX?: number;
    waveAmpY?: number;
    xGap?: number;
    yGap?: number;
    friction?: number;
    tension?: number;
    maxCursorMove?: number;
    class?: string;
  };

  let {
    lineColor: lineColorProp,
    backgroundColor = 'transparent',
    waveSpeedX = 0.0125,
    waveSpeedY = 0.005,
    waveAmpX = 32,
    waveAmpY = 16,
    xGap = 10,
    yGap = 32,
    friction = 0.925,
    tension = 0.005,
    maxCursorMove = 100,
    class: className = ''
  }: Props = $props();

  let root: HTMLDivElement | undefined;
  let canvasRef: HTMLCanvasElement | undefined;

  $effect(() => {
    void waveSpeedX;
    void waveSpeedY;
    void waveAmpX;
    void waveAmpY;
    void xGap;
    void yGap;
    void friction;
    void tension;
    void maxCursorMove;
    void lineColorProp;

    const canvasEl = canvasRef;
    const rootEl = root;

    if (!canvasEl || !rootEl) return;

    const strokeColor = lineColorProp ?? primaryStrokeOnRoot(rootEl);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const noise = new Noise(Math.random());
    let lines: Point[][] = [];
    const bounding = { width: 0, height: 0 };
    const mouse = { x: -10, y: 0, lx: 0, ly: 0, sx: 0, sy: 0, v: 0, vs: 0, a: 0, set: false };

    const ctx = canvasEl.getContext('2d', { alpha: true });

    if (!ctx) return;

    const context = ctx;

    let resizeTimer: ReturnType<typeof setTimeout>;

    const setSize = () => {
      const rect = rootEl.getBoundingClientRect();
      bounding.width = rect.width;
      bounding.height = rect.height;
      canvasEl.width = rect.width * dpr;
      canvasEl.height = rect.height * dpr;
      canvasEl.style.width = `${rect.width}px`;
      canvasEl.style.height = `${rect.height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const setLines = () => {
      lines = [];
      const { width, height } = bounding;
      const oWidth = width + 200;
      const oHeight = height + 30;
      const totalLines = Math.ceil(oWidth / xGap);
      const totalPoints = Math.ceil(oHeight / yGap);
      const xStart = (width - xGap * totalLines) / 2;
      const yStart = (height - yGap * totalPoints) / 2;

      for (let i = 0; i <= totalLines; i++) {
        const pts: Point[] = [];

        for (let j = 0; j <= totalPoints; j++) {
          pts.push({
            x: xStart + xGap * i,
            y: yStart + yGap * j,
            wave: { x: 0, y: 0 },
            cursor: { x: 0, y: 0, vx: 0, vy: 0 }
          });
        }

        lines.push(pts);
      }
    };

    const movePoints = (time: number) => {
      lines.forEach((pts) => {
        pts.forEach((p) => {
          const move = noise.perlin2((p.x + time * waveSpeedX) * 0.002, (p.y + time * waveSpeedY) * 0.0015) * 12;
          p.wave.x = Math.cos(move) * waveAmpX;
          p.wave.y = Math.sin(move) * waveAmpY;
          const dx = p.x - mouse.sx;
          const dy = p.y - mouse.sy;
          const dist = Math.hypot(dx, dy);
          const l = Math.max(175, mouse.vs);

          if (dist < l) {
            const s = 1 - dist / l;
            const f = Math.cos(dist * 0.001) * s;
            p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00065;
            p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00065;
          }

          p.cursor.vx += (0 - p.cursor.x) * tension;
          p.cursor.vy += (0 - p.cursor.y) * tension;
          p.cursor.vx *= friction;
          p.cursor.vy *= friction;
          p.cursor.x += p.cursor.vx * 2;
          p.cursor.y += p.cursor.vy * 2;
          p.cursor.x = Math.min(maxCursorMove, Math.max(-maxCursorMove, p.cursor.x));
          p.cursor.y = Math.min(maxCursorMove, Math.max(-maxCursorMove, p.cursor.y));
        });
      });
    };

    const moved = (point: Point, withCursor = true) => ({
      x: Math.round((point.x + point.wave.x + (withCursor ? point.cursor.x : 0)) * 10) / 10,
      y: Math.round((point.y + point.wave.y + (withCursor ? point.cursor.y : 0)) * 10) / 10
    });

    const drawLines = () => {
      const { width, height } = bounding;
      context.clearRect(0, 0, width, height);
      context.beginPath();
      context.globalAlpha = 0.5;
      context.strokeStyle = strokeColor;

      lines.forEach((points) => {
        let p1 = moved(points[0], false);
        context.moveTo(p1.x, p1.y);

        points.forEach((p, idx) => {
          const isLast = idx === points.length - 1;
          p1 = moved(p, !isLast);
          const p2 = moved(points[idx + 1] || points[points.length - 1], !isLast);
          context.lineTo(p1.x, p1.y);

          if (isLast) context.moveTo(p2.x, p2.y);
        });
      });

      context.stroke();
    };

    let raf = 0;

    const tick = (t: number) => {
      mouse.sx += (mouse.x - mouse.sx) * 0.1;
      mouse.sy += (mouse.y - mouse.sy) * 0.1;
      const dx = mouse.x - mouse.lx;
      const dy = mouse.y - mouse.ly;
      const d = Math.hypot(dx, dy);
      mouse.v = d;
      mouse.vs += (d - mouse.vs) * 0.1;
      mouse.vs = Math.min(100, mouse.vs);
      mouse.lx = mouse.x;
      mouse.ly = mouse.y;
      mouse.a = Math.atan2(dy, dx);
      rootEl.style.setProperty('--waves-cursor-x', `${mouse.sx}px`);
      rootEl.style.setProperty('--waves-cursor-y', `${mouse.sy}px`);
      movePoints(t);
      drawLines();
      raf = requestAnimationFrame(tick);
    };

    const updateMouse = (clientX: number, clientY: number) => {
      const rect = rootEl.getBoundingClientRect();
      mouse.x = clientX - rect.left;
      mouse.y = clientY - rect.top;

      if (!mouse.set) {
        mouse.sx = mouse.x;
        mouse.sy = mouse.y;
        mouse.lx = mouse.x;
        mouse.ly = mouse.y;
        mouse.set = true;
      }
    };

    const onMouseMove = (e: MouseEvent) => updateMouse(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];

      if (touch) updateMouse(touch.clientX, touch.clientY);
    };

    const doResize = () => {
      setSize();
      setLines();
    };

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 100);
    };

    doResize();
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  });
</script>

<div
  bind:this={root}
  class={cn('ui:absolute ui:left-0 ui:top-0 ui:h-full ui:w-full ui:overflow-hidden', className)}
  style:background-color={backgroundColor}
>
  <div
    class="ui:pointer-events-none ui:absolute ui:left-0 ui:top-0 ui:h-2 ui:w-2 ui:rounded-full ui:bg-primary ui:opacity-70"
    style="transform: translate3d(calc(var(--waves-cursor-x, 0px) - 50%), calc(var(--waves-cursor-y, 0px) - 50%), 0); will-change: transform;"
    aria-hidden="true"
  ></div>
  <canvas bind:this={canvasRef} class="ui:block ui:h-full ui:w-full"></canvas>
</div>
