<script lang="ts">
  import MagicCard from '$lib/components/ui/magiccard/MagicCard.svelte';

  interface Props {
    index?: number;
    description?: string;
    name?: string;
    banner?: string;
  }

  let { index = 1, description = '', name = '', banner = '' }: Props = $props();

  function getBoxBorder(): string {
    const borderStyles = [
      'border-b-2 border-r-2', // Bottom Right
      'border-b-2 border-l-2', // Bottom Left
      'border-t-2 border-r-2', // Top Right
      'border-t-2 border-l-2' // Top Left
    ];
    return borderStyles[index % 4]; // Use modulus to cycle through styles
  }
</script>

<section
  class={` gradient-bg border-linear-border flex h-[300px] w-full flex-col items-center justify-center p-4 md:w-[400px] ${getBoxBorder()}`}
>
  <img src={banner ? banner : '/course-banner.jpg'} alt="" class="size-14 rounded-full" />
  <p class="my-3 w-[70%] text-center text-lg font-medium">{name}</p>
  <p class="line-clamp-5 w-[70%] text-center text-sm text-gray-300">
    {description}
  </p>
</section>
