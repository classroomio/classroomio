<script>
  import { goto } from '$app/navigation';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
</script>

<div
  class="root flex h-[calc(100vh-48px)] w-screen flex-col items-center justify-center gap-2 bg-[#F3F5F9] text-center text-black dark:bg-black dark:text-white"
>
  <img src="./unauthorized.svg" alt="unauthorized" class="w-[220px]" />
  <p class=" text-4xl font-bold text-black md:text-5xl dark:text-white">Page not found</p>
  <p class=" mb-2 mt-1 text-base font-[400] text-[#656565] dark:text-white">
    The page you are trying to access does not exist
  </p>

  <PrimaryButton label="Go Home" onClick={() => goto('https://www.classroomio.com')} />
  <PrimaryButton
    label="Help"
    variant={VARIANTS.LINK}
    onClick={() => goto('https://help.classroomio.com/')}
  />
</div>

<style>
  .root {
    font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
  }
</style>
