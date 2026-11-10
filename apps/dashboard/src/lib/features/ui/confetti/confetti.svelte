<script>
  import { onDestroy, onMount } from 'svelte';
  import confetti from 'canvas-confetti';
  import { confettiStore } from './store';

  let myCanvas = $state();
  let myConfetti;
  let intervalId;

  function showConfetti(show) {
    if (!show || !myConfetti) return;

    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    clearInterval(intervalId);
    intervalId = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(intervalId);
      }

      const particleCount = 50 * (timeLeft / duration);
      myConfetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
      );
      myConfetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      );
    }, 250);
  }

  onMount(() => {
    // Firefox throws InvalidStateError when a worker-transferred canvas is re-used across remounts.
    myConfetti = confetti.create(myCanvas, {
      resize: true,
      useWorker: false
    });
  });

  onDestroy(() => {
    clearInterval(intervalId);
    myConfetti?.reset();
  });

  $effect(() => {
    showConfetti($confettiStore.show);
  });
</script>

<canvas bind:this={myCanvas}></canvas>

<style>
  canvas {
    position: absolute;
    width: 60%;
    height: 70%;
  }
</style>
