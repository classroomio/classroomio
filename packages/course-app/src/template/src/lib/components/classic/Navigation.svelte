<script lang="ts">
  import { ArrowRight, ArrowUpRight, Close } from 'carbon-icons-svelte';
  import Logo from '$lib/components/ui/_custom/Logo.svelte';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';
  import { getPageSection } from '@/utils/helpers/page';
  import { sharedPage } from '@/utils/stores/pages';
  import type { Section } from '@/utils/types/page';

  const content = $derived(getPageSection($sharedPage, 'navigation'));
  const seo: Section | undefined = $derived(getPageSection($sharedPage, 'seo'));

  let open = $state(false); // State for mobile menu

  // Function to toggle the mobile menu
  function toggleMenu() {
    open = !open;
  }
</script>

<nav
  class="relative flex w-full items-center justify-between border-b-2 bg-white px-6 py-4 dark:bg-black"
>
  <!-- Logo Section -->
  <div class="flex flex-row items-center gap-1">
    <Logo src={seo?.settings.logo} alt={seo?.settings.title} className="w-24" />
    <span class="mt-1 text-lg font-semibold italic">Academy</span>
  </div>

  <!-- Mobile Menu Button (Visible only on mobile and when logged in) -->

  <button onclick={toggleMenu} class="lg:hidden">
    <Menu size={24} />
  </button>

  <!-- Desktop Navigation Menu (Hidden on mobile) -->
  <ul class="hidden list-none items-center space-x-8 text-base font-bold text-[#1F2937] lg:flex">
    {#each content?.settings.navItems as navItem}
      <li class="hover:text-[#CE02CE]">
        <a
          href={navItem.link}
          target={navItem.redirect ? '_blank' : undefined}
          class="flex items-center gap-1"
        >
          {navItem.title}
          {#if navItem.redirect}
            <ArrowUpRight />
          {/if}
        </a>
      </li>
    {/each}
  </ul>

  <!-- Mobile Sidebar Menu (Visible only on mobile) -->
  <ul
    class={`fixed left-0 top-0 h-full w-full transform bg-white pt-10 hover:no-underline ${
      open ? 'translate-y-0' : '-translate-y-full'
    } cursor-pointer list-none text-base font-bold text-[#1F2937] transition-transform duration-300 ease-in-out lg:hidden`}
  >
    <button onclick={toggleMenu} class="absolute right-4 top-4 z-20 lg:hidden">
      <Close size={24} />
    </button>

    {#each content?.settings.navItems as navItem}
      <li class="border-b px-6 py-4">
        <a href={navItem.link} onclick={toggleMenu} class="flex items-center gap-1"
          >{navItem.title}
          {#if navItem.redirect}
            <ArrowUpRight />
          {/if}</a
        >
      </li>
    {/each}
    <a href="/courses" class="flex items-center gap-1 border-b px-6 py-4" onclick={toggleMenu}>
      <p class="text-base font-bold text-[#1F2937]">Start Learning</p>
      <ArrowRight size={16} class="fill-[#1F2937] font-bold" />
    </a>
  </ul>

  <!-- Learn with Me Button (Visible on desktop when logged in) -->

  <a href="/courses" class="hidden items-center gap-1 lg:flex">
    <p class="text-base font-bold text-[#1F2937]">Start Learning</p>
    <ArrowRight size={16} class="fill-[#1F2937] font-bold" />
  </a>
</nav>

<style>
  nav {
    position: relative;
  }
  ul {
    z-index: 10;
  }
</style>
