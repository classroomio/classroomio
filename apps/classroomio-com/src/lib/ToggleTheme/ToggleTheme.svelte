<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import Screen from 'carbon-icons-svelte/lib/Screen.svelte';
  import Light from 'carbon-icons-svelte/lib/Light.svelte';
  import AsleepFilled from 'carbon-icons-svelte/lib/AsleepFilled.svelte';
  import ChevronDown from 'carbon-icons-svelte/lib/ChevronDown.svelte';

  const theme = writable('system');
  let isOpen = false;

  function updateTheme(value: string) {
    theme.set(value);
    isOpen = false;
  }

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  $: if (typeof window !== 'undefined') {
    if ($theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if ($theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  onMount(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if ($theme === 'system') {
        if (mediaQuery.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  });
</script>

<div class="relative inline-block text-left">
  <button
    type="button"
    class="inline-flex justify-between items-center w-[110px] px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
    on:click={toggleDropdown}
  >
    <span class="flex items-center">
      {#if $theme === 'light'}
        <Light size={16} />
      {:else if $theme === 'dark'}
        <AsleepFilled size={16} />
      {:else}
        <Screen size={16} />
      {/if}
      <span class="ml-2 capitalize">{$theme}</span>
    </span>
    <ChevronDown size={16} />
  </button>

  {#if isOpen}
    <div
      class="origin-top-right absolute right-0 mt-2 w-[110px] rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="options-menu"
    >
      <div class="py-1" role="none">
        {#each ['system', 'light', 'dark'] as option}
          <button
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
            role="menuitem"
            on:click={() => updateTheme(option)}
          >
            {#if option === 'light'}
              <Light size={16} />
            {:else if option === 'dark'}
              <AsleepFilled size={16} />
            {:else}
              <Screen size={16} />
            {/if}
            <span class="ml-2 capitalize">{option}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
