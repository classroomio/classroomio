<script lang="ts">
  import { ArrowUpRight, Close } from 'carbon-icons-svelte';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { Section } from '$lib/utils/types/page';

  interface Props {
    seo: Section | undefined;
    content: Section | undefined;
  }

  let { seo, content }: Props = $props();

  let open = $state(false);

  function toggleMenu() {
    open = !open;
  }
</script>

<nav
  class="relative md:sticky top-0 z-[3000] w-full flex items-center justify-between bg-[#F4F4F4] border-b border-[#D0D1C9] py-4 px-6"
>
  <!-- Logo Section -->
  <a href="/" class="flex items-center flex-col" title={`${seo?.settings?.title}`} id="logo">
    <img
      src={seo?.settings?.logo || ''}
      alt={`${seo?.settings?.title || ''} logo`}
      class="rounded inline-block mx-auto"
    />
    <h1 class="text-xl font-semibold">University</h1>
  </a>

  <ul
    class="hidden lg:flex items-center gap-14 text-base font-semibold text-[#1F2937] list-none hover:no-underline"
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
    class="bg-[#141414] rounded-full hidden lg:flex items-center gap-1 font-semibold  text-white text-base"
  >
    Explore Courses
  </Button>

  <!-- Mobile Menu Button (Visible only on mobile and when logged in) -->
  <button onclick={toggleMenu} class="lg:hidden">
    <Menu size={24} />
  </button>

  <!-- Mobile Sidebar Menu (Visible only on mobile) -->
  <ul
    class={`fixed top-0 left-0 pt-10 h-full bg-white w-full transform hover:no-underline ${
      open ? 'translate-y-0  ' : '-translate-y-full'
    } transition-transform duration-300 ease-in-out lg:hidden text-base font-semibold text-[#1F2937] list-none cursor-pointer`}
  >
    <button onclick={toggleMenu} class="absolute right-4 top-4 lg:hidden z-20">
      <Close size={24} />
    </button>

    <div class="divide-y divide-solid border-b">
      {#each content?.settings.navItems as navItem}
        <li class="py-4 px-6">
          <a href={navItem.link} onclick={toggleMenu}>{navItem.title}</a>
        </li>
      {/each}
    </div>

    <Button
      href="/courses"
      class="flex items-center mx-auto justify-center gap-1 py-4 px-6 bg-[#141414] w-fit my-4 font-semibold rounded-full text-white text-base"
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
