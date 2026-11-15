<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import MaximizeIcon from '@lucide/svelte/icons/maximize';
  import MinimizeIcon from '@lucide/svelte/icons/minimize';
  import Volume2Icon from '@lucide/svelte/icons/volume-2';
  import VolumeXIcon from '@lucide/svelte/icons/volume-x';
  import { Button } from '../../../base/button';
  import MachineFrame from './machine-frame.svelte';
  import type { RunnerSoundName, RunnerSoundPlayer } from './runner-sound';
  import type { RunnerProps } from './types';
  import {
    CUBE_HEIGHT,
    CUBE_LANE,
    CUBE_SIZE,
    CUBE_START,
    ORIGINAL_VIEW_WIDTH,
    PILLAR_LANE,
    PILLAR_WIDTH,
    RAIL_HEIGHT,
    TRACK_EXTENSION,
    createRunnerState,
    jump,
    obstacleRise,
    projectBox,
    projectPoint,
    readBestScore,
    readMuted,
    stepRunner,
    viewFor,
    writeBestScore,
    writeMuted,
    type RunnerStatus
  } from './track-runner';

  const MAX_TILT = 12;
  const EXTEND_MS = 1800;
  const COUNTDOWN_FROM = 3;
  const COUNTDOWN_STEP_MS = 1000;

  let {
    label,
    startLabel = 'PRESS SPACE TO PLAY',
    gameOverLabel = 'GAME OVER',
    restartLabel = 'PRESS SPACE TO RETRY',
    scoreLabel = 'SCORE',
    bestLabel = 'BEST',
    newRecordLabel = 'NEW RECORD!',
    enterFullscreenLabel = 'Full screen',
    exitFullscreenLabel = 'Exit full screen',
    muteLabel = 'Mute sound',
    unmuteLabel = 'Unmute sound',
    autoStart = false,
    onstatechange,
    baseWidth = ORIGINAL_VIEW_WIDTH,
    class: className
  }: RunnerProps = $props();

  const game = $state(createRunnerState());
  let status: RunnerStatus = $state('idle');
  let extension = $state(0);
  let countdown = $state(COUNTDOWN_FROM);
  let best = $state(0);
  let isNewRecord = $state(false);
  let overAt = 0;
  let hostElement: HTMLDivElement | undefined = $state();
  let isFullscreen = $state(false);
  let canFullscreen = $state(false);
  let isMuted = $state(false);
  let soundPlayer: Promise<RunnerSoundPlayer> | undefined;
  let isDisposed = false;

  onMount(() => {
    canFullscreen = document.fullscreenEnabled;

    const syncFullscreen = () => {
      isFullscreen = document.fullscreenElement !== null;
    };

    document.addEventListener('fullscreenchange', syncFullscreen);

    return () => {
      isDisposed = true;
      document.removeEventListener('fullscreenchange', syncFullscreen);
      soundPlayer?.then((player) => player.dispose()).catch(() => undefined);
    };
  });

  onMount(() => {
    best = readBestScore();
    isMuted = readMuted();

    if (autoStart) press();
  });

  const view = $derived(viewFor(extension));
  const widthPx = $derived(view.width * (baseWidth / ORIGINAL_VIEW_WIDTH));
  const boardWidth = $derived(
    isFullscreen ? `min(100%, calc((100vh - 8rem) * ${view.width / view.height}))` : `${widthPx}px`
  );
  const slab = $derived(projectBox(0, 260 + extension, 0, 90, -8, 8));
  const rightBeam = $derived(projectBox(155, 91 + extension, 40, 10, 0, RAIL_HEIGHT));
  const rightBlock = $derived(projectBox(246 + extension, 14, 34, 22, 0, 20));

  const cube = $derived(projectBox(CUBE_START, CUBE_SIZE, CUBE_LANE, CUBE_SIZE, RAIL_HEIGHT + game.lift, CUBE_HEIGHT));
  const cubePivot = $derived(
    projectPoint(CUBE_START + CUBE_SIZE / 2, CUBE_LANE + CUBE_SIZE / 2, RAIL_HEIGHT + game.lift + CUBE_HEIGHT / 2)
  );
  const cubeTilt = $derived(Math.sin((game.rotation / 90) * Math.PI) * MAX_TILT);
  const score = $derived(String(game.passed).padStart(3, '0'));
  const bestText = $derived(String(best).padStart(3, '0'));
  const isPlaying = $derived(status === 'running' || status === 'over');
  const obstacles = $derived(
    game.obstacles.map((obstacle) => {
      const isBeam = obstacle.height <= 10;
      const rise = obstacleRise(obstacle);
      const across = isBeam ? CUBE_LANE : PILLAR_LANE;
      const width = isBeam ? CUBE_SIZE : PILLAR_WIDTH;

      const risenHeight = obstacle.height * rise;
      const faces = projectBox(obstacle.x, obstacle.width, across, width, RAIL_HEIGHT, risenHeight);

      return { id: obstacle.id, faces };
    })
  );

  $effect(() => {
    const snapshot = { status, passed: game.passed, isNewRecord };

    untrack(() => onstatechange?.(snapshot));
  });

  function playSound(sound: RunnerSoundName) {
    if (isMuted) return;

    soundPlayer ??= import('./runner-sound').then((module) => {
      const player = module.createSoundPlayer();
      if (isDisposed) player.dispose();

      return player;
    });

    soundPlayer
      .then((player) => player.play(sound))
      .catch((error) => {
        console.error('MachineBrokenTrack: sound failed', error);
        soundPlayer = undefined;
      });
  }

  function toggleMute(event: MouseEvent) {
    (event.currentTarget as HTMLElement).blur();

    isMuted = !isMuted;
    writeMuted(isMuted);
    playSound('tick');
  }

  async function toggleFullscreen(event: MouseEvent) {
    (event.currentTarget as HTMLElement).blur();

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();

        return;
      }

      const card = hostElement?.closest('[data-slot="empty"]') ?? hostElement;
      await card?.requestFullscreen();
    } catch (error) {
      console.error('MachineBrokenTrack: full screen failed', error);
    }
  }

  function easeInOut(progress: number) {
    return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function finishRun() {
    isNewRecord = game.passed > best;

    if (isNewRecord) {
      best = game.passed;
      writeBestScore(best);
    }

    playSound(isNewRecord ? 'record' : 'crash');

    status = 'over';
  }

  function startRun() {
    isNewRecord = false;
    Object.assign(game, createRunnerState());
    status = 'running';
  }

  function press() {
    if (status === 'idle') {
      Object.assign(game, createRunnerState());
      status = 'extending';

      return;
    }

    if (status === 'over') {
      if (performance.now() - overAt < 400) return;

      startRun();

      return;
    }

    if (status !== 'running') return;

    const wasGrounded = game.lift === 0;
    jump(game);
    if (wasGrounded) playSound('jump');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.code !== 'Space' && event.code !== 'ArrowUp') return;

    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;

    event.preventDefault();
    if (event.repeat) return;

    press();
  }

  $effect(() => {
    if (status !== 'extending') return;

    if (prefersReducedMotion()) {
      extension = TRACK_EXTENSION;
      countdown = COUNTDOWN_FROM;
      status = 'countdown';

      return;
    }

    let frameId = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / EXTEND_MS, 1);
      extension = TRACK_EXTENSION * easeInOut(progress);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);

        return;
      }

      countdown = COUNTDOWN_FROM;
      status = 'countdown';
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  });

  $effect(() => {
    if (status !== 'countdown') return;

    untrack(() => playSound('tick'));

    const timerId = setInterval(() => {
      countdown -= 1;

      if (countdown > 0) {
        playSound('tick');

        return;
      }

      playSound('go');

      clearInterval(timerId);
      startRun();
    }, COUNTDOWN_STEP_MS);

    return () => clearInterval(timerId);
  });

  $effect(() => {
    if (status !== 'running') return;

    let frameId = 0;
    let lastTime = performance.now();
    let lastPassed = 0;

    const tick = (now: number) => {
      const elapsed = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const crashed = stepRunner(game, elapsed);
      if (crashed) {
        overAt = now;
        finishRun();

        return;
      }

      if (game.passed > lastPassed) {
        lastPassed = game.passed;
        playSound('point');
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div bind:this={hostElement} class="ui:flex ui:w-full ui:flex-col ui:items-center ui:gap-2">
  <div class="ui:flex ui:w-full ui:justify-end ui:gap-2">
    <Button
      variant="secondary"
      size="icon-sm"
      aria-label={isMuted ? unmuteLabel : muteLabel}
      title={isMuted ? unmuteLabel : muteLabel}
      testId="track-runner-mute"
      onclick={toggleMute}
    >
      {#if isMuted}
        <VolumeXIcon />
      {:else}
        <Volume2Icon />
      {/if}
    </Button>
    {#if canFullscreen}
      <Button
        variant="secondary"
        size="icon-sm"
        aria-label={isFullscreen ? exitFullscreenLabel : enterFullscreenLabel}
        title={isFullscreen ? exitFullscreenLabel : enterFullscreenLabel}
        testId="track-runner-fullscreen"
        onclick={toggleFullscreen}
      >
        {#if isFullscreen}
          <MinimizeIcon />
        {:else}
          <MaximizeIcon />
        {/if}
      </Button>
    {/if}
  </div>
  <div
    class="ui:max-w-full ui:cursor-pointer ui:touch-manipulation ui:select-none"
    style:width={boardWidth}
    style:aspect-ratio="{view.width} / {view.height}"
    role="presentation"
    onpointerdown={press}
  >
    <MachineFrame viewBox={view.box} {label} class={className}>
      <polygon class="ln" points={slab.left}></polygon>
      <polygon class="ln" points={slab.right}></polygon>
      <polygon class="ln" points={slab.top}></polygon>
      <polyline class="lo" points="110.9,58.0 94.4,61.5 94.4,73.5 74.5,75.0 72.7,87.0 52.8,88.5 48.5,98.0 33.8,101.5"
      ></polyline><polygon class="ln" points="-48.5,20.0 -36.4,27.0 -36.4,7.0 -48.5,0.0"></polygon><polygon
        class="ln"
        points="-17.3,16.0 -36.4,27.0 -36.4,7.0 -17.3,-4.0"
      ></polygon><polygon class="ln" points="-29.4,-11.0 -17.3,-4.0 -36.4,7.0 -48.5,0.0"></polygon><polygon
        class="ln"
        points="-31.2,24.0 47.6,69.5 47.6,63.5 -31.2,18.0"
      ></polygon><polygon class="ln" points="56.3,64.5 47.6,69.5 47.6,63.5 56.3,58.5"></polygon><polygon
        class="ln"
        points="-22.5,13.0 56.3,58.5 47.6,63.5 -31.2,18.0"
      ></polygon><polygon class="lt dash" points="56.3,58.5 99.6,83.5 90.9,88.5 47.6,63.5"></polygon><polygon
        class="ln"
        points={rightBeam.left}
      ></polygon>
      <polygon class="ln" points={rightBeam.right}></polygon>
      <polygon class="ln" points={rightBeam.top}></polygon>
      <g transform="rotate({-cubeTilt} {cubePivot.x} {cubePivot.y})">
        <polygon class="ink" points={cube.left}></polygon>
        <polygon class="ink" points={cube.right}></polygon>
        <polygon class="kf" points={cube.top}></polygon>
      </g>

      {#each obstacles as obstacle (obstacle.id)}
        <polygon class="ln" points={obstacle.faces.left}></polygon>
        <polygon class="ln" points={obstacle.faces.right}></polygon>
        <polygon class="ln" points={obstacle.faces.top}></polygon>
      {/each}

      <polygon class="ln" points="46.8,101.0 53.7,105.0 53.7,83.0 46.8,79.0"></polygon><polygon
        class="ln"
        points="60.6,101.0 53.7,105.0 53.7,83.0 60.6,79.0"
      ></polygon><polygon class="ln" points="53.7,75.0 60.6,79.0 53.7,83.0 46.8,79.0"></polygon><polygon
        class="kf"
        points="53.7,75.0 60.6,79.0 53.7,83.0 46.8,79.0"
        ><animate
          attributeName="opacity"
          values="0.15;0.15;1;0.15;1;0.15;1;0.15;0.15"
          keyTimes="0;0.36;0.4;0.44;0.48;0.52;0.56;0.6;1"
          dur="8s"
          repeatCount="indefinite"
        ></animate></polygon
      >
      <polygon class="ln" points={rightBlock.left}></polygon>
      <polygon class="ln" points={rightBlock.right}></polygon>
      <polygon class="ln" points={rightBlock.top}></polygon>

      {#if isPlaying || best > 0}
        <text class="tx" x={view.rightEdge - 8} y="-40" text-anchor="end" style="font-size: 10px">
          {#if best > 0}{bestLabel} {bestText}{/if}
          {#if isPlaying}<tspan class="tk" dx={best > 0 ? 12 : 0}>{scoreLabel} {score}</tspan>{/if}
        </text>
      {/if}

      {#if status === 'idle'}
        <text class="tk" x={view.centerX} y="-8" text-anchor="middle">
          {startLabel}
          <animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite"></animate>
        </text>
      {:else if status === 'countdown'}
        <text class="tk" x={view.centerX} y="6" text-anchor="middle" style="font-size: 30px">{countdown}</text>
      {:else if status === 'over'}
        <text class="tk" x={view.centerX} y={isNewRecord ? -22 : -14} text-anchor="middle">{gameOverLabel}</text>
        {#if isNewRecord}
          <text class="tk" x={view.centerX} y="-10" text-anchor="middle" style="font-size: 11px">{newRecordLabel}</text>
        {/if}
        <text class="tx" x={view.centerX} y={isNewRecord ? 4 : 0} text-anchor="middle">{restartLabel}</text>
      {/if}
    </MachineFrame>
  </div>
</div>
