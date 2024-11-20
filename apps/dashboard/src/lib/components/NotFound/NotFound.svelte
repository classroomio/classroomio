<script>
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';

  export let isOrg = false;

  function handleClick() {
    if (!isOrg) {
      return goto('/');
    }

    return goto('https://classroomio.com');
  }
</script>

<div class="root flex items-center justify-center flex-col w-screen">
  <img src="https://brand.cdn.clsrio.com/404.png" alt="classroomio_error_image" />
  <div class="flex flex-col items-center justify-center dark:text-white gap-3 w-4/5 lg:w-2/5">
    <p class="text-4xl dark:text-white font-semibold mb-5">
      {#if isOrg}
        Organization doesn't exist!
      {:else}
        Page not found
      {/if}
    </p>
    <p class=" text-gray-700 text-lg text-center dark:text-white mb-5">
      The page you are looking for doesn't exist or has been moved. Please go back to the homepage.
    </p>
    <PrimaryButton
      variant={VARIANTS.CONTAINED_DARK}
      label="Go Home"
      className="text-lg"
      onClick={handleClick}
    />
  </div>
</div>

<style>
  .root {
    height: calc(100vh - 45px);
  }
</style>
