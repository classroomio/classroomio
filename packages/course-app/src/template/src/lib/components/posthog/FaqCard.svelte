<script lang="ts">
  import FaqMark from './assets/icons/FaqMark.svelte';

  interface Props {
    faq: any;
    index: any;
  }

  let { faq, index }: Props = $props();

  const background = 'bg-[#FDBAF2]';
  const iconColor = 'bg-[#3B82F6]';
  let card: HTMLDivElement | undefined = $state();

  const handleMouseMove = (event: { clientX: number; clientY: number }) => {
    if (card) {
      const cardRect = card.getBoundingClientRect();
      const cardX = event.clientX - cardRect.left;
      const cardY = event.clientY - cardRect.top;
      const centerX = cardRect.width / 2;
      const centerY = cardRect.height / 2;
      const rotateX = (centerY - cardY) / 10;
      const rotateY = (cardX - centerX) / 10;
      card.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    }
  };

  const handleMouseLeave = () => {
    if (card) {
      card.style.transform = '';
    }
  };
</script>

<div
  class="min-w-60 max-w-72 perspective group z-10 h-72"
  bind:this={card}
  onmousemove={handleMouseMove}
  onmouseleave={handleMouseLeave}
  role="none"
>
  <div class={`inner-card   ${index % 2 === 0 ? 'rotate-3 ' : '-rotate-3 '} `}>
    <span class="absolute z-10 h-2 w-2 rounded-full {iconColor} left-4 top-4"></span>
    <span class="absolute z-10 h-[2px] w-[2px] rounded-full {iconColor} left-8 top-8"></span>
    <span class="absolute z-10 h-2 w-2 rounded-full {iconColor} bottom-4 right-4"></span>
    <span class="absolute z-10 h-[2px] w-[2px] rounded-full {iconColor} bottom-8 right-8"></span>
    <div
      class="front flex flex-col items-center justify-center p-4 text-black shadow-md {background}"
    >
      <FaqMark color="#3B82F6" />
      <h3 class="text-center text-lg font-bold">{faq.title}</h3>
    </div>

    <div
      class="back flex items-center justify-center p-4 text-center text-sm text-black shadow-md {background}"
    >
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
  .group:hover .rotate-3 {
    transform: rotateY(180deg) rotateZ(3deg);
  }
  .group:hover .-rotate-3 {
    transform: rotateY(180deg) rotateZ(-3deg);
  }
</style>
