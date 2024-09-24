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
  class="rounded-lg md:h-[250px] w-full md:w-[350px] p-4 border-2 border-[#0233BD] shadow-[-12px_12px_0px_#0233BD] {className}"
>
  <div class="flex flex-col justify-between gap-4 rounded-lg w-full h-full">
    <div class="flex-1 space-y-2">
      <p class="font-serif text-[#0233BD] text-2xl font-semibold uppercase">{title}</p>
      <p class="text-[#656565] line-clamp-4">
        <!-- {description} -->
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nihil aperiam est eligendi, quaerat
        odio ex sint optio ut alias tempora!
      </p>
    </div>
    <a href={getCourseUrl()} class="hover:no-underline">
      <div
        class="uppercase font-medium text-white text-start w-full bg-[#0233BD] p-3 cursor-pointer hover:no-underline hover:scale-90 transition-all duration-200 {buttonClass}"
      >
        Register here
      </div>
    </a>
  </div>
</div>
