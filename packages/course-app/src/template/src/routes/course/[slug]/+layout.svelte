<script lang="ts">
  import { blur } from 'svelte/transition';
  import { Menu, Close, ArrowUpRight } from 'carbon-icons-svelte';
  import SideBarExpandable from '$lib/components/ui/_custom/SideBarExpandable.svelte';
  import type { Course } from '$lib/utils/types/course';
  import { getPageSection } from '$lib/utils/helpers/page';
  import { sharedPage } from '$lib/utils/stores/pages';
  import { components } from '$lib/components';
  import Logo from '$lib/components/ui/_custom/Logo.svelte';

  interface Props {
    children: import('svelte').Snippet;
    data: Course;
  }
  let { data, children }: Props = $props();

  let open = $state(false);

  const toggleSideBar = () => {
    console.log('toggleSideBar');
    open = !open;
  };

  let seo = $derived(getPageSection($sharedPage, 'seo'));
</script>

<section class="relative">
  <div
    class="sticky top-0 px-4 w-full h-14 flex items-center justify-between border-b border-[#D0D1C9] bg-white"
  >
    <div class="lg:pl-4 flex items-center gap-2 md:gap-3">
      <button onclick={toggleSideBar} class="md:hidden">
        {#if open}
          <Close size={20} />
        {:else}
          <Menu size={20} />
        {/if}
      </button>

      {#if seo?.settings?.logo}
        <div class="flex items-center gap-2 md:gap-3" in:blur>

          <Logo src={seo?.settings?.logo} alt={seo?.settings?.title} className="w-16 min-w-[50px]" />
          
          <span class="h-5 w-1 bg-[#141414] rounded-full"></span>
          <p class="text-start line-clamp-1 font-semibold text-lg capitalize" title={data.title}>
            {data.title}
          </p>
        </div>
      {/if}
    </div>
    <components.button
      href={seo?.settings?.appUrl}
      class="mb-0"
      target="_blank"
      rel="noopener noreferrer"
      label={`Go to app`}
    >
      <ArrowUpRight size={16} />
    </components.button>

    <!-- <a
      href={seo?.settings?.appUrl}
      class="bg-[#141414] px-4 py-2 rounded-full hidden md:flex items-center gap-1 font-semibold text-white text-base"
      target="_blank"
      rel="noopener noreferrer"
    >
      Go to app <ArrowUpRight size={16} />
    </a> -->
  </div>

  <div class="overflow-hidden flex">
    <!-- sidebar -->
    <div
      class="fixed transition-all border-r border-[#D0D1C9] bg-white w-[300px] h-[calc(100vh-56px)] overflow-y-scroll p-4 pl-6 space-y-4 {open
        ? 'translate-x-0 z-50'
        : '-translate-x-full md:translate-x-0 z-50'}"
    >
      <SideBarExpandable sections={data.sections} onFileClick={toggleSideBar} />
    </div>
    <div class="w-full md:p-5 mb-20 md:ml-[300px] break-words">
      {@render children?.()}
    </div>
  </div>
</section>
