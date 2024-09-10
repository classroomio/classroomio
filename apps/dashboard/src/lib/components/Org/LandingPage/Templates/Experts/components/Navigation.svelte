<script>
  import { isCoursePage } from '$lib/utils/functions/app';
  import { t } from '$lib/utils/functions/translations';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { ArrowRight, Close } from 'carbon-icons-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { user } from '$lib/utils/store/user';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';

  export let disableSignup = false;
  export let logo;
  export let orgName;
  export let isOrgSite = false;
  export let backgroundColor = 'bg-white dark:bg-black';

  let open = false; // State for mobile menu

  const menuItems = [
    {
      title: 'About me',
      link: '#about'
    },
    {
      title: 'Courses',
      link: '#course'
    },
    {
      title: 'Learning Path',
      link: '#path'
    },
    {
      title: 'Testimonial',
      link: '#testimonial'
    }
  ];

  const redirect = isCoursePage($page.url.pathname) ? `?redirect=${$page.url.pathname}` : '';

  // Function to toggle the mobile menu
  function toggleMenu() {
    open = !open;
  }
</script>

<nav class={`relative w-full flex items-center justify-between py-4 px-6 ${backgroundColor}`}>
  <!-- Logo Section -->
  <div class="logo">
    <a
      href="/"
      title={`${$t('navigation.goto')} ${orgName || 'ClassroomIO'} ${$t('navigation.home')}`}
      id="logo"
    >
      <img
        src={logo || '/logo-192.png'}
        alt={`${orgName || 'ClassroomIO'} logo`}
        class="rounded w-9 inline-block mx-auto"
      />
    </a>
  </div>

  <!-- Mobile Menu Button (Visible only on mobile and when logged in) -->
  {#if $user.isLoggedIn}
    <button on:click={toggleMenu} class="lg:hidden">
      <Menu size={24} />
    </button>
  {/if}

  <!-- Desktop Navigation Menu (Hidden on mobile) -->
  <ul
    class="hidden lg:flex items-center space-x-8 text-base font-bold text-[#1F2937] list-none hover:no-underline"
  >
    {#if $user.isLoggedIn}
      {#each menuItems as menu}
        <li><a href={menu.link}>{menu.title}</a></li>
      {/each}
    {/if}
  </ul>

  <!-- PrimaryButtons for login/signup (Visible only when not logged in) -->
  {#if !$user.isLoggedIn}
    <div class="flex space-x-4">
      <PrimaryButton
        label={$t('navigation.login')}
        variant={VARIANTS.TEXT}
        onClick={() => goto('/login' + redirect)}
      />
      {#if !disableSignup}
        <PrimaryButton
          label={$t('navigation.signup')}
          variant={VARIANTS.CONTAINED}
          onClick={() => goto('/signup' + redirect)}
        />
      {/if}
    </div>
  {/if}

  <!-- Mobile Sidebar Menu (Visible only on mobile) -->
  <ul
    class={`fixed top-0 left-0 h-full bg-white w-full transform hover:no-underline ${
      open ? 'translate-y-0' : '-translate-y-full'
    } transition-transform duration-300 ease-in-out lg:hidden text-base font-bold text-[#1F2937] list-none cursor-pointer`}
  >
    <button on:click={toggleMenu} class="absolute right-4 top-4 lg:hidden z-20">
      <Close size={24} />
    </button>

    {#if $user.isLoggedIn}
      {#each menuItems as menu}
        <li class="py-4 px-6 border-b">
          <a href={menu.link} on:click={toggleMenu}>{menu.title}</a>
        </li>
      {/each}
      {#if isOrgSite}
        <a href="/#" class="flex items-center gap-1 py-4 px-6 border-b" on:click={toggleMenu}>
          <p class="font-bold text-[#1F2937] text-base">Learn with me</p>
          <ArrowRight size={16} class="fill-[#1F2937] font-bold" />
        </a>
      {/if}
    {/if}
  </ul>

  <!-- Learn with Me Button (Visible on desktop when logged in) -->
  {#if $user.isLoggedIn && isOrgSite}
    <a href="/#" class="hidden lg:flex items-center gap-1">
      <p class="font-bold text-[#1F2937] text-base">Learn with me</p>
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
