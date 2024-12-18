<script lang="ts">
  import FaqMark from './assets/icons/FaqMark.svelte';

  interface Props {
    faq: any;
    index: any;
  }

  let { faq, index }: Props = $props();

  const background = 'gradient-bg';
</script>

<div
  class="min-w-60 max-w-72 group z-10 h-72 cursor-pointer overflow-hidden rounded-xl"
  role="none"
>
  <div class={`inner-card ring-linear-border rounded-lg`}>
    <div class="front flex flex-col items-center justify-center p-4 shadow-md {background}">
      <FaqMark />
      <h3 class="text-center text-lg font-bold">{faq.title}</h3>
    </div>

    <div
      class="back flex flex-col items-center justify-center p-4 text-center text-sm text-white shadow-md {background}"
    >
      <h3 class="mb-2 text-center text-lg font-bold">{faq.title}</h3>
      <p class="line-clamp-5">{faq.content}</p>
    </div>
  </div>
</div>

<style>
  .perspective {
    perspective: 1000px;
  }
  .inner-card {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.4s ease;
    transform-style: preserve-3d;
  }
  .group:hover .inner-card {
    transform: rotateY(180deg);
  }
  .front,
  .back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
  }
  .back {
    transform: rotateY(180deg);
  }
</style>
