<!-- <script>
  import { isCoursePage } from '$lib/utils/functions/app';
  import { t } from '$lib/utils/functions/translations';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { ArrowRight } from 'carbon-icons-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { user } from '$lib/utils/store/user';
  import Menu from "carbon-icons-svelte/lib/Menu.svelte";
  import { isMobile } from '$lib/utils/store/useMobile';

  export let disableSignup = false;
  let open = false;
  export let logo;
  export let orgName;
  export let isOrgSite = false;
  export let backgroundColor = 'bg-white dark:bg-black';

  const redirect = isCoursePage($page.url.pathname) ? `?redirect=${$page.url.pathname}` : '';
</script>

<nav class="bg-white w-full flex items-center justify-between py-4 px-6">
  <div class="logo">
    <a
      href="/"
      title={`${$t('navigation.goto')} ${orgName || 'ClassroomIO'} ${$t('navigation.home')}`}
      id="logo"
      data-hveid="8"
    >
      <img
        src={logo || '/logo-192.png'}
        alt={`${orgName || 'ClassroomIO'} logo`}
        class="rounded w-9 inline-block mx-auto"
        data-atf="1"
      />
    </a>
  </div>

  {#if isMobile}
    
  {/if}
  {#if $user.isLoggedIn}
    <ul
      class="flex items-center space-x-8 text-base font-bold text-[#1F2937] cursor-pointer list-none"
    >
      <li>About me</li>
      <li>Courses</li>
      <li>Learning path</li>
      <li>Testimonials</li>
    </ul>
  {/if}
  <span class="flex-grow" />
  {#if $user.isLoggedIn}
    {#if isOrgSite}
      <a href="/#" class="flex items-center gap-1">
        <p class="font-bold text-[#1F2937] text-base">Learn with me</p>
        <ArrowRight size={16} class="fill-[#1F2937] font-bold" />
      </a>
    {/if}
  {:else if !$page.url.pathname?.includes('/404')}
    <li class="list-none">
      <div class="flex">
        <PrimaryButton
          label={$t('navigation.login')}
          variant={VARIANTS.TEXT}
          onClick={() => goto('/login' + redirect)}
        />
      </div>
    </li>
    <li class="list-none">
      {#if !disableSignup}
        <div class="flex">
          <PrimaryButton
            label={$t('navigation.signup')}
            variant={VARIANTS.CONTAINED}
            onClick={() => goto('/signup' + redirect)}
          />
        </div>
      {/if}
    </li>
  {/if}
</nav> -->

<script>
  import { isCoursePage } from '$lib/utils/functions/app';
  import { t } from '$lib/utils/functions/translations';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { ArrowRight, Menu } from 'carbon-icons-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { user } from '$lib/utils/store/user';
  import { isMobile } from '$lib/utils/store/useMobile';

  export let disableSignup = false;
  export let logo;
  export let orgName;
  export let isOrgSite = false;
  export let backgroundColor = 'bg-white dark:bg-black';

  let open = false; // state for the mobile menu

  const redirect = isCoursePage($page.url.pathname) ? `?redirect=${$page.url.pathname}` : '';

  // Function to toggle mobile menu
  function toggleMenu() {
    open = !open;
  }
</script>

<nav class={`w-full flex items-center justify-between py-4 px-6 ${backgroundColor}`}>
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

  <!-- Mobile Menu Button -->
  {#if isMobile && !$user.isLoggedIn}
    <button on:click={toggleMenu} class="md:hidden flex items-center">
      <Menu size={24} />
    </button>
  {/if}

  <!-- Desktop Menu or Mobile Menu when Open -->
  <ul
    class={`flex flex-col md:flex-row items-center md:space-x-8 space-y-4 md:space-y-0 text-base font-bold text-[#1F2937] cursor-pointer list-none ${
      open ? 'block' : 'hidden'
    } md:block`}
  >
    {#if !$user.isLoggedIn}
      <li>About me</li>
      <li>Courses</li>
      <li>Learning path</li>
      <li>Testimonials</li>
    {:else}
      <!-- Show these items only when user is not logged in -->
      <li class="list-none">
        <PrimaryButton
          label={$t('navigation.login')}
          variant={VARIANTS.TEXT}
          onClick={() => goto('/login' + redirect)}
        />
      </li>
      {#if !disableSignup}
        <li class="list-none">
          <PrimaryButton
            label={$t('navigation.signup')}
            variant={VARIANTS.CONTAINED}
            onClick={() => goto('/signup' + redirect)}
          />
        </li>
      {/if}
    {/if}
  </ul>

  <!-- Learn with Me Button -->
  {#if !$user.isLoggedIn && !isOrgSite}
    <a href="/#" class="hidden md:flex items-center gap-1">
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
    transition: transform 0.3s ease-in-out;
  }
  .block {
    display: block !important;
  }
  .hidden {
    display: none !important;
  }
</style>
