<script lang="ts">
  import { page } from '$app/stores';
  import { user } from '$lib/utils/store/user';
  import { isCoursePage } from '$lib/utils/functions/app';
  import { t } from '$lib/utils/functions/translations';
  import type { TCustomLinks } from './types';
  import { ModeSwitcher } from '@cio/ui/base/dark-mode';

  import Logo from './Logo.svelte';
  import CustomLinks from './CustomLinks.svelte';
  import AuthButtons from './AuthButtons.svelte';
  import MobileMenu from './MobileMenu.svelte';

  interface Props {
    disableSignup?: boolean;
    logo?: string | undefined;
    orgName?: string | undefined;
    isOrgSite?: boolean;
    backgroundColor?: string;
    customLinks?: TCustomLinks | undefined;
  }

  let {
    disableSignup = false,
    logo = undefined,
    orgName = undefined,
    isOrgSite = false,
    backgroundColor = 'bg-white dark:bg-black',
    customLinks = undefined
  }: Props = $props();

  let navClass = '';
  let mobileMenuOpen = $state(false);

  let redirect = $derived(isCoursePage($page.url.pathname) ? `?redirect=${$page.url.pathname}` : '');
  let showLinks = $derived(customLinks && customLinks.show && customLinks.links && customLinks.links.length > 0);

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }
</script>

<nav
  class="{navClass} {backgroundColor} sticky top-0 z-50 flex w-full border-b border-l-0 border-r-0 border-t-0 border-gray-300 px-2 py-1"
>
  <ul class="flex w-full items-center">
    <Logo {logo} {orgName} />

    <span class="flex-grow"></span>

    <!-- Mobile Menu Button - Only show when custom links exist -->
    {#if isOrgSite && showLinks}
      <button
        class="mobile-menu-btn hover:text-primary-600 rounded-md p-2 text-gray-700 transition-colors duration-200 hover:bg-gray-100 lg:hidden"
        onclick={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
    {/if}

    {#if customLinks && showLinks}
      <CustomLinks {customLinks} />
    {/if}

    {#if $user.isLoggedIn}
      {#if isOrgSite}
        <li><a class="block" href="/lms"> {$t('navigation.goto_lms')} </a></li>
      {/if}
    {:else if isOrgSite && !$page.url.pathname?.includes('/404')}
      <!-- Hide login/signup buttons on mobile when custom links exist -->
      <div class="hidden lg:block">
        <AuthButtons {disableSignup} {redirect} />
      </div>
    {:else if !isOrgSite && !$page.url.pathname?.includes('/404')}
      <AuthButtons {disableSignup} {redirect} />
    {/if}

    <ModeSwitcher />
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
