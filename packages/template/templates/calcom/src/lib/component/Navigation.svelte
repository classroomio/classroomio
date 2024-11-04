<script lang="ts">
  import { ArrowRight, Close } from 'carbon-icons-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';
  import Button from '$lib/components/ui/button/button.svelte';

  let open = false;
  let disableSignup = false;
  let logo = '';
  let orgName = '';
  let isOrgSite = true;
  let backgroundColor = 'bg-white dark:bg-black';
  let isCoursePage = false;
  let user = {
    isLoggedIn: true
  };

  const menuItems = [
    {
      title: 'About',
      link: '/#about'
    },
    {
      title: 'Our Courses',
      link: '/#course'
    },
    {
      title: 'FAQ',
      link: '/#testimonial'
    }
  ];

  const redirect = isCoursePage ? `?redirect=${$page.url.pathname}` : '';

  function toggleMenu() {
    open = !open;
  }
</script>

<nav
  class="relative w-full flex items-center justify-between bg-[#E5E7E0] border-b border-[#D0D1C9] py-4 px-6 ${backgroundColor}"
>
  <!-- Logo Section -->
  <div class="flex justify-between w-[40%]">
    <a href="/" title={`${orgName || 'ClassroomIO'} home`} id="logo">
      <img
        src={logo || '/logo-192.png'}
        alt={`${orgName || 'ClassroomIO'} logo`}
        class="rounded w-9 inline-block mx-auto"
      />
    </a>

    <ul
      class="hidden lg:flex items-center gap-14 text-base font-semibold text-[#1F2937] list-none hover:no-underline"
    >
      {#if user.isLoggedIn}
        {#each menuItems as menu}
          <li><a href={menu.link}>{menu.title}</a></li>
        {/each}
      {/if}
    </ul>
  </div>

  <!-- Mobile Menu Button (Visible only on mobile and when logged in) -->
  {#if user.isLoggedIn}
    <button on:click={toggleMenu} class="lg:hidden">
      <Menu size={24} />
    </button>
  {/if}

  <!-- Desktop Navigation Menu (Hidden on mobile) -->

  <!-- PrimaryButtons for login/signup (Visible only when not logged in) -->
  {#if !user.isLoggedIn}
    <div class="flex space-x-4">
      <button on:click={() => goto('/login' + redirect)}>login</button>
      {#if !disableSignup}
        <button on:click={() => goto('/signup' + redirect)}>signup</button>
      {/if}
    </div>
  {/if}

  <!-- Mobile Sidebar Menu (Visible only on mobile) -->
  <ul
    class={`fixed top-0 left-0 pt-10 h-full bg-white w-full transform hover:no-underline ${
      open ? 'translate-y-0  ' : '-translate-y-full'
    } transition-transform duration-300 ease-in-out lg:hidden text-base font-semibold text-[#1F2937] list-none cursor-pointer`}
  >
    <button on:click={toggleMenu} class="absolute right-4 top-4 lg:hidden z-20">
      <Close size={24} />
    </button>

    {#if user.isLoggedIn}
      <div class="divide-y divide-solid border-b">
        {#each menuItems as menu}
          <li class="py-4 px-6">
            <a href={menu.link} on:click={toggleMenu}>{menu.title}</a>
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
    {/if}
  </ul>

  <!-- Learn with Me Button (Visible on desktop when logged in) -->
  {#if user.isLoggedIn && isOrgSite}
    <Button
      href="/courses"
      class="bg-[#141414] rounded-full hidden lg:flex items-center gap-1 font-semibold  text-white text-base"
    >
      Explore Courses
    </Button>
  {/if}
</nav>

<style>
  nav {
    position: relative;
  }
  ul {
    z-index: 10;
  }
</style>
