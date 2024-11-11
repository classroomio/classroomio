<script lang="ts">
  import RatingComponent from './RatingComponent.svelte';

  interface Props {
    name?: string;
    description?: string;
    rating?: number;
    banner?: string;
  }

  let {
    name = '',
    description = '',
    rating = 0,
    banner = ''
  }: Props = $props();
</script>

<div
  class="flex flex-col md:flex-row items-start gap-3 border max-h-full max-w-[300px] md:max-h-[250px] md:max-w-[500px] lg:max-w-[400px] xl:max-w-[550px] rounded-md p-3"
>
  <div class="bg-[#FFE8FF] w-full h-full rounded-md p-2">
    <img
      src={banner ? banner : './classroomio-course-img-template.jpg'}
      alt="tutor"
      class="object-cover w-full h-full rounded"
    />
  </div>
  <div class="w-full space-y-1">
    <p class="text-xl font-semibold">{name}</p>
    <RatingComponent {rating} />
    <p class="text-[#656565] text-sm line-clamp-5 md:line-clamp-4 xl:line-clamp-6">
      {description}
    </p>
  </div>
</div>
