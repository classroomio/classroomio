<script lang="ts">
  export let description = '';
  export let name = '';
  export let banner = '';
</script>

<section
  class="cursor-pointer flex flex-col relative overflow-visible border-[#EAEAEA] px-6 pt-6 gap-4 p-4 bg-white border rounded-2xl w-full min-h-[250px] max-w-full sm:max-w-[320px] xl:max-w-[400px]"
>
  <div class="flex items-center gap-4">
    <img
      src={banner ? banner : '/classroomio-course-img-template.jpg'}
      alt=""
      class="w-6 h-6 rounded-full"
    />
    <span>
      <p class="text-sm font-bold">{name}</p>
    </span>
  </div>
  <div>
    <p class=" text-[#282828] dark:text-[#ABABAB]">
      {description}
    </p>
  </div>
</section>
