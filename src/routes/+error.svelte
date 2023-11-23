<script>
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { appStore } from '$lib/utils/store/app';
  import ErrorIcon from '$lib/components/Icons/ErrorIcon.svelte';
  import ErrorIconDarkMode from '$lib/components/Icons/ErrorIconDarkMode.svelte';

  if ($page.status == 404 && browser) {
    goto('/404');
  }
  console.error($page.error?.message);
</script>

<svelte:head>
  <title>{$page.status}</title>
</svelte:head>

<div
  class="error-container m-auto flex flex-col-reverse lg:flex-row md:flex-col-reverse items-center justify-center h-full py-10 dark:bg-black"
>
  <div class="md:w-full p-2 lg:w-2/4">
    <h2 class="w-full text-lg lg:text-3xl font-medium lg:font-normal">
      Something unexpected occured.
    </h2>
    <p class="dark:text-white w-full text-base font-normal my-6 text-gray-600">
      Don't worry, your learning is safe. It isn't your fault, it is ours. We have gotten the error
      notification and will push a fix ASAP. In the meantime, take a short break and come back a bit
      later.
    </p>
    <a
      class="bg-primary-700 hover:bg-primary-900 hover:no-underline transition-all py-3 px-9 rounded-xl text-white mt-3"
      href="/">Go Home</a
    >
  </div>

  <div class="w-72 lg:w-2/4 flex items-center justify-center">
    <!-- to check if it's in dark mode so as to render the appropriate svg -->
    {#if $appStore.isDark}
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
