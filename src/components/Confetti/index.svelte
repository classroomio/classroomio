<script>
  import { onMount } from 'svelte';
  import confetti from 'canvas-confetti';
  import { confettiStore } from './store';

  let myCanvas;
  let myConfetti;

  function showConfetti(show) {
    if (!show) return;

    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      myConfetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
      );
      myConfetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
      );
    }, 250);
  }

  onMount(() => {
    myConfetti = confetti.create(myCanvas, {
      resize: true,
      useWorker: true,
    });
  });

  $: showConfetti($confettiStore.show);
</script>

<canvas bind:this={myCanvas} />

<style>
  canvas {
    position: absolute;
    width: 70%;
    height: 70%;
  }
</style>
