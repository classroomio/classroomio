<script lang="ts">
  import { ArrowRight, ArrowUpRight, Close } from 'carbon-icons-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import { getPageSection } from '@/utils/helpers/page';
  import { sharedPage } from '@/utils/stores/pages';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';

  let open = $state(false);

  function toggleMenu() {
    open = !open;
  }

  const seo = $derived(getPageSection($sharedPage, 'seo'));
  const content = $derived(getPageSection($sharedPage, 'navigation'));
</script>

<nav class={`relative w-full flex items-center justify-between py-4 px-6 bg-white dark:bg-black`}>
  <!-- Logo Section -->
  <div class="logo">
    <a href="/" title={`${seo?.settings.title} home`} id="logo">
      <img
        src={seo?.settings.logo}
        alt={`${seo?.settings.title} logo`}
        class="rounded w-9 inline-block mx-auto"
      />
    </a>
  </div>

  <!-- Mobile Menu Button (Visible only on mobile and when logged in) -->

  <button onclick={toggleMenu} class="lg:hidden">
    <Menu size={24} />
  </button>

  <!-- Desktop Navigation Menu (Hidden on mobile) -->
  <ul
    class="hidden lg:flex items-center space-x-8 text-base font-bold text-[#1F2937] list-none hover:no-underline"
  >
    {#each content?.settings.navItems as navItem}
      <li>
        <a href={navItem.link} class="flex items-center gap-1">
          {navItem.title}
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

    {#each content?.settings.navItem as navItem}
      <li class="py-4 px-6 border-b">
        <a href={navItem.link} onclick={toggleMenu} class="flex item-center gap-1">
          {navItem.title}
          {#if navItem.redirect}
            <ArrowUpRight size={12} />
          {/if}
        </a>
      </li>
    {/each}
    <a href="/courses" class="flex items-center gap-1 py-4 px-6 border-b" onclick={toggleMenu}>
      <p class="font-bold text-[#1F2937] text-base">Learn with me</p>
      <ArrowRight size={16} class="fill-[#1F2937] font-bold" />
    </a>
  </ul>

  <!-- Learn with Me Button (Visible on desktop when logged in) -->

  <a href="/courses" class="hidden lg:flex items-center gap-1">
    <p class="font-bold text-[#1F2937] text-base">Learn with me</p>
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
