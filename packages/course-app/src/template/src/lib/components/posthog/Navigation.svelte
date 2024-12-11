<script lang="ts">
  import { goto } from '$app/navigation';

  import Close from 'carbon-icons-svelte/lib/Close.svelte';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';
  import { Button } from '$lib/components/ui/button';
  import { sharedPage } from '$lib/utils/stores/pages';
  import { getPageSection } from '$lib/utils/helpers/page';
  import type { Section } from '@/utils/types/page';
  import PrimaryButton from './PrimaryButton.svelte';

  let backgroundColor = 'bg-white dark:bg-black';

  let open = $state(false);

  const content = $derived(getPageSection($sharedPage, 'navigation'));
  const seo: Section | undefined = $derived(getPageSection($sharedPage, 'seo'));

  function toggleMenu() {
    open = !open;
  }
</script>

<nav
  class={`relative w-full flex items-center justify-between  border-b border-[#D0D1C9]  py-1 px-6 ${backgroundColor}`}
>
  <!-- Logo Section -->
  <a href="/" class="flex items-center flex-col" title={`${seo?.settings?.title}`} id="logo">
    {#if seo?.settings?.logo}
      <img
        src={seo?.settings?.logo || ''}
        alt={`${seo?.settings?.title || ''} logo`}
        class="rounded inline-block mx-auto"
      />
    {/if}
  </a>

  <!-- Mobile Menu Button (Visible only on mobile and when logged in) -->
  <button onclick={toggleMenu} class="lg:hidden">
    <Menu size={24} />
  </button>

  <!-- Desktop Navigation Menu (Hidden on mobile) -->
  <ul
    class="hidden lg:flex items-center space-x-8 text-base font-bold text-[#1F2937] list-none hover:no-underline"
  >
    {#each content?.settings.navItems as menu}
      <a
        href={menu.link}
        class=" font-normal px-4 py-3 hover:bg-slate-300 dark:text-white dark:hover:text-black rounded-lg"
      >
        <li class="hover:no-underline">{menu.title}</li>
      </a>
    {/each}
  </ul>

  <!-- PrimaryButtons for login/signup (Visible only when not logged in) -->

  <!-- Mobile Sidebar Menu (Visible only on mobile) -->

  <ul
    class={`fixed top-0 left-0 pt-10 h-full bg-white dark:bg-black w-full transform hover:no-underline ${
      open ? 'translate-y-0' : '-translate-y-full'
    } transition-transform duration-300 ease-in-out lg:hidden text-base font-bold text-[#1F2937] dark:text-white list-none cursor-pointer`}
  >
    <button onclick={toggleMenu} class="absolute right-4 top-4 lg:hidden z-20">
      <Close size={24} />
    </button>

    {#each content?.settings.navItems as menu}
      <li class="py-4 px-6 border-b dark:border-gray-200">
        <a href={menu.link} onclick={toggleMenu}>{menu.title}</a>
      </li>
    {/each}

    <div class="border-b dark:border-gray-200 py-4 px-6">
      <PrimaryButton
        onClick={() => {
          goto('/courses');
          toggleMenu;
        }}
        class="bg-[#F7A50180] hover:bg-[#f7a501ad] dark:bg-[#F7A501] hover:no-underline rounded-lg flex items-center py-2 px-3 border w-fit border-[#4A4C524D] font-bold text-black text-base"
        label="Explore Course"
      />
    </div>
  </ul>

  <!-- Learn with Me Button (Visible on desktop when logged in) -->

  <div class="hidden lg:flex items-center gap-2">
    <PrimaryButton
      onClick={() => goto('/courses')}
      class="mb-0 bg-[#F7A50180] hover:bg-[#f7a501ad] dark:bg-[#F7A501] shadow-none hover:no-underline rounded-lg flex items-center py-2 px-3 border w-fit border-[#4A4C524D] ring-0 font-bold text-black text-base"
      label="Explore Course"
    />
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
