<script>
  import { goto } from '$app/navigation';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  export let isOrg = false;

  function handleClick() {
    if (!isOrg) {
      return goto('/');
    }

    return goto('https://classroomio.com');
  }
</script>

<div class="root flex w-screen flex-col items-center justify-center">
  <img src="https://brand.cdn.clsrio.com/404.png" alt="classroomio_error_image" />
  <div class="flex w-4/5 flex-col items-center justify-center gap-3 dark:text-white lg:w-2/5">
    <p class="mb-5 text-4xl font-semibold dark:text-white">
      {#if isOrg}
        Organization doesn't exist!
      {:else}
        Page not found
      {/if}
    </p>
    <p class=" mb-5 text-center text-lg text-gray-700 dark:text-white">
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
