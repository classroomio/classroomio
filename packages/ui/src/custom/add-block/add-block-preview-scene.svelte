<script lang="ts">
  import { BLOCK_PREVIEW_SCENES } from './block-preview-scenes';

  interface Props {
    /** Key into the block previews, such as `note`, `multiple_choice` or `poll`. */
    scene: string;
    class?: string;
  }

  let { scene, class: className }: Props = $props();

  const LOOP_GAP_MS = 900;
  const FADE_MS = 280;

  let iteration = $state(0);
  let fading = $state(false);

  const drawing = $derived(BLOCK_PREVIEW_SCENES[scene]?.());

  $effect(() => {
    if (!drawing || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const playedIteration = iteration;
    fading = false;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    const loopTimer = setTimeout(
      () => {
        fading = true;
        fadeTimer = setTimeout(() => (iteration = playedIteration + 1), FADE_MS);
      },
      drawing.duration * 1000 + LOOP_GAP_MS
    );

    return () => {
      clearTimeout(loopTimer);
      clearTimeout(fadeTimer);
    };
  });
</script>

{#if drawing}
  {#key `${scene}-${iteration}`}
    <div class="stage {className ?? ''}" class:fading data-scene={scene}>{@html drawing.markup}</div>
  {/key}
{/if}

<style>
  .stage {
    background: var(--muted);
    aspect-ratio: 280 / 170;
    border-bottom: 1px solid var(--border);
    --ink: var(--primary);
    --fg: var(--foreground);
    --face: var(--background);
    --line: color-mix(in srgb, var(--foreground) 38%, var(--background));
    --line2: color-mix(in srgb, var(--foreground) 14%, var(--background));
    --text: color-mix(in srgb, var(--foreground) 50%, var(--background));
    --ink-soft: color-mix(in srgb, var(--primary) 18%, var(--background));
  }

  .stage.fading :global(svg) {
    opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .stage :global(svg *) {
      animation: none !important;
    }
  }

  .stage :global {
    svg {
      display: block;
      width: 100%;
      height: 100%;
      transition: opacity 260ms;
    }
    svg.out {
      opacity: 0;
    }
    svg * {
      vector-effect: non-scaling-stroke;
      stroke-linejoin: round;
      stroke-linecap: round;
    }
    .ln {
      fill: var(--face);
      stroke: var(--line);
      stroke-width: 1.1;
    }
    .lo {
      fill: none;
      stroke: var(--line);
      stroke-width: 1.1;
    }
    .lt {
      fill: none;
      stroke: var(--line2);
      stroke-width: 1;
    }
    .dash {
      stroke-dasharray: 3 4;
    }
    .fl {
      fill: var(--line2);
    }
    .fd {
      fill: var(--line);
    }
    .ink {
      fill: var(--face);
      stroke: var(--ink);
      stroke-width: 1.5;
    }
    .ko {
      fill: none;
      stroke: var(--ink);
      stroke-width: 1.5;
    }
    .kw {
      fill: none;
      stroke: var(--face);
      stroke-width: 1.6;
    }
    .kf {
      fill: var(--ink);
    }
    .kt {
      fill: var(--ink-soft);
    }
    .cover {
      fill: var(--face);
    }
    .cursor {
      fill: var(--fg);
      stroke: var(--face);
      stroke-width: 1.2;
    }
    text {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 8.5px;
      letter-spacing: 0.03em;
      stroke: none;
    }
    .tx {
      fill: var(--text);
    }
    .tk {
      fill: var(--ink);
    }
    .tw {
      fill: var(--face);
    }
    .off {
      opacity: 0;
    }
    .r {
      animation-duration: var(--rd, 0.5s);
      animation-delay: var(--d, 0s);
      animation-fill-mode: both;
      animation-timing-function: cubic-bezier(0.3, 0.7, 0.3, 1);
      transform-box: fill-box;
    }
    .gx {
      animation-name: gx;
      transform-origin: 0 50%;
    }
    .gy {
      animation-name: gy;
      transform-origin: 50% 100%;
    }
    .pop {
      animation-name: pop;
      transform-origin: 50% 50%;
    }
    .fi {
      animation-name: fi;
    }
    .up {
      animation-name: up;
    }
    .dr {
      animation-name: dr;
      stroke-dasharray: var(--len);
    }
    svg .dashed-draw {
      vector-effect: none;
    }
    .uncover {
      animation-name: uncover;
      transform-origin: 100% 50%;
      transform: scaleX(0);
    }
    .s {
      animation-duration: var(--dur);
      animation-fill-mode: both;
      animation-delay: var(--d, 0s);
      animation-timing-function: cubic-bezier(0.45, 0, 0.25, 1);
      transform-box: fill-box;
      transform-origin: 50% 50%;
    }
    .cur {
      transform-origin: 0 0;
    }
    .lin {
      animation-timing-function: linear;
    }
    .spin {
      animation: spin 2.6s linear infinite;
      transform-box: view-box;
    }
    .eq {
      animation: eq 0.9s ease-in-out infinite alternate;
      transform-box: fill-box;
      transform-origin: 50% 50%;
    }
    .blink {
      animation: blink 1s steps(1) infinite;
    }
  }

  @keyframes -global-gx {
    from {
      transform: scaleX(0);
    }
  }
  @keyframes -global-gy {
    from {
      transform: scaleY(0);
    }
  }
  @keyframes -global-pop {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    70% {
      transform: scale(1.12);
      opacity: 1;
    }
    100% {
      transform: none;
      opacity: 1;
    }
  }
  @keyframes -global-fi {
    from {
      opacity: 0;
    }
  }
  @keyframes -global-up {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }
  @keyframes -global-dr {
    from {
      stroke-dashoffset: var(--len);
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  @keyframes -global-uncover {
    from {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0);
    }
  }
  @keyframes -global-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes -global-eq {
    from {
      transform: scaleY(0.35);
    }
  }
  @keyframes -global-blink {
    50% {
      opacity: 0;
    }
  }
  @keyframes -global-tabbar {
    0%,
    30% {
      transform: translateX(0);
    }
    36%,
    64% {
      transform: translateX(68px);
    }
    70%,
    100% {
      transform: translateX(136px);
    }
  }
  @keyframes -global-w3a {
    0%,
    31% {
      opacity: 1;
    }
    34%,
    100% {
      opacity: 0;
    }
  }
  @keyframes -global-w3b {
    0%,
    32% {
      opacity: 0;
    }
    36%,
    64% {
      opacity: 1;
    }
    68%,
    100% {
      opacity: 0;
    }
  }
  @keyframes -global-w3c {
    0%,
    66% {
      opacity: 0;
    }
    70%,
    100% {
      opacity: 1;
    }
  }
  @keyframes -global-tabcur {
    0% {
      opacity: 0;
      transform: translate(214px, 150px);
    }
    8% {
      opacity: 1;
    }
    28% {
      transform: translate(122px, 30px);
    }
    30% {
      transform: translate(122px, 30px) scale(0.8);
    }
    33% {
      transform: translate(122px, 30px);
    }
    62% {
      transform: translate(190px, 30px);
    }
    64% {
      transform: translate(190px, 30px) scale(0.8);
    }
    67% {
      transform: translate(190px, 30px);
    }
    80% {
      opacity: 1;
    }
    92%,
    100% {
      opacity: 0;
      transform: translate(232px, 120px);
    }
  }
  @keyframes -global-procline {
    0%,
    18% {
      transform: scaleX(0);
    }
    25%,
    43% {
      transform: scaleX(0.3333);
    }
    50%,
    68% {
      transform: scaleX(0.6667);
    }
    75%,
    100% {
      transform: scaleX(1);
    }
  }
  @keyframes -global-r2 {
    0%,
    22% {
      opacity: 0;
      transform: scale(0.5);
    }
    27%,
    100% {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes -global-r3 {
    0%,
    47% {
      opacity: 0;
      transform: scale(0.5);
    }
    52%,
    100% {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes -global-r4 {
    0%,
    72% {
      opacity: 0;
      transform: scale(0.5);
    }
    77%,
    100% {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes -global-w4a {
    0%,
    22% {
      opacity: 1;
    }
    25%,
    100% {
      opacity: 0;
    }
  }
  @keyframes -global-w4b {
    0%,
    23% {
      opacity: 0;
    }
    27%,
    47% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0;
    }
  }
  @keyframes -global-w4c {
    0%,
    48% {
      opacity: 0;
    }
    52%,
    72% {
      opacity: 1;
    }
    75%,
    100% {
      opacity: 0;
    }
  }
  @keyframes -global-w4d {
    0%,
    73% {
      opacity: 0;
    }
    77%,
    100% {
      opacity: 1;
    }
  }
  @keyframes -global-vplay {
    0%,
    15% {
      opacity: 1;
      transform: none;
    }
    18% {
      opacity: 1;
      transform: scale(0.85);
    }
    26%,
    100% {
      opacity: 0;
      transform: scale(1.3);
    }
  }
  @keyframes -global-vprog {
    0%,
    22% {
      transform: scaleX(0);
    }
    86%,
    100% {
      transform: scaleX(1);
    }
  }
  @keyframes -global-vhead {
    0%,
    22% {
      transform: translateX(0);
    }
    86%,
    100% {
      transform: translateX(192px);
    }
  }
  @keyframes -global-vsun {
    0%,
    22% {
      transform: translate(0, 0);
    }
    86%,
    100% {
      transform: translate(-80px, 12px);
    }
  }
  @keyframes -global-vdone {
    0%,
    86% {
      opacity: 0;
      transform: translateY(4px);
    }
    90%,
    100% {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes -global-vcur {
    0% {
      opacity: 0;
      transform: translate(232px, 158px);
    }
    6% {
      opacity: 1;
    }
    14% {
      transform: translate(144px, 78px);
    }
    16% {
      transform: translate(144px, 78px) scale(0.8);
    }
    19% {
      transform: translate(144px, 78px);
      opacity: 1;
    }
    30%,
    100% {
      opacity: 0;
      transform: translate(250px, 170px);
    }
  }
  @keyframes -global-slstrip {
    0%,
    28% {
      transform: translateX(0);
    }
    36%,
    60% {
      transform: translateX(-192px);
    }
    68%,
    100% {
      transform: translateX(-384px);
    }
  }
  @keyframes -global-sldot {
    0%,
    28% {
      transform: translateX(0);
    }
    36%,
    60% {
      transform: translateX(12px);
    }
    68%,
    100% {
      transform: translateX(24px);
    }
  }
  @keyframes -global-slarrow {
    0%,
    24% {
      transform: none;
    }
    28% {
      transform: translateX(3px) scale(1.2);
    }
    32%,
    56% {
      transform: none;
    }
    60% {
      transform: translateX(3px) scale(1.2);
    }
    64%,
    100% {
      transform: none;
    }
  }
  @keyframes -global-dcur {
    0% {
      opacity: 0;
      transform: translate(170px, 160px);
    }
    6% {
      opacity: 1;
    }
    17% {
      transform: translate(232px, 44px);
    }
    19% {
      transform: translate(232px, 44px) scale(0.8);
    }
    22% {
      transform: translate(232px, 44px);
      opacity: 1;
    }
    34%,
    100% {
      opacity: 0;
      transform: translate(270px, 100px);
    }
  }
  @keyframes -global-ddrop {
    0%,
    20% {
      opacity: 1;
      transform: translateY(0);
    }
    27% {
      transform: translateY(4px);
    }
    32% {
      transform: translateY(-2px);
    }
    40% {
      opacity: 1;
      transform: translateY(5px);
    }
    44%,
    100% {
      opacity: 0;
      transform: translateY(5px);
    }
  }
  @keyframes -global-dring {
    0%,
    20% {
      opacity: 1;
      stroke-dashoffset: 100;
    }
    42% {
      opacity: 1;
      stroke-dashoffset: 0;
    }
    46%,
    100% {
      opacity: 0;
      stroke-dashoffset: 0;
    }
  }
  @keyframes -global-dcheck {
    0%,
    42% {
      opacity: 0;
      transform: scale(0.6);
    }
    48%,
    100% {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes -global-dthumb {
    0%,
    50% {
      opacity: 0;
      transform: translateY(8px);
    }
    60%,
    100% {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes -global-izone {
    0%,
    26% {
      opacity: 1;
    }
    32%,
    100% {
      opacity: 0;
    }
  }
  @keyframes -global-ifile {
    0% {
      opacity: 0;
      transform: translate(90px, -46px) rotate(10deg);
    }
    6% {
      opacity: 1;
    }
    22% {
      opacity: 1;
      transform: none;
    }
    28%,
    100% {
      opacity: 0;
      transform: scale(0.9);
    }
  }
  @keyframes -global-iimg {
    0%,
    27% {
      opacity: 0;
    }
    31%,
    100% {
      opacity: 1;
    }
  }
  @keyframes -global-icover {
    0%,
    30% {
      transform: scaleY(1);
    }
    50%,
    100% {
      transform: scaleY(0);
    }
  }
  @keyframes -global-icap {
    0%,
    52% {
      transform: scaleX(0);
    }
    62%,
    100% {
      transform: scaleX(1);
    }
  }
  @keyframes -global-icorner {
    0%,
    64% {
      opacity: 0;
      transform: scale(1.06);
    }
    70%,
    100% {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes -global-ffront {
    0%,
    30% {
      transform: scaleX(1);
    }
    37%,
    100% {
      transform: scaleX(0);
    }
  }
  @keyframes -global-fback {
    0%,
    37% {
      transform: scaleX(0);
    }
    44%,
    100% {
      transform: scaleX(1);
    }
  }
  @keyframes -global-fbtn {
    0%,
    46% {
      opacity: 0;
      transform: translateY(4px);
    }
    52%,
    100% {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes -global-fpress {
    0%,
    69% {
      opacity: 0;
    }
    72%,
    100% {
      opacity: 1;
    }
  }
  @keyframes -global-fcur {
    0% {
      opacity: 0;
      transform: translate(240px, 156px);
    }
    6% {
      opacity: 1;
    }
    24% {
      transform: translate(148px, 72px);
    }
    27% {
      transform: translate(148px, 72px) scale(0.8);
    }
    30% {
      transform: translate(148px, 72px);
    }
    64% {
      transform: translate(193px, 130px);
    }
    69% {
      transform: translate(193px, 130px) scale(0.8);
    }
    72% {
      transform: translate(193px, 130px);
      opacity: 1;
    }
    86%,
    100% {
      opacity: 0;
      transform: translate(250px, 170px);
    }
  }
  @keyframes -global-mchosen {
    0%,
    38% {
      opacity: 0;
    }
    42%,
    100% {
      opacity: 1;
    }
  }
  @keyframes -global-mdim {
    0%,
    52% {
      opacity: 1;
    }
    58%,
    100% {
      opacity: 0.4;
    }
  }
  @keyframes -global-mfb {
    0%,
    52% {
      opacity: 0;
      transform: translateY(4px);
    }
    58%,
    100% {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes -global-mcur {
    0% {
      opacity: 0;
      transform: translate(232px, 160px);
    }
    6% {
      opacity: 1;
    }
    22% {
      transform: translate(150px, 40px);
    }
    36% {
      transform: translate(150px, 66px);
    }
    39% {
      transform: translate(150px, 66px) scale(0.8);
    }
    42% {
      transform: translate(150px, 66px);
      opacity: 1;
    }
    58%,
    100% {
      opacity: 0;
      transform: translate(260px, 170px);
    }
  }
  @keyframes -global-hcur {
    0%,
    52% {
      opacity: 0;
      transform: translate(250px, 160px);
    }
    58% {
      opacity: 1;
    }
    66% {
      transform: translate(214px, 132px);
    }
    69% {
      transform: translate(214px, 132px) scale(0.8);
    }
    72% {
      transform: translate(214px, 132px);
      opacity: 1;
    }
    84%,
    100% {
      opacity: 0;
      transform: translate(260px, 170px);
    }
  }
  @keyframes -global-hpress {
    0%,
    66% {
      transform: none;
    }
    69% {
      transform: scale(0.9);
    }
    73%,
    100% {
      transform: none;
    }
  }
  @keyframes -global-hring {
    0%,
    68% {
      opacity: 0;
      transform: scale(1);
    }
    70% {
      opacity: 1;
    }
    86%,
    100% {
      opacity: 0;
      transform: scale(1.5);
    }
  }
  @keyframes -global-pcur {
    0% {
      opacity: 0;
      transform: translate(220px, 160px);
    }
    6% {
      opacity: 1;
    }
    14% {
      transform: translate(96px, 50px);
    }
    16% {
      transform: translate(96px, 50px) scale(0.8);
    }
    19% {
      transform: translate(96px, 50px);
      opacity: 1;
    }
    30%,
    100% {
      opacity: 0;
      transform: translate(260px, 170px);
    }
  }
  @keyframes -global-pvote {
    0%,
    16% {
      opacity: 0;
      transform: scale(0.4);
    }
    20%,
    100% {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes -global-ccopy {
    0%,
    76% {
      opacity: 1;
    }
    78%,
    100% {
      opacity: 0;
    }
  }
  @keyframes -global-ccopied {
    0%,
    76% {
      opacity: 0;
    }
    78%,
    100% {
      opacity: 1;
    }
  }
</style>
