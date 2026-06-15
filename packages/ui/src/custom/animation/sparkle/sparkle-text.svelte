<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import SparkleParticle from './sparkle-particle.svelte';

  interface TSparkle {
    id: string;
    x: string;
    y: string;
    color: string;
    delay: number;
    scale: number;
    lifespan: number;
  }

  interface Props {
    text?: string;
    colors?: { first: string; second: string };
    sparklesCount?: number;
    class?: string;
  }

  let {
    text = 'Hello World',
    colors = { first: '#9E7AFF', second: '#FE8BBB' },
    sparklesCount = 5,
    class: className = ''
  }: Props = $props();

  let sparkles = $state<TSparkle[]>([]);

  function generateStar(): TSparkle {
    const starX = `${Math.random() * 100}%`;
    const starY = `${Math.random() * 100}%`;
    const color = Math.random() > 0.5 ? colors.first : colors.second;
    const delay = Math.random() * 4;
    const scale = Math.random() * 1 + 0.3;
    const lifespan = Math.random() * 10 + 5;
    const id = `${starX}-${starY}-${Date.now()}`;
    return { id, x: starX, y: starY, color, delay, scale, lifespan };
  }

  function initializeStars() {
    sparkles = Array.from({ length: sparklesCount }, generateStar);
  }

  function updateStars() {
    sparkles = sparkles.map((star) => {
      if (star.lifespan <= 0) {
        return generateStar();
      }
      return { ...star, lifespan: star.lifespan - 0.1 };
    });
  }

  let interval: ReturnType<typeof setInterval>;

  onMount(() => {
    initializeStars();
    interval = setInterval(updateStars, 100);
  });

  onDestroy(() => clearInterval(interval));
</script>

<div style:--sparkles-first-color="{colors.first};" style:--sparkles-second-color="{colors.second};" class={className}>
  <span class="ui:relative ui:inline-block">
    {#each sparkles as item}
      <SparkleParticle {...item} />
    {/each}
    <strong>{text}</strong>
  </span>
</div>
