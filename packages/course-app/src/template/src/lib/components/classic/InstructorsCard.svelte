<script lang="ts">
  import RatingComponent from './RatingComponent.svelte';

  interface Props {
    name?: string;
    description?: string;
    rating?: number;
    banner?: string;
  }

  let { name = '', description = '', rating = 0, banner = '' }: Props = $props();
</script>

<div
  class="flex max-h-full max-w-[300px] flex-col items-start gap-3 rounded-md border p-3 md:max-h-[250px] md:max-w-[500px] md:flex-row lg:max-w-[400px] xl:max-w-[550px]"
>
  <div class="h-full w-full rounded-md bg-[#FFE8FF] p-2">
    <img
      src={banner ? banner : './course-banner.jpg'}
      alt="tutor"
      class="h-full w-full rounded object-cover"
    />
  </div>
  <div class="w-full space-y-1">
    <p class="text-xl font-semibold">{name}</p>
    <RatingComponent {rating} />
    <p class="line-clamp-5 text-sm text-[#656565] md:line-clamp-4 xl:line-clamp-6">
      {description}
    </p>
  </div>
</div>
