<script>
  import { Button } from '$lib/components/ui/button';

  export let data;
  function getCourseUrl() {
    return '#';
  }
</script>

{#if data.footerNote.show}
  <section class="w-full h-full p-4 md:p-20">
    <section
      class="mx-auto w-fit flex flex-col items-center justify-between px-2 lg:px-10 py-20 space-y-4 bg-[#E5E7E0] dark:bg-[#232429] rounded-md"
    >
      <div class="flex items-center justify-center w-full">
        <p class="text-4xl text-center xl:text-start font-bold w-full lg:w-[80%] capitalize">
          {data.footerNote.title}

          <span class="text-[#F54E00]">{data.footerNote.titleHighlight}</span>
        </p>
      </div>
      <div
        class="w-full lg:w-[80%] flex flex-col lg:flex-row items-center lg:items-end gap-4 lg:gap-0 lg:justify-between"
      >
        <p class="text-center lg:text-start text-sm font-semibold w-full lg:w-[50%]">
          {data.footerNote.subtitle}
        </p>
        <a href={getCourseUrl()} class="hover:no-underline">
          <Button
            class="uppercase py-2 px-3 bg-white text-black ring-1 ring-[#B17816] dark:bg-[#EB9D2A] hover:scale-95 hover:bg-[#EB9D2A] shadow-[0px_3px_#B17816] font-bold mb-4"
            >{data.footerNote.buttonLabel}</Button
          >
        </a>
      </div>
    </section>
  </section>
{/if}
