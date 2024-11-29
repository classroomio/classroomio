<script>
  export let className = '';
  export let open = false;
</script>

{#if open}
  <div class="relative flex items-center justify-center">
    <!-- black background -->
    <div class="fixed z-[3000] top-0 left-0 w-full h-full bg-black opacity-[0.7]"></div>
    <div
      class="fixed z-[3001] {className} w-full md:w-[30%] md:min-w-[500px] bg-white dark:bg-gray-900 rounded-md mx-auto py-6 px-7"
    >
      <slot />
    </div>
  </div>
{/if}
