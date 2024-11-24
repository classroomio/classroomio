<script lang="ts">
  import { blur } from 'svelte/transition';
  import { Menu, Close } from 'carbon-icons-svelte';
  import SideBarExpandable from '$lib/components/SideBarExpandable.svelte';
  import type { Course } from '$lib/utils/types/course';
  import { getPageSection } from '$lib/utils/helpers/page';
  import { sharedPage } from '$lib/utils/stores/pages';

  interface Props {
    children: import('svelte').Snippet;
    data: Course;
  }
  let { data, children }: Props = $props();

  let open = $state(false);

  const toggleSideBar = () => {
    open = !open;
  };

  let seo = $derived(getPageSection($sharedPage, 'seo'));
</script>

<section class="relative overflow-hidden h-screen">
  <div
    class="sticky top-0 px-4 w-full h-14 flex items-center justify-between border-b border-[#D0D1C9]"
  >
    <div class="lg:pl-4 flex items-center gap-3">
      <button onclick={toggleSideBar} class="md:hidden">
        {#if open}
          <Close size={20} />
        {:else}
          <Menu size={20} />
        {/if}
      </button>

      {#if seo?.settings?.logo}
        <div class="flex items-center gap-3" in:blur>
          <a
            href="/"
            class="flex items-center flex-col"
            title={`${seo?.settings?.title}`}
            id="logo"
          >
            <img
              src={seo?.settings?.logo || ''}
              alt={`${seo?.settings?.title || ''} logo`}
              class="rounded inline-block mx-auto w-16"
            />
          </a>
          <span class="h-5 w-1 bg-[#141414] rounded-full"></span>
          <p class="text-start line-clamp-1 font-semibold text-lg capitalize" title={data.title}>
            {data.title}
          </p>
        </div>
      {/if}
    </div>
    <a
      href={seo?.settings?.appUrl}
      class="bg-[#141414] px-4 py-2 rounded-full hidden lg:flex items-center gap-1 font-semibold text-white text-base"
    >
      Go to app
    </a>
  </div>

  <div class="overflow-hidden flex">
    <!-- sidebar -->
    <div
      class="fixed md:relative transition-all border-r border-[#D0D1C9] dark:bg-[#03030a] w-[300px] md:w-[380px] h-[calc(100vh-56px)] overflow-y-scroll scrollbar-hide p-4 pl-6 space-y-4 {open
        ? 'translate-x-0 '
        : '-translate-x-full md:translate-x-0 z-50'}"
    >
      <SideBarExpandable sections={data.sections} />
    </div>
    <div class="w-full p-5 md:p-10 break-words h-screen overflow-y-scroll">
      {@render children?.()}
    </div>
  </div>
</section>

<style>
  /* Hide scrollbar for Webkit browsers */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for other browsers */
  .scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
</style>
