<script lang="ts">
  interface Props {
    items?: {
      title: string;
      desc: string;
    }[];
  }

  let { items = [] }: Props = $props();
</script>

<div class="relative flex w-fit justify-center space-x-8 md:space-x-10">
  <div
    class="before:bg-linear-to-t mt-10 w-[3px] bg-blue-600 before:absolute before:bottom-0 before:h-36 before:w-[4px] before:from-white before:to-transparent md:w-[2px]"
  ></div>
  <div class="space-y-8">
    {#each items as card, index}
      <div class="md:w-140 w-full space-y-4 rounded-lg border-2 bg-white px-4 py-8">
        <div class="flex items-center">
          <div
            class={`absolute -left-3 z-50 ${
              index > 0 &&
              'before:bg-linear-to-t before:absolute before:-top-36 before:h-36 before:w-[4px] before:from-white before:to-transparent'
            } flex h-7 w-7 items-center justify-center rounded-full bg-blue-100`}
          >
            <div class="z-50 h-4 w-4 rounded-full bg-blue-800"></div>
          </div>
          <h1 class="text-2xl font-bold text-blue-800">{card.title}</h1>
        </div>
        <p class="text-base text-gray-500">
          {card.desc}
        </p>
      </div>
    {/each}
  </div>
</div>
