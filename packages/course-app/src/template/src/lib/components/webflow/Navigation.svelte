<script lang="ts">
  import Close from 'carbon-icons-svelte/lib/Close.svelte';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';

  import DirectionStraightRight from 'carbon-icons-svelte/lib/DirectionStraightRight.svelte';

  import { ArrowUpRight, Demo } from 'carbon-icons-svelte';
  import { goto } from '$app/navigation';
  import { getPageSection } from '@/utils/helpers/page';
  import { sharedPage } from '@/utils/stores/pages';
  import PrimaryButton from './PrimaryButton.svelte';
  import { SECTION } from '@/utils/constants/page';

  let open = $state(false);

  function toggleMenu() {
    open = !open;
  }

  const seo = $derived(getPageSection($sharedPage, SECTION.SEO));
  const content = $derived(getPageSection($sharedPage, SECTION.NAVIGATION));
</script>

<!-- testing this out for now -->
<section class="fixed left-[5%] top-2 z-50 mx-auto w-[90%] lg:left-[2%] lg:w-fit">
  <div class="flex flex-row-reverse items-start justify-between">
    <div class="z-50 flex items-center p-1 lg:hidden">
      <button
        onclick={toggleMenu}
        class="flex w-fit items-center gap-2 bg-gray-900 p-2 text-sm text-white transition dark:bg-[#181818]"
      >
        {#if open}
          <Close size={24} />
          <p class="font-semibold uppercase">close</p>
        {:else}
          <Menu size={24} />
          <p class="font-semibold uppercase">Menu</p>
        {/if}
      </button>
    </div>
    <nav
      class="absolute w-full py-2 transition lg:relative {open
        ? 'translate-x-0 lg:translate-x-0 '
        : '-translate-x-full lg:translate-x-0 '}"
    >
      <!-- desktop nav -->
      <div
        class="relative h-80 w-52 rounded bg-gray-900 py-2 text-sm text-white transition dark:border-[#363636] dark:bg-[#181818]"
      >
        <div
          class="flex items-center justify-between gap-2 border-b px-4 py-2 dark:border-[#363636]"
        >
          <a href="/" title={seo?.settings.title} id="logo">
            <img
              src={seo?.settings.logo}
              alt={`${seo?.settings.title} logo`}
              class="size-8 mx-auto inline-block rounded bg-white object-contain"
            />
          </a>
        </div>
        <div class="flex flex-col gap-2 space-y-2 border-b px-4 py-4 dark:border-[#363636]">
          {#each content?.settings.navItems.slice(0, 2) as navItem}
            <a href={navItem.link} onclick={toggleMenu} class="flex items-center gap-2">
              {#if navItem.redirect}
                <ArrowUpRight />
              {:else}
                <Demo />
              {/if}
              <p>{navItem.title}</p>
            </a>
          {/each}
        </div>

        <div class="flex flex-col gap-2 space-y-2 border-b px-4 py-4 dark:border-[#363636]">
          {#each content?.settings.navItems.slice(2, content?.settings.navItems.length) as navItem}
            <a href={navItem.link} onclick={toggleMenu} class="flex items-center gap-2">
              {#if navItem.redirect}
                <ArrowUpRight />
              {:else}
                <Demo />
              {/if}
              <p>{navItem.title}</p>
            </a>
          {/each}
        </div>

        <div class="px-2 py-6">
          <PrimaryButton
            class="group flex h-fit w-full items-center gap-6 rounded bg-[#0233BD] px-2 py-2 text-xs text-white hover:bg-[#0233BD]"
            onClick={() => {
              goto('/courses');
              toggleMenu();
            }}
            label="Learn with us"
          >
            <DirectionStraightRight
              size={16}
              class="transition-transform duration-300 group-hover:translate-x-1"
            />
          </PrimaryButton>
        </div>
      </div>
    </nav>
  </div>
</section>
