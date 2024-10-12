<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Close from 'carbon-icons-svelte/lib/Close.svelte';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';
  import Light from 'carbon-icons-svelte/lib/Light.svelte';
  import Moon from 'carbon-icons-svelte/lib/Moon.svelte';

  import { browser } from '$app/environment';
  import { toggleBodyByMode } from '$lib/utils/toggleMode';
  import { isDark } from './store';
  import { Button } from '$lib/components/ui/button';
  // import IconButton from '$lib/components/IconButton/index.svelte';

  let disableSignup = false;
  let logo = '';
  let orgName = 'evanai';
  let isOrgSite = true;
  let backgroundColor = 'bg-white dark:bg-black';
  let isActive = false;
  let isCoursePage = false;
  let user = {
    isLoggedIn: true
  };

  // Check if the current URL matches the menu link
  let open = false; // State for mobile menu
  function toggleDarkMode() {
    $isDark = !$isDark;
    toggleBodyByMode($isDark);
    if (browser) {
      localStorage.setItem('mode', $isDark ? 'dark' : '');
    }
  }
  const menuItems = [
    {
      title: 'About',
      link: '#about'
    },
    {
      title: 'Our Courses',
      link: '#course'
    },
    {
      title: 'FAQ',
      link: '#faq'
    }
  ];
  const redirect = isCoursePage ? `?redirect=${$page.url.pathname}` : '';
  // Function to toggle the mobile menu
  function toggleMenu() {
    open = !open;
  }
  const isActiveLink = (menu) => {
    if (browser) {
      return (isActive = window.location.hash === menu.link.replace('#', ''));
    }
    return;
  };
  $: isActive =
    browser && menuItems.some((item) => window.location.hash === item.link.replace('#', ''));
</script>

<nav
  class={`relative w-full flex items-center justify-between  border-b border-[#D0D1C9] py-1 px-6 ${backgroundColor}`}
>
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
  <ul
    class="hidden lg:flex items-center space-x-8 text-base font-bold text-[#1F2937] list-none hover:no-underline"
  >
    {#if user.isLoggedIn}
      {#each menuItems as menu}
        <li
          class="dark:text-white font-normal px-4 py-3 hover:bg-slate-300 dark:hover:text-black rounded-lg {isActive
            ? 'bg-slate-100 rounded-lg'
            : ''}"
          on:click={() => {
            isActiveLink(menu);
          }}
        >
          <a href={menu.link} class="hover:no-underline">{menu.title}</a>
        </li>
      {/each}
    {/if}
  </ul>

  <!-- PrimaryButtons for login/signup (Visible only when not logged in) -->
  {#if !user.isLoggedIn}
    <div class="flex space-x-4">
      <button on:click={() => goto('/login' + redirect)}> login </button>
      {#if !disableSignup}
        <button on:click={() => goto('/signup' + redirect)}> login </button>
      {/if}
    </div>
  {/if}

  <!-- Mobile Sidebar Menu (Visible only on mobile) -->
  {#if user.isLoggedIn}
    <ul
      class={`fixed top-0 left-0 h-full bg-white dark:bg-black w-full transform hover:no-underline ${
        open ? 'translate-y-0' : '-translate-y-full'
      } transition-transform duration-300 ease-in-out lg:hidden text-base font-bold text-[#1F2937] dark:text-white list-none cursor-pointer`}
    >
      <button on:click={toggleMenu} class="absolute right-4 top-4 lg:hidden z-20">
        <Close size={24} />
      </button>

      {#each menuItems as menu}
        <li class="py-4 px-6 border-b dark:border-gray-200">
          <a href={menu.link} on:click={toggleMenu}>{menu.title}</a>
        </li>
      {/each}
      {#if isOrgSite}
        <div class="border-b py-4 px-6">
          <Button
            on:click={toggleMenu}
            class="bg-[#F7A50180] hover:bg-[#f7a501ad] dark:bg-[#F7A501] hover:no-underline rounded-lg flex items-center py-2 px-3 border w-fit border-[#4A4C524D] font-bold text-black text-base"
            >Explore Course</Button
          >
        </div>
      {/if}

      <div class="w-full mx-auto flex flex-col items-center text-center justify-center p-4">
        <button on:click={toggleDarkMode}>
          {#if $isDark}
            <Light size={16} />
          {:else}
            <Moon size={16} />
          {/if}
        </button>
        <p class="text-sm font-semibold">
          {$isDark ? 'Light Mode' : ' Dark Mode'}
        </p>
      </div>
    </ul>
  {/if}

  <!-- Learn with Me Button (Visible on desktop when logged in) -->
  {#if user.isLoggedIn && isOrgSite}
    <div class="hidden lg:flex items-center gap-2">
      <button on:click={toggleDarkMode}>
        {#if $isDark}
          <Light size={16} />
        {:else}
          <Moon size={16} />
        {/if}
      </button>
      <Button
        on:click={toggleMenu}
        class="bg-[#F7A50180] hover:bg-[#f7a501ad] dark:bg-[#F7A501] hover:no-underline rounded-lg flex items-center py-2 px-3 border w-fit border-[#4A4C524D] font-bold text-black text-base"
        >Explore Course</Button
      >
    </div>
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
