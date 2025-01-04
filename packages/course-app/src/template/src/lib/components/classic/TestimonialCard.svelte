<script lang="ts">
  interface Props {
    description?: string;
    name?: string;
    banner?: string;
  }

  let { description = '', name = '', banner = '' }: Props = $props();
</script>

<section
  class="relative flex h-full w-full max-w-[400px] flex-col justify-between space-y-4 rounded border border-[#EAEAEA] bg-[#FDFDFD] px-6 pt-6 lg:h-[280px] xl:max-w-[500px]"
>
  <img src="/quote.svg" alt="" class="absolute left-8 top-6 h-6 w-6 rounded-full" />
  <div>
    <p class="my-6 line-clamp-5 font-bold">
      {description}
    </p>
  </div>
  <div class="flex items-center gap-4 border-t border-[#EAEAEA] p-4">
    <img src={banner ? banner : '/course-banner.jpg'} alt="" class="h-6 w-6 rounded-full" />
    <span>
      <p class="text-sm font-bold">{name}</p>
    </span>
  </div>
</section>
