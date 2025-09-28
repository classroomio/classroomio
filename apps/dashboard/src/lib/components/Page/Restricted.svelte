<script>
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Locked from 'carbon-icons-svelte/lib/Locked.svelte';

  function handleClick() {
    return goto('https://classroomio.com');
  }
</script>

<div class="root flex items-center justify-center flex-col w-screen">
  <Locked size={32} />
  <div class="flex flex-col items-center justify-center dark:text-white gap-3 w-4/5 lg:w-2/5">
    <p class="text-4xl dark:text-white font-semibold mt-5">Restricted Page</p>
    <p class=" text-gray-700 text-lg text-center dark:text-white mb-5">
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
