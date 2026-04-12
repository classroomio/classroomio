<script lang="ts">
  import { cn } from '../../../tools';

  interface Props {
    number?: number;
  }

  let { number = 10 }: Props = $props();

  type MeteorStyle = {
    top: number;
    left: string;
    animationDelay: string;
    animationDuration: string;
  };

  let meteorStyles = $state<MeteorStyle[]>([]);

  function changeMeteors(num: number) {
    meteorStyles = [...Array(num)].map(() => ({
      // Keep within typical card heights so parents with overflow-hidden still show meteors
      top: Math.floor(Math.random() * 160) + 8,
      left: Math.floor(Math.random() * 100) + '%',
      animationDelay: Math.random() * 1 + 0.2 + 's',
      animationDuration: Math.floor(Math.random() * 8 + 2.9) + 's'
    }));
  }

  $effect(() => {
    const count = number;
    if (typeof window === 'undefined') return;
    changeMeteors(count);
  });
</script>

{#each meteorStyles as style, idx}
  <span
    id="meteor-{idx + 1}"
    class={cn(
      'ui:animate-meteor ui:pointer-events-none ui:absolute ui:size-[2.4px] ui:origin-center ui:rounded-full ui:bg-slate-500 ui:shadow-[0_0_0_1px_#ffffff10]'
    )}
    style="top: {style.top}px; left: {style.left}; animation-delay: {style.animationDelay}; animation-duration: {style.animationDuration};"
  >
    <div
      class="ui:pointer-events-none ui:absolute ui:top-1/2 ui:-z-10 ui:h-px ui:w-[50px] ui:-translate-y-1/2 ui:bg-linear-to-r ui:from-slate-500 ui:via-blue-600/30 ui:to-transparent"
    ></div>
  </span>
{/each}
