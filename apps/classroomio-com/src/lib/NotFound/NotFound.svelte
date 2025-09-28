<script>
  import { goto } from '$app/navigation';

  export let isOrg = false;
  export let className = '';

  function handleClick() {
    if (!isOrg) {
      return goto('/');
    }

    return goto('https://classroomio.com');
  }
</script>

<div class="{className} min-h-[80vh] flex items-center justify-center flex-col w-screen">
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

    <button
      class="text-base rounded-md bg-black transition-all delay-100 hover:shadow-xl hover:scale-95 px-6 py-4 font-semibold text-white lg:px-7 lg:py-3 lg:text-lg"
      on:click={handleClick}
    >
      Go Home
    </button>
  </div>
</div>
