<script lang="ts">
  import { ArrowRight, Close } from 'carbon-icons-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';

  let open = false; // State for mobile menu
  let disableSignup = false;
  let logo = '';
  let orgName = 'evanai';
  let isOrgSite = true;
  let backgroundColor = 'bg-white dark:bg-black';

  let activeLink = '';
  let isCoursePage = false;
  let user = {
    isLoggedIn: true
  };

  const menuItems = [
    {
      title: 'What we do',
      link: '/#about'
    },
    {
      title: 'Our Programs',
      link: '/#course'
    },
    {
      title: 'Testimonial',
      link: '/#testimonial'
    }
  ];
  const redirect = isCoursePage ? `?redirect=${$page.url.pathname}` : '';
  // Function to toggle the mobile menu
  function toggleMenu() {
    open = !open;
  }

  $: activeHash = $page.url.hash;
  $: {
    const activeItem = menuItems.find((item) => item.link === `/${activeHash}`);
    if (activeItem) {
      activeLink = activeItem.link;
    }
  }
</script>

<nav class={`relative w-full flex items-center justify-between py-4 px-6 ${backgroundColor}`}>
  <!-- Logo Section -->
  <div class="logo">
    <a href="/" title={`${orgName || 'ClassroomIO'} home`} id="logo">
      <img
        src={logo || '/logo-192.png'}
        alt={`${orgName || 'ClassroomIO'} logo`}
        class="rounded w-9 inline-block mx-auto"
      />
    </a>
  </div>

  <!-- Mobile Menu Button (Visible only on mobile and when logged in) -->
  {#if user.isLoggedIn}
    <button on:click={toggleMenu} class="lg:hidden">
      <Menu size={24} />
    </button>
  {/if}

  <!-- Desktop Navigation Menu (Hidden on mobile) -->
  <ul class="hidden lg:flex items-center space-x-8 text-base font-bold text-[#1F2937] list-none">
    {#if user.isLoggedIn}
      {#each menuItems as menu}
        <li
          class="hover:text-[#CE02CE] {activeLink == menu.link ? 'text-[#CE02CE] underline' : ''}"
        >
          <a href={menu.link}>{menu.title}</a>
        </li>
      {/each}
    {/if}
  </ul>

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
      open ? 'translate-y-0' : '-translate-y-full'
    } transition-transform duration-300 ease-in-out lg:hidden text-base font-bold text-[#1F2937] list-none cursor-pointer`}
  >
    <button on:click={toggleMenu} class="absolute right-4 top-4 lg:hidden z-20">
      <Close size={24} />
    </button>

    {#if user.isLoggedIn}
      {#each menuItems as menu}
        <li class="py-4 px-6 border-b">
          <a href={menu.link} on:click={toggleMenu}>{menu.title}</a>
        </li>
      {/each}
      {#if isOrgSite}
        <a href="/courses" class="flex items-center gap-1 py-4 px-6 border-b" on:click={toggleMenu}>
          <p class="font-bold text-[#1F2937] text-base">Start Learning</p>
          <ArrowRight size={16} class="fill-[#1F2937] font-bold" />
        </a>
      {/if}
    {/if}
  </ul>

  <!-- Learn with Me Button (Visible on desktop when logged in) -->
  {#if user.isLoggedIn && isOrgSite}
    <a href="/courses" class="hidden lg:flex items-center gap-1">
      <p class="font-bold text-[#1F2937] text-base">Start Learning</p>
      <ArrowRight size={16} class="fill-[#1F2937] font-bold" />
    </a>
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
