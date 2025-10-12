<script lang="ts">
  import { page } from '$app/stores';
  import { user } from '$lib/utils/store/user';
  import { type TCustomLinks } from './types';
  import CustomLinks from './CustomLinks.svelte';
  import AuthButtons from './AuthButtons.svelte';

  export let mobileMenuOpen = false;
  export let customLinks: TCustomLinks | undefined = undefined;
  export let disableSignup = false;
  export let redirect = '';

  let mobileMenuRef: HTMLElement;

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }
</script>

<!-- Mobile Menu Overlay -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if mobileMenuOpen}
  <div
    class="mobile-menu-overlay fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden"
    on:click={closeMobileMenu}
  >
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      bind:this={mobileMenuRef}
      class="mobile-menu-sidebar absolute right-0 top-0 h-full w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out"
      on:click|stopPropagation
    >
      <div class="flex items-center justify-between border-b border-gray-200 p-4">
        <h3 class="text-lg font-semibold text-gray-800">Menu</h3>
        <button
          on:click={closeMobileMenu}
          class="rounded-md p-2 text-gray-500 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <nav>
        <ul class="space-y-4 divide-y-[1px]">
          <CustomLinks {customLinks} isMobile={true} onMobileClick={closeMobileMenu} />

          <!-- Login/Signup buttons in mobile menu -->
          {#if !$user.isLoggedIn && !$page.url.pathname?.includes('/404')}
            <li class="pt-4">
              <AuthButtons
                {disableSignup}
                {redirect}
                isMobile={true}
                onMobileClick={closeMobileMenu}
              />
            </li>
          {/if}
        </ul>
      </nav>
    </div>
  </div>
{/if}

<style>
  /* Mobile menu styles */
  .mobile-menu-overlay {
    animation: fadeIn 0.2s ease-in-out;
  }

  .mobile-menu-sidebar {
    animation: slideIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
</style>
