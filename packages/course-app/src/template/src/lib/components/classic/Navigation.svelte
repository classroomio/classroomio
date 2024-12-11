<script lang="ts">
  import { ArrowRight, ArrowUpRight, Close } from 'carbon-icons-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
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

<nav class={`relative w-full flex items-center justify-between py-4 px-6 bg-white dark:bg-black`}>
  <!-- Logo Section -->
  <div class="logo">
    <a href="/" title={`${seo?.settings?.title}`} id="logo">
      {#if seo?.settings?.logo}
        <img
          src={seo?.settings?.logo}
          alt={`${seo.settings.title} logo`}
          class="rounded w-9 inline-block mx-auto"
        />
      {/if}
    </a>
  </div>

  <!-- Mobile Menu Button (Visible only on mobile and when logged in) -->

  <button onclick={toggleMenu} class="lg:hidden">
    <Menu size={24} />
  </button>

  <!-- Desktop Navigation Menu (Hidden on mobile) -->
  <ul class="hidden lg:flex items-center space-x-8 text-base font-bold text-[#1F2937] list-none">
    {#each content?.settings.navItems as navItem}
      <li class="hover:text-[#CE02CE]">
        <a
          href={navItem.link}
          target={navItem.redirect ? '_blank' : undefined}
          class="flex items-center gap-1"
          >{navItem.title}
          {#if navItem.redirect}
            <ArrowUpRight size={12} />
          {/if}
        </a>
      </li>
    {/each}
  </ul>

  <!-- Mobile Sidebar Menu (Visible only on mobile) -->
  <ul
    class={`fixed top-0 left-0 pt-10 h-full bg-white w-full transform hover:no-underline ${
      open ? 'translate-y-0' : '-translate-y-full'
    } transition-transform duration-300 ease-in-out lg:hidden text-base font-bold text-[#1F2937] list-none cursor-pointer`}
  >
    <button onclick={toggleMenu} class="absolute right-4 top-4 lg:hidden z-20">
      <Close size={24} />
    </button>

    {#each content?.settings.navItems as navItem}
      <li class="py-4 px-6 border-b">
        <a href={navItem.link} onclick={toggleMenu} class="flex items-center gap-1"
          >{navItem.title}
          {#if navItem.redirect}
            <ArrowUpRight size={12} />
          {/if}</a
        >
      </li>
    {/each}
    <a href="/courses" class="flex items-center gap-1 py-4 px-6 border-b" onclick={toggleMenu}>
      <p class="font-bold text-[#1F2937] text-base">Start Learning</p>
      <ArrowRight size={16} class="fill-[#1F2937] font-bold" />
    </a>
  </ul>

  <!-- Learn with Me Button (Visible on desktop when logged in) -->

  <a href="/courses" class="hidden lg:flex items-center gap-1">
    <p class="font-bold text-[#1F2937] text-base">Start Learning</p>
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
