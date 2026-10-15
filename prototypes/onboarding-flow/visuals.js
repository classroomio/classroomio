/*
 * visuals.js - the brand's own illustrations, ported to vanilla JS.
 *
 *   machine(name)  <- packages/ui/src/custom/animation/machines (SVG body generated into
 *                     machines.js by tools/extract-machines.py; the SMIL animation is the
 *                     product's, unchanged). Frozen on its still frame under reduced motion.
 *   blockLoader()  <- skills/classroomio-design/components/loading/BlockLoader.jsx: notch blocks
 *                     that drop, stack and clear. The brand's own wait state.
 *
 * Both are for ClassroomIO-branded surfaces only (sign-up, verification), never org sites.
 */
(function () {
  const MACHINE_STILL_AT = 6;

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------- machines ---------- */
  function machine(name, { label = '' } = {}) {
    const source = window.MACHINE_SOURCE[name];

    return `<svg class="machine" xmlns="http://www.w3.org/2000/svg" viewBox="${source.viewBox}" ${
      label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'
    }>${source.body}</svg>`;
  }

  function settleMachines(root) {
    root.querySelectorAll('svg.machine').forEach((svg) => {
      if (!reducedMotion()) return;

      svg.setCurrentTime(MACHINE_STILL_AT);
      svg.pauseAnimations();
    });
  }

  /* ---------- blocks (components/brand/Block + loading/BlockLoader) ---------- */
  const esc = (value) =>
    String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /* One notch block. `tab` hangs the interlocking tab that locks into the block beneath it. */
  function block({ kind, title, tone = 'sand', width = 320, tab = false, index = 0, extra = '' }) {
    return `<div class="blk tone-${tone}" style="--w:${width}px;--n:${index};z-index:${index + 1}" ${extra}>
      <div class="blk-face notch-cutout"><span class="blk-kind">${esc(kind)}</span><b class="blk-title">${esc(title)}</b></div>
      ${tab ? '<span class="blk-tab" aria-hidden="true"></span>' : ''}
    </div>`;
  }

  /* The brand block loader: blocks drop, stack, clear and repeat. Blocks share a left edge. */
  const LOADER_BLOCKS = [
    { kind: 'LESSON', title: 'Getting started', tone: 'sand', width: 340 },
    { kind: 'LESSON', title: 'Invite your team', tone: 'tint', width: 300 },
    { kind: 'QUIZ', title: 'Setup check', tone: 'blue', width: 320 },
    { kind: 'CERTIFICATE', title: 'Certified admin', tone: 'ink', width: 280 }
  ];

  function blockLoader({ blocks = LOADER_BLOCKS, duration = 6, label = 'Loading' } = {}) {
    const widest = Math.max(...blocks.map((item) => item.width));
    const html = blocks.map((item, index) => block({ ...item, tab: index > 0, index })).join('');

    return `<div class="loader-stage"><div class="blocks blocks-loop" role="img" aria-label="${esc(label)}" style="--dur:${duration}s;--step:${(0.14 * duration).toFixed(3)}s;width:${widest}px;max-width:100%">${html}</div></div>`;
  }

  /* The loader has a natural size; on a short viewport it zooms down to the room the panel has. */
  const fitters = new WeakMap();

  function fitLoader(host) {
    fitters.get(host)?.disconnect();

    const stage = host.querySelector('.loader-stage');
    if (!stage) return;

    const natural = 300;
    const fit = () => {
      const room = host.clientHeight;

      stage.style.zoom = room > 0 && room < natural ? String(Math.max(0.55, room / natural)) : '';
    };
    const observer = new ResizeObserver(fit);

    observer.observe(host);
    fitters.set(host, observer);
    fit();
  }

  function mount(host, html) {
    if (!host) return;

    host.innerHTML = html;
    settleMachines(host);
    fitLoader(host);
  }

  window.visuals = { machine, block, blockLoader, mount, settleMachines };
})();
