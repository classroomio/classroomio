<script lang="ts">
  import Report from './Report.svelte';
  import { openFullscreen } from './store';
</script>

{#if $openFullscreen.open}
  <div class="relative">
    <div class="fixed z-[3000] top-0 left-0 w-full h-full bg-black opacity-[0.4]"></div>
    <div
      class="fixed top-5 left-0 md:top-[5%] md:left-[30%] z-[3001] w-full h-fit md:w-[30%] md:min-w-[500px] bg-white rounded-md mx-auto flex items-center md:block py-6 px-2 md:px-7"
    >
      <!--  -->
      <Report />
      <!--  -->
    </div>
  </div>
{/if}
