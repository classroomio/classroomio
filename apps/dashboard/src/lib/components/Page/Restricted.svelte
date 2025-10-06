<script>
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Locked from 'carbon-icons-svelte/lib/Locked.svelte';

  function handleClick() {
    return goto('https://classroomio.com');
  }
</script>

<div class="root flex w-screen flex-col items-center justify-center">
  <Locked size={32} />
  <div class="flex w-4/5 flex-col items-center justify-center gap-3 lg:w-2/5 dark:text-white">
    <p class="mt-5 text-4xl font-semibold dark:text-white">Restricted Page</p>
    <p class=" mb-5 text-center text-lg text-gray-700 dark:text-white">
      This organization is restricted. In the mean time, you can checkout our features.
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
