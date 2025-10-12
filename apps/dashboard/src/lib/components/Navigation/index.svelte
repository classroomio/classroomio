<script lang="ts">
<<<<<<< HEAD
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
=======
  import { page } from '$app/stores';
>>>>>>> 9c9f049917fc76c540bc21b5a7c4c4d34b89e0b4
  import { user } from '$lib/utils/store/user';
  import { isCoursePage } from '$lib/utils/functions/app';
  import { t } from '$lib/utils/functions/translations';
  import type { TCustomLinks } from './types';

  import Logo from './Logo.svelte';
  import CustomLinks from './CustomLinks.svelte';
  import AuthButtons from './AuthButtons.svelte';
  import MobileMenu from './MobileMenu.svelte';

<<<<<<< HEAD
  interface Props {
    disableSignup?: boolean;
    logo: any;
    orgName: any;
    isOrgSite?: boolean;
    backgroundColor?: string;
  }

  let {
    disableSignup = false,
    logo,
    orgName,
    isOrgSite = false,
    backgroundColor = 'bg-white dark:bg-black'
  }: Props = $props();

  let navClass = $state('');

  const redirect = isCoursePage(page.url.pathname) ? `?redirect=${page.url.pathname}` : '';
=======
  export let disableSignup = false;
  export let logo: string | undefined = undefined;
  export let orgName: string | undefined = undefined;
  export let isOrgSite = false;
  export let backgroundColor = 'bg-white dark:bg-black';
  export let customLinks: TCustomLinks | undefined = undefined;

  let navClass = '';
  let mobileMenuOpen = false;

  $: redirect = isCoursePage($page.url.pathname) ? `?redirect=${$page.url.pathname}` : '';
  $: showLinks =
    customLinks && customLinks.show && customLinks.links && customLinks.links.length > 0;

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }
>>>>>>> 9c9f049917fc76c540bc21b5a7c4c4d34b89e0b4
</script>

<nav
  class="{navClass} {backgroundColor} sticky top-0 z-50 flex w-full border-b border-l-0 border-r-0 border-t-0 border-gray-300 px-2 py-1"
>
  <ul class="flex w-full items-center">
    <Logo {logo} {orgName} />

    <span class="flex-grow" />

    <!-- Mobile Menu Button - Only show when custom links exist -->
    {#if isOrgSite && showLinks}
      <button
        class="mobile-menu-btn hover:text-primary-600 rounded-md p-2 text-gray-700 transition-colors duration-200 hover:bg-gray-100 lg:hidden"
        on:click={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
        </svg>
      </button>
    {/if}

<<<<<<< HEAD
    <span class="flex-grow"></span>
=======
    {#if customLinks && showLinks}
      <CustomLinks {customLinks} />
    {/if}
>>>>>>> 9c9f049917fc76c540bc21b5a7c4c4d34b89e0b4

    {#if $user.isLoggedIn}
      {#if isOrgSite}
        <li><a class="block" href="/lms"> {$t('navigation.goto_lms')} </a></li>
      {/if}
<<<<<<< HEAD
    {:else if !page.url.pathname?.includes('/404')}
      <li>
        <div class="flex">
          <PrimaryButton
            label={$t('navigation.login')}
            variant={VARIANTS.TEXT}
            onClick={() => goto('/login' + redirect)}
          />
        </div>
      </li>
      <li>
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
=======
    {:else if isOrgSite && !$page.url.pathname?.includes('/404')}
      <!-- Hide login/signup buttons on mobile when custom links exist -->
      <div class="hidden lg:block">
        <AuthButtons {disableSignup} {redirect} />
      </div>
    {:else if !isOrgSite && !$page.url.pathname?.includes('/404')}
      <AuthButtons {disableSignup} {redirect} />
>>>>>>> 9c9f049917fc76c540bc21b5a7c4c4d34b89e0b4
    {/if}
  </ul>

  {#if showLinks}
    <MobileMenu bind:mobileMenuOpen {customLinks} {disableSignup} {redirect} />
  {/if}
</nav>

<style>
  ul {
    margin: 0 auto;
    padding: 0;
  }

  ul::after {
    content: '';
    display: block;
    clear: both;
  }

  a {
    text-decoration: none;
    color: var(--main-primary-color);
    padding: 0 1.5em;
    font-weight: 700;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-direction: column;
  }

  /* Mobile menu button styles */
  .mobile-menu-btn {
    display: none;
  }

  @media only screen and (max-width: 1023px) {
    nav.hide {
      display: none;
    }
    ul {
      align-items: center;
    }

    a {
      padding: 0 0.5em;
    }

    .mobile-menu-btn {
      display: block;
    }
  }
</style>
