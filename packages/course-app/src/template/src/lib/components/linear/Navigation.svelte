<script lang="ts">
  import { goto } from '$app/navigation';

  import Close from 'carbon-icons-svelte/lib/Close.svelte';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';
  import { sharedPage } from '$lib/utils/stores/pages';
  import { getPageSection } from '$lib/utils/helpers/page';
  import type { Section } from '@/utils/types/page';
  import PrimaryButton from './PrimaryButton.svelte';
  import { ArrowUpRight } from 'carbon-icons-svelte';
  import Logo from '$lib/components/ui/_custom/Logo.svelte';

  let open = $state(false);

  const content = $derived(getPageSection($sharedPage, 'navigation'));
  const seo: Section | undefined = $derived(getPageSection($sharedPage, 'seo'));

  function toggleMenu() {
    open = !open;
  }
</script>

<nav class="bg-linear-background w-full py-4">
  <div
    class=" border-linear-border mx-auto flex w-[90%] items-center justify-between rounded-xl border px-6 py-3 md:w-[80%]"
  >
    <!-- Logo Section -->
    <Logo
      src={seo?.settings.logo}
      alt={seo?.settings.title}
      addAcademy
      className="bg-white text-white"
    />

    <!-- Mobile Menu Button (Visible only on mobile and when logged in) -->
    <button onclick={toggleMenu} class="lg:hidden">
      <Menu size={24} class="text-white" />
    </button>

    <!-- Desktop Navigation Menu (Hidden on mobile) -->
    <ul class="hidden list-none items-center space-x-8 hover:no-underline lg:flex">
      {#each content?.settings.navItems as navItem}
        <a
          href={navItem.link}
          target={navItem.redirect ? '_blank' : undefined}
          class="text-sm font-semibold text-gray-400 hover:text-gray-200"
        >
          <li class="flex items-center gap-1 hover:no-underline">
            {navItem.title}
            {#if navItem.redirect}
              <ArrowUpRight size={16} />
            {/if}
          </li>
        </a>
      {/each}
    </ul>

    <!-- Mobile Sidebar Menu (Visible only on mobile) -->

    <ul
      class={`fixed left-0 top-0 h-full w-full transform bg-white pt-10 hover:no-underline dark:bg-black ${
        open ? 'translate-y-0' : '-translate-y-full'
      } cursor-pointer list-none text-base font-bold text-gray-800 transition-transform duration-300 ease-in-out dark:text-white lg:hidden`}
    >
      <button onclick={toggleMenu} class="absolute right-4 top-4 z-20 lg:hidden">
        <Close size={24} />
      </button>

      {#each content?.settings.navItems as navItem}
        <li class="border-b px-6 py-4 dark:border-gray-200">
          <a href={navItem.link} onclick={toggleMenu} class="item-center flex gap-1"
            >{navItem.title}
            {#if navItem.redirect}
              <ArrowUpRight size={16} />
            {/if}</a
          >
        </li>
      {/each}

      <div class="border-b px-6 py-4 dark:border-gray-200">
        <PrimaryButton
          onClick={() => {
            goto('/courses');
            toggleMenu;
          }}
          label="Explore Course"
        />
      </div>
    </ul>

    <!-- Learn with Me Button (Visible on desktop when logged in) -->
    <div class="hidden items-center gap-2 lg:flex">
      <PrimaryButton onClick={() => goto('/courses')} label="Explore Course" class="px-6" />
    </div>
  </div>
</nav>

<style>
  nav {
    position: relative;
  }
  ul {
    z-index: 10;
  }
</style>
