<script lang="ts">
  export let description = '';
  export let name = '';
  export let banner = '';
</script>

<section
  class="flex flex-col justify-between relative border-[#EAEAEA] px-6 pt-6 space-y-4 bg-white dark:bg-inherit border dark:border-[#282828] rounded w-full h-full max-w-full sm:max-w-[320px] lg:h-[280px] xl:max-w-[450px]"
>
  <img src="/quote.svg" alt="" class="w-6 h-6 absolute top-6 left-8" />
  <div>
    <p class="my-6 text-[#282828] dark:text-[#ABABAB] line-clamp-5">
      {description}
    </p>
  </div>
  <div class="flex items-center p-4 gap-4 border-[#EAEAEA]">
    <img
      src={banner ? banner : '/classroomio-course-img-template.jpg'}
      alt=""
      class="w-6 h-6 rounded-full"
    />
    <span>
      <p class="text-sm font-bold">{name}</p>
    </span>
  </div>
</section>
