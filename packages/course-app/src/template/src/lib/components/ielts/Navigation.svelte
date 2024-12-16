<script>
  import { ArrowRight, ArrowUpRight, Close } from 'carbon-icons-svelte';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';
  import { getPageSection } from '@/utils/helpers/page';
  import { sharedPage } from '@/utils/stores/pages';
  import PrimaryButton from './PrimaryButton.svelte';
  import Logo from '../ui/_custom/Logo.svelte';

  let open = $state(false);

  const seo = $derived(getPageSection($sharedPage, 'seo'));
  const content = $derived(getPageSection($sharedPage, 'navigation'));

  // Function to toggle the mobile menu
  function toggleMenu() {
    open = !open;
  }
</script>

<nav class={`relative flex w-full items-center justify-between border-b pl-6 `}>
  <!-- Logo Section -->
  <Logo src={seo?.settings.logo} alt={seo?.settings.title} />

  <!-- Mobile Menu Button (Visible only on mobile) -->
  <button onclick={toggleMenu} class="px-6 py-4 lg:hidden">
    <Menu size={24} />
  </button>

  <!-- Desktop Navigation Menu (Hidden on mobile) -->
  <ul
    class="hidden list-none items-center space-x-8 text-base font-bold text-gray-700 hover:no-underline lg:flex"
  >
    {#each content?.settings.navItems as navItem}
      <li>
        <a
          href={navItem.link}
          target={navItem.redirect ? '_blank' : undefined}
          class="flex items-center gap-1"
          >{navItem.title}
          {#if navItem.redirect}
            <ArrowUpRight />
          {/if}</a
        >
      </li>
    {/each}
  </ul>

  <!-- Mobile Sidebar Menu (Visible only on mobile) -->
  <ul
    class={`fixed left-0 top-0 h-full w-full transform bg-white hover:no-underline ${
      open ? 'translate-y-0' : '-translate-y-full'
    } cursor-pointer list-none text-base font-bold text-gray-700 transition-transform duration-300 ease-in-out lg:hidden`}
  >
    <button onclick={toggleMenu} class="absolute right-4 top-4 z-20 lg:hidden">
      <Close size={24} />
    </button>

    {#each content?.settings.navItems as navItem}
      <li class="border-b px-6 py-4">
        <a
          href={navItem.link}
          target={navItem.redirect ? '_blank' : undefined}
          class="flex items-center gap-1"
          onclick={toggleMenu}
          >{navItem.title}{#if navItem.redirect}
            <ArrowUpRight />
          {/if}</a
        >
      </li>
    {/each}
    <PrimaryButton
      href="/courses"
      class="flex items-center gap-1 border-b px-6 py-4 text-base font-bold text-gray-700"
      onClick={toggleMenu}
      label="Learn with us"
    >
      <ArrowRight size={16} class="fill-gray-700 font-bold" />
    </PrimaryButton>
  </ul>

  <PrimaryButton
    href="/courses"
    label="Learn with us"
    class="hidden w-fit rounded-none bg-blue-600 px-6 py-6 text-base font-normal text-white hover:no-underline lg:flex"
  >
    <ArrowRight size={20} class="fill-white" />
  </PrimaryButton>
</nav>

<style>
  nav {
    position: relative;
  }
  ul {
    z-index: 10;
  }
</style>
