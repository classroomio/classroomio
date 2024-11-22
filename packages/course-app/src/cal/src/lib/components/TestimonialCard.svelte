<script lang="ts">
  interface Props {
    description?: string;
    name?: string;
    role?: string;
    banner?: string;
  }

  let {
    description = '',
    name = '',
    role = '',
    banner = ''
  }: Props = $props();
</script>

<section
  class="cursor-pointer flex flex-col relative overflow-visible px-6 pt-6 gap-4 p-4 bg-white border border-[#D7D7D7] rounded-3xl w-full h-fit max-w-full sm:max-w-[320px] xl:max-w-[400px]"
>
  <div class="flex items-center gap-2">
    <img
      src={banner ? banner : '/classroomio-course-img-template.jpg'}
      alt=""
      class="w-10 h-10 rounded-full"
    />
    <span class="flex flex-col items-start">
      <p class="text-sm font-bold">{name}</p>
      <p class="text-sm text-[#4C5A70]">{role}</p>
    </span>
  </div>
  <div>
    <p class=" text-[#282828] dark:text-[#ABABAB]">
      {description}
    </p>
  </div>
</section>
