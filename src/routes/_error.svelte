<script>
  import { goto } from '@sapper/app';
  import { appStore } from '../utils/store/app';
  import ErrorIcon from '../components/Icons/ErrorIcon.svelte';
  import ErrorIconDarkMode from '../components/Icons/ErrorIconDarkMode.svelte';

  export let status;
  export let error;

  if (status == 404) {
    goto('/404');
  }
  console.error(error);
</script>

<svelte:head>
  <title>{status}</title>
</svelte:head>

<div
  class="flex lg:flex-row md:flex-col-reverse flex-wrap items-center justify-center h-full py-10 lg:px-6 dark:bg-gray-800"
>
  <div class="md:w-full p-2 lg:w-2/4">
    <h2 class="w-full text-lg lg:text-3xl font-medium lg:font-normal">
      Something unexpected occured.
    </h2>
    <p class="dark:text-white w-full text-base font-normal my-6 text-gray-500">
      Don't worry, your learning is safe. Our server is just taking a quick
      break to recharge. In the meantime, feel free to export the rest of our
      website or take a nap yourself.
    </p>
    <a
      class="bg-blue-700 hover:bg-blue-900 hover:no-underline transition-all py-3 px-9 rounded-xl text-white mt-3"
      href="mailto:support@classroomio.com">Contact Us</a
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
