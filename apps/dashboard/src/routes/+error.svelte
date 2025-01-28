<script>
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ErrorIcon from '$lib/components/Icons/ErrorIcon.svelte';
  import ErrorIconDarkMode from '$lib/components/Icons/ErrorIconDarkMode.svelte';
  import { globalStore } from '$lib/utils/store/app';

  if ($page.status == 404 && browser) {
    goto('/404');
  }
  console.error($page.error?.message);
</script>

<svelte:head>
  <title>{$page.status}</title>
</svelte:head>

<div
  class="error-container m-auto flex h-full flex-col-reverse items-center justify-center py-10 dark:bg-black md:flex-col-reverse lg:flex-row"
>
  <div class="p-2 md:w-full lg:w-2/4">
    <h2 class="w-full text-lg font-medium lg:text-3xl lg:font-normal">
      Something unexpected occured.
    </h2>
    <p class="my-6 w-full text-base font-normal text-gray-600 dark:text-white">
      Don't worry, your learning is safe. It isn't your fault, it is ours. We have gotten the error
      notification and will push a fix ASAP. In the meantime, take a short break and come back a bit
      later.
    </p>
    <a
      class="bg-primary-700 hover:bg-primary-900 mt-3 rounded-xl px-9 py-3 text-white transition-all hover:no-underline"
      href="/">Go Home</a
    >
  </div>

  <div class="flex w-72 items-center justify-center lg:w-2/4">
    <!-- to check if it's in dark mode so as to render the appropriate svg -->
    {#if $globalStore.isDark}
      <ErrorIconDarkMode />
    {:else}
      <ErrorIcon />
    {/if}
  </div>
</div>

<style>
  .error-container {
    max-width: 964px;
  }
</style>
