<script lang="ts">
  import { ArrowRight, ArrowUpRight, Close } from 'carbon-icons-svelte';
  import Logo from '$lib/components/ui/_custom/Logo.svelte';

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

<nav class={`relative flex w-full items-center justify-between bg-white px-6 py-4 dark:bg-black`}>
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
  <ul
    class="hidden list-none items-center space-x-8 text-base font-bold text-[#1F2937] hover:no-underline lg:flex"
  >
    {#each content?.settings.navItems as navItem}
      <li>
        <a href={navItem.link} class="flex items-center gap-1">
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

    {#each content?.settings.navItem as navItem}
      <li class="border-b px-6 py-4">
        <a href={navItem.link} onclick={toggleMenu} class="item-center flex gap-1">
          {navItem.title}
          {#if navItem.redirect}
            <ArrowUpRight />
          {/if}
        </a>
      </li>
    {/each}
    <a href="/courses" class="flex items-center gap-1 border-b px-6 py-4" onclick={toggleMenu}>
      <p class="text-base font-bold text-[#1F2937]">Learn with me</p>
      <ArrowRight size={16} class="fill-[#1F2937] font-bold" />
    </a>
  </ul>

  <!-- Learn with Me Button (Visible on desktop when logged in) -->

  <a href="/courses" class="hidden items-center gap-1 lg:flex">
    <p class="text-base font-bold text-[#1F2937]">Learn with me</p>
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
