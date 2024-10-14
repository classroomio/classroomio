<script>
  import { Button } from '$lib/components/ui/button';

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
  class="rounded-lg h-[250px] w-full max-w-full md:max-w-[280px] xl:max-w-[300px] p-4 bg-[#E5E7E0] dark:bg-[#232429] border border-[#D0D1C9] {className}"
>
  <div class="flex flex-col justify-between gap-4 rounded-lg w-full h-full">
    <div class="flex-1 space-y-2">
      <p class="text-lg font-bold capitalize">{title}</p>
      <p class="text-sm line-clamp-4">
        {description}
      </p>
    </div>
    <a href={getCourseUrl()} class="hover:no-underline">
      <Button
        class="px-8 transition bg-white capitalize font-bold text-black ring-1 ring-[#B17816] dark:bg-[#EB9D2A] hover:scale-95 hover:bg-[#EB9D2A] shadow-[0px_3px_#B17816] mb-4 {buttonClass}"
        >Get started</Button
      >
    </a>
  </div>
</div>
