<script>
  export let className = '';
  export let buttonClass = '';

  export let slug = '';
  export let title = '';
  export let description = '';

  function getCourseUrl() {
    return `/course/${slug}`;
  }
</script>

<div
  class="rounded-lg md:h-[250px] w-full md:w-[350px] p-4 bg-[#E5E7E0] dark:bg-[#232429] border border-[#D0D1C9] {className}"
>
  <div class="flex flex-col justify-between gap-4 rounded-lg w-full h-full">
    <div class="flex-1 space-y-2">
      <p class="text-lg font-bold capitalize">{title}</p>
      <p class="text-sm line-clamp-4">
        <!-- {description} -->
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil aperiam est eligendi, quaerat
        odio ex sint optio ut alias tempora!
      </p>
    </div>
    <a href={getCourseUrl()} class="hover:no-underline">
      <div
        class="transition text-start px-3 py-2 cursor-pointer hover:no-underline w-fit rounded-md uppercase !ring-1 !ring-[#B17816] hover:bg-[#EB9D2A] dark:hover:text-black shadow-[0px_3px_#B17816] font-semibold mb-4 {buttonClass}"
      >
        Register here
      </div>
    </a>
  </div>
</div>
