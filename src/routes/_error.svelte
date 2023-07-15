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
  class="error-container m-auto flex flex-col-reverse lg:flex-row md:flex-col-reverse items-center justify-center h-full py-10 dark:bg-gray-800"
>
  <div class="md:w-full p-2 lg:w-2/4">
    <h2 class="w-full text-lg lg:text-3xl font-medium lg:font-normal">
      Something unexpected occured.
    </h2>
    <p class="dark:text-white w-full text-base font-normal my-6 text-gray-600">
      Don't worry, your learning is safe. It isn't your fault, it is ours. We
      have gotten the error notification and will push a fix ASAP. In the
      meantime, take a short break and come back a bit later.
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

<style>
  .error-container {
    max-width: 964px;
  }
</style>
