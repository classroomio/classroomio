<script>
  import { landingPageSettings } from '$lib/components/Org/Settings/store';

  function getCourseUrl() {
    return '#';
  }
</script>

{#if $landingPageSettings.footerNote.show}
  <section class="w-full h-full p-4 md:p-20">
    <section
      class="mx-auto w-fit flex flex-col items-center justify-between px-6 lg:px-10 py-20 space-y-4 bg-[#E5E7E0] dark:bg-[#232429] rounded-md"
    >
      <div class="flex items-center justify-center w-full">
        <p class="text-4xl text-center lg:text-start font-bold w-full lg:w-[80%] capitalize">
          {$landingPageSettings.footerNote.title}
        </p>
      </div>
      <div
        class="w-full lg:w-[80%] flex flex-col lg:flex-row items-center lg:items-end gap-4 lg:gap-0 lg:justify-between"
      >
        <p class="text-center lg:text-start text-sm font-semibold w-full lg:w-[50%]">
          {$landingPageSettings.footerNote.subtitle}
        </p>
        <a href={getCourseUrl()} class="hover:no-underline">
          <div
            class="transition text-start px-3 py-2 cursor-pointer hover:no-underline w-fit rounded-md uppercase !ring-1 !ring-[#B17816] hover:bg-[#EB9D2A] dark:hover:text-black shadow-[0px_3px_#B17816] font-semibold"
          >
            Register here
          </div>
        </a>
      </div>
    </section>
  </section>
{/if}
