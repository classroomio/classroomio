<script lang="ts">
  import Close from 'carbon-icons-svelte/lib/Close.svelte';
  import Menu from 'carbon-icons-svelte/lib/Menu.svelte';
  import Light from 'carbon-icons-svelte/lib/Light.svelte';
  import Moon from 'carbon-icons-svelte/lib/Moon.svelte';
  import Home from 'carbon-icons-svelte/lib/Home.svelte';
  import HelpFilled from 'carbon-icons-svelte/lib/HelpFilled.svelte';
  import IbmWatsonToneAnalyzer from 'carbon-icons-svelte/lib/IbmWatsonToneAnalyzer.svelte';
  import DirectionStraightRight from 'carbon-icons-svelte/lib/DirectionStraightRight.svelte';

  import { browser } from '$app/environment';
  import { toggleBodyByMode } from '$lib/utils/toggleMode';
  import { isDark } from './store';
  import { Button } from '$lib/components/ui/button';
  import { page } from '$app/stores';
  import { Demo } from 'carbon-icons-svelte';
  import { goto } from '$app/navigation';

  let disableSignup = false;
  let logo = '';
  let orgName = 'evanai';
  let isCoursePage = false;
  let user = {
    isLoggedIn: true
  };
  let open = false;

  function toggleDarkMode() {
    $isDark = !$isDark;
    toggleBodyByMode($isDark);
    if (browser) {
      localStorage.setItem('mode', $isDark ? 'dark' : '');
    }
  }

  function toggleMenu() {
    open = !open;
  }

  const redirect = isCoursePage ? `?redirect=${$page.url.pathname}` : '';
</script>

<div class="flex flex-row-reverse items-start justify-between">
  <div class="lg:hidden flex items-center p-1 z-50">
    {#if user.isLoggedIn}
      <button
        on:click={toggleMenu}
        class="transition flex items-center gap-2 w-fit p-2 bg-gray-900 dark:bg-[#181818] text-sm text-white"
      >
        {#if open}
          <Close size={24} />
          <p class="font-semibold uppercase">close</p>
        {:else}
          <Menu size={24} />
          <p class="font-semibold uppercase">Menu</p>
        {/if}
      </button>
    {/if}
  </div>
  <nav
    class="absolute lg:relative transition py-2 w-full {open
      ? 'translate-x-0 lg:translate-x-0 '
      : '-translate-x-full lg:translate-x-0 '}"
  >
    <!-- desktop nav -->
    <div
      class=" transition relative dark:border-[#363636] rounded py-2 w-52 h-80 bg-gray-900 dark:bg-[#181818] text-sm text-white"
    >
      <div class="flex items-center justify-between gap-2 border-b dark:border-[#363636] px-4 py-2">
        <a href="/" title={`${orgName || 'ClassroomIO'} home`} id="logo">
          <img
            src={logo || '/logo-192.png'}
            alt={`${orgName || 'ClassroomIO'} logo`}
            class="rounded w-8 inline-block mx-auto"
          />
        </a>
        <button on:click={toggleDarkMode}>
          {#if $isDark}
            <Light size={16} />
          {:else}
            <Moon size={16} />
          {/if}
        </button>
      </div>

      {#if !user.isLoggedIn}
        <div class="flex space-x-4">
          <button on:click={() => goto('/login' + redirect)}>login</button>
          {#if !disableSignup}
            <button on:click={() => goto('/signup' + redirect)}>signup</button>
          {/if}
        </div>
      {/if}

      {#if user.isLoggedIn}
        <div class="flex flex-col gap-2 border-b dark:border-[#363636] px-4 py-4 space-y-2">
          <a href="/#" on:click={toggleMenu} class="flex gap-2 items-center">
            <Home />
            <p>Home</p>
          </a>
          <a href="/#course" on:click={toggleMenu} class="flex gap-2 items-center">
            <Demo />
            <p>Courses</p>
          </a>
        </div>
        <div class="flex flex-col gap-2 px-4 py-4 space-y-2 border-b dark:border-[#363636]">
          <a href="/#faq" on:click={toggleMenu} class="flex gap-2 items-center">
            <HelpFilled />
            <p>Faq</p>
          </a>
          <a href="/#testimonial" on:click={toggleMenu} class="flex gap-2 items-center">
            <IbmWatsonToneAnalyzer />
            <p>Testimonial</p>
          </a>
        </div>

        <div class="px-2 py-6">
          <Button
            class="group h-fit py-2 px-2 w-full text-xs flex gap-6 text-white items-center bg-[#0233BD] hover:bg-[#0233BD]"
            on:click={() => {
              goto('/courses');
              toggleMenu();
            }}
          >
            Learn with us
            <DirectionStraightRight
              size={16}
              class="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Button>
        </div>
      {/if}
    </div>
  </nav>
</div>
