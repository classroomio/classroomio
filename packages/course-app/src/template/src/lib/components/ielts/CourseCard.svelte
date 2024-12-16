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

<!-- only custom colors work for shadow -->
<div
  class="border-ielts w-full rounded-lg border-2 p-4 shadow-[-12px_12px_0px_#0233BD] md:h-[300px] md:w-[350px] {className}"
>
  <div class="flex h-full w-full flex-col justify-between gap-4 rounded-lg">
    <div class="flex-1 space-y-2">
      <p class="text-ielts line-clamp-2 font-serif text-xl font-semibold uppercase">{title}</p>
      <p class="font-inter line-clamp-4 text-gray-600">
        {description}
      </p>
    </div>
    <a href={getCourseUrl()} class="hover:no-underline">
      <div
        class="bg-ielts w-full cursor-pointer p-3 text-start font-medium uppercase text-white transition-all duration-200 hover:scale-90 hover:no-underline {buttonClass}"
      >
        Start course
      </div>
    </a>
  </div>
</div>
