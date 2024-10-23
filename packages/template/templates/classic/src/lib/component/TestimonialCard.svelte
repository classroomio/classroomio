<script lang="ts">
  export let description = '';
  export let name = '';
  export let banner = '';
</script>

<section
  class="flex flex-col justify-between relative border border-[#EAEAEA] px-6 pt-6 space-y-4 bg-[#FDFDFD] rounded w-full h-full lg:h-[280px] max-w-[400px] xl:max-w-[500px]"
>
  <img src="/quote.svg" alt="" class="w-6 h-6 rounded-full absolute top-6 left-8" />
  <div>
    <p class="my-6 font-bold line-clamp-5">
      {description}
    </p>
  </div>
  <div class="flex items-center p-4 gap-4 border-t border-[#EAEAEA]">
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
