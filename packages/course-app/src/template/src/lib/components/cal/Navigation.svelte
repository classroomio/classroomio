<script lang="ts">
  import { ArrowUpRight, Close } from 'carbon-icons-svelte';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';
  import { sharedPage } from '$lib/utils/stores/pages';
  import { getPageSection } from '$lib/utils/helpers/page';
  import { Button } from '$lib/components/ui/button';
  import type { Section } from '$lib/utils/types/page';
  import Logo from '$lib/components/ui/_custom/Logo.svelte';

  let open = $state(false);

  const content = $derived(getPageSection($sharedPage, 'navigation'));
  const seo: Section | undefined = $derived(getPageSection($sharedPage, 'seo'));

  function toggleMenu() {
    open = !open;
  }
</script>

<nav
  class="relative top-0 z-[3000] flex w-full items-center justify-between border-b border-[#D0D1C9] bg-[#F4F4F4] px-6 py-4 md:sticky"
>
  <!-- Logo Section -->
  <Logo src={seo?.settings.logo} alt={seo?.settings.title} className="w-24" addAcademy />

  <ul
    class="hidden list-none items-center gap-14 text-base font-semibold text-[#1F2937] hover:no-underline lg:flex"
  >
    {#each content?.settings.navItems as navItem}
      <li>
        <a
          href={navItem.link}
          target={navItem.redirect ? '_blank' : undefined}
          class="flex items-center gap-1 hover:underline"
        >
          {navItem.title}
          {#if navItem.redirect}
            <ArrowUpRight size={16} />
          {/if}
        </a>
      </li>
    {/each}
  </ul>

  <Button
    href="/courses"
    class="hidden items-center gap-1 rounded-full bg-[#141414] text-base font-semibold  text-white lg:flex"
  >
    Explore Courses
  </Button>

  <!-- Mobile Menu Button (Visible only on mobile and when logged in) -->
  <button onclick={toggleMenu} class="lg:hidden">
    <Menu size={24} />
  </button>

  <!-- Mobile Sidebar Menu (Visible only on mobile) -->
  <ul
    class={`fixed left-0 top-0 h-full w-full transform bg-white pt-10 hover:no-underline ${
      open ? 'translate-y-0  ' : '-translate-y-full'
    } cursor-pointer list-none text-base font-semibold text-[#1F2937] transition-transform duration-300 ease-in-out lg:hidden`}
  >
    <button onclick={toggleMenu} class="absolute right-4 top-4 z-20 lg:hidden">
      <Close size={24} />
    </button>

    <div class="divide-y divide-solid border-b">
      {#each content?.settings.navItems as navItem}
        <li class="px-6 py-4">
          <a href={navItem.link} onclick={toggleMenu}>{navItem.title}</a>
        </li>
      {/each}
    </div>

    <Button
      href="/courses"
      class="mx-auto my-4 flex w-fit items-center justify-center gap-1 rounded-full bg-[#141414] px-6 py-4 text-base font-semibold text-white"
      on:click={toggleMenu}
    >
      Explore Courses
    </Button>
  </ul>
</nav>

<style>
  ul {
    z-index: 10;
  }
</style>
