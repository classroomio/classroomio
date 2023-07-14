<script>
  // export let error;
  // const dev = process.env.NODE_ENV === 'development';
  // let errorContent;
  // function report() {}
  // $: {
  //   try {
  //     errorContent = !!error ? JSON.stringify(error) : '';
  //   } catch (error) {}
  // }

  export let status;
  import { appStore } from '../utils/store/app';
  import ErrorIcon from '../components/Icons/ErrorIcon.svelte';
  import ErrorIconDarkMode from '../components/Icons/ErrorIconDarkMode.svelte';
</script>

<svelte:head>
  <title>{status}</title>
</svelte:head>

<div class="flex lg:flex-row md:flex-col-reverse flex-wrap items-center justify-center h-full py-10 lg:px-6 dark:bg-gray-800">

  <div class="md:w-full p-2 lg:w-2/4">
    <h2 class="w-full text-lg lg:text-3xl font-medium lg:font-normal">Our server is taking a nap😴.</h2>
    <p class="dark:text-white w-full text-base font-normal my-6">Don't worry, your learning is safe. Our server is just taking a quick break to recharge. In the meantime, feel free to export the rest of our website or take a nap yourself.</p>
    <a class="hover:no-underline transition-all py-3 px-9 rounded-xl text-white mt-2" href="mailto:support@classroomio.com">Contact Us</a>
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
  p {
    color: #656565;
  }

  a {
    background: #0233BD;
  }

</style>