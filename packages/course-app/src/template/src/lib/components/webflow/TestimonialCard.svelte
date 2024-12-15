<script lang="ts">
  import MagicCard from '$lib/components/ui/magiccard/MagicCard.svelte';

  interface Props {
    index?: number;
    description?: string;
    name?: string;
    banner?: string;
  }

  let { index = 1, description = '', name = '', banner = '' }: Props = $props();
</script>

<MagicCard {index}>
  <section
    class="cursor-pointer flex flex-col justify-between relative px-6 pt-6 space-y-4 hover:bg-[#282828] bg-inherit border border-[#282828] rounded w-full h-full max-w-full lg:h-[280px]"
  >
    <img src="/quote.svg" alt="" class="w-6 h-6 absolute top-6 left-8" />
    <div>
      <p class="my-6 text-[#ABABAB] line-clamp-5">
        {description}
      </p>
    </div>
    <div class="flex items-center p-4 gap-4 border-[#EAEAEA]">
      <img
        src={banner ? banner : '/course-banner.jpg'}
        alt=""
        class="w-6 h-6 rounded-full"
      />
      <span>
        <p class="text-sm font-bold">{name}</p>
      </span>
    </div>
  </section>
</MagicCard>
