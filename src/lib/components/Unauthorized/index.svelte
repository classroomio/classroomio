<script>
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
</script>

<div
  class="root flex flex-col gap-2 items-center justify-center w-screen h-[calc(100vh-48px)] text-center bg-[#F3F5F9] dark:bg-black text-black dark:text-white"
>
  <img src="./unauthorized.svg" alt="unauthorized" class="w-[220px]" />
  <p class=" text-black dark:text-white text-4xl md:text-5xl font-bold">Page not found</p>
  <p class=" text-[#656565] dark:text-white text-base font-[400] mb-2 mt-1">
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
