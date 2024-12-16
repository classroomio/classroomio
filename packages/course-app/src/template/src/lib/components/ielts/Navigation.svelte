<script>
  import { ArrowRight, Close } from 'carbon-icons-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';
  import { getPageSection } from '@/utils/helpers/page';
  import { sharedPage } from '@/utils/stores/pages';
  import PrimaryButton from './PrimaryButton.svelte';

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
  <div class="logo">
    <a href="/" title={`${seo?.settings?.title}`} id="logo">
      <img
        src={seo?.settings?.logo}
        alt={`${seo?.settings.title} logo`}
        class="mx-auto inline-block w-9 rounded"
      />
    </a>
  </div>

  <!-- Mobile Menu Button (Visible only on mobile and when logged in) -->

  <button onclick={toggleMenu} class="px-6 py-4 lg:hidden">
    <Menu size={24} />
  </button>

  <!-- Desktop Navigation Menu (Hidden on mobile) -->
  <ul
    class="hidden list-none items-center space-x-8 text-base font-bold text-[#1F2937] hover:no-underline lg:flex"
  >
    {#each content?.settings.navItems as navItem}
      <li><a href={navItem.link}>{navItem.title}</a></li>
    {/each}
  </ul>

  <!-- PrimaryButtons for login/signup (Visible only when not logged in) -->

  <!-- Mobile Sidebar Menu (Visible only on mobile) -->
  <ul
    class={`fixed left-0 top-0 h-full w-full transform bg-white hover:no-underline ${
      open ? 'translate-y-0' : '-translate-y-full'
    } cursor-pointer list-none text-base font-bold text-[#1F2937] transition-transform duration-300 ease-in-out lg:hidden`}
  >
    <button onclick={toggleMenu} class="absolute right-4 top-4 z-20 lg:hidden">
      <Close size={24} />
    </button>

    {#each content?.settings.navItems as navItem}
      <li class="border-b px-6 py-4">
        <a href={navItem.link} onclick={toggleMenu}>{navItem.title}</a>
      </li>
    {/each}
    <PrimaryButton
      href="/#"
      class="flex items-center gap-1 border-b px-6 py-4 text-base font-bold text-[#1F2937]"
      onClick={toggleMenu}
      label="Learn with us"
    >
      <ArrowRight size={16} class="fill-[#1F2937] font-bold" />
    </PrimaryButton>
  </ul>

  <!-- Learn with Me Button (Visible on desktop when logged in) -->

  <PrimaryButton
    href="/#"
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
