<script lang="ts">
  import MagicCard from '$lib/components/ui/magiccard/MagicCard.svelte';

  interface Props {
    index?: number;
    description?: string;
    name?: string;
    role: string;
    banner?: string;
  }

  let { index = 1, description = '', name = '', role = '', banner = '' }: Props = $props();
</script>

<div
  class="flex w-full min-w-full snap-center flex-col items-center justify-center gap-4 text-center md:flex-row"
>
  <div class="flex w-full flex-col items-center justify-center space-y-2 text-center md:w-[40%]">
    <img src={banner} alt="" class="size-10 rounded-full" />
    <p class="text-bold text-lg">{name}</p>
    <p class="text-sm">{role}</p>
  </div>
  <div class="w-full">
    {description}
  </div>
</div>
