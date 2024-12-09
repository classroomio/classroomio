<script lang="ts">
  interface Props {
    faq: any;
    index: any;
  }

  let { faq, index }: Props = $props();

  const background = 'bg-[#FDBAF2]';
  const iconColor = 'bg-[#3B82F6]';
  let card: HTMLDivElement = $state();

  const handleMouseMove = (event: { clientX: number; clientY: number }) => {
    const cardRect = card.getBoundingClientRect();
    const cardX = event.clientX - cardRect.left;
    const cardY = event.clientY - cardRect.top;
    const centerX = cardRect.width / 2;
    const centerY = cardRect.height / 2;
    const rotateX = (centerY - cardY) / 10;
    const rotateY = (cardX - centerX) / 10;
    card.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
  };

  const handleMouseLeave = () => {
    card.style.transform = '';
  };
</script>

<div
  class="z-10 min-w-60 max-w-72 h-72 perspective group"
  bind:this={card}
  onmousemove={handleMouseMove}
  onmouseleave={handleMouseLeave}
  role="none"
>
  <div class={`inner-card   ${index % 2 === 0 ? 'rotate-3 ' : '-rotate-3 '} `}>
    <span class="z-10 absolute w-2 h-2 rounded-full {iconColor} top-4 left-4"></span>
    <span class="z-10 absolute w-[2px] h-[2px] rounded-full {iconColor} top-8 left-8"></span>
    <span class="z-10 absolute w-2 h-2 rounded-full {iconColor} bottom-4 right-4"></span>
    <span class="z-10 absolute w-[2px] h-[2px] rounded-full {iconColor} bottom-8 right-8"></span>
    <div
      class="front text-black shadow-md flex flex-col items-center justify-center p-4 {background}"
    >
      <!-- <FaqMark color="#3B82F6" /> -->

      <p>faq-mark-here</p>
      <h3 class="text-lg font-bold text-center">{faq.title}</h3>
    </div>

    <div
      class="back text-black text-center text-sm shadow-md flex items-center justify-center p-4 {background}"
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
