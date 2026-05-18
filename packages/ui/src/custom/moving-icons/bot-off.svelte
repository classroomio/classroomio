<script lang="ts">
  interface IconProps {
    color?: string;
    size?: number;
    strokeWidth?: number;
    class?: string;
  }

  let { color = 'currentColor', size = 24, strokeWidth = 2, class: className = '' }: IconProps = $props();

  let isShaking = $state(false);

  function handleMouseEnter() {
    if (isShaking) return;
    isShaking = true;
    setTimeout(() => {
      isShaking = false;
    }, 600);
  }
</script>

<div class={className} aria-label="bot-off" role="img" onmouseenter={handleMouseEnter}>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-linejoin="round"
    class="bot-off"
    class:animate={isShaking}
  >
    <path d="M13.67 8H18a2 2 0 0 1 2 2v4.33" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M22 22 2 2" />
    <path d="M8 8H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 1.414-.586" />
    <path d="M9 13v2" />
    <path d="M9.67 4H12v2.33" />
  </svg>
</div>

<style>
  div {
    display: inline-block;
  }
  .bot-off {
    overflow: visible;
    transform: translateX(0);
    transition:
      transform 0.6s ease-in-out,
      stroke 220ms ease-out;
  }

  .bot-off.animate {
    animation: groupShake 0.6s ease-in-out;
  }

  @keyframes groupShake {
    0% {
      transform: translateX(0);
    }
    16.67% {
      transform: translateX(-7%);
    }
    33.33% {
      transform: translateX(7%);
    }
    50% {
      transform: translateX(-7%);
    }
    66.67% {
      transform: translateX(7%);
    }
    100% {
      transform: translateX(0);
    }
  }
</style>
