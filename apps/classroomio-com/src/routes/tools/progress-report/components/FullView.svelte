<script lang="ts">
  import Report from './Report.svelte';
  import { OpenFullscreen } from './store';
</script>

{#if $OpenFullscreen.open}
  <div class="relative">
    <div class="fixed z-[3000] top-0 left-0 w-full h-full bg-black opacity-[0.9]"></div>
    <div
      class="fixed top-[20%] left-[35%] z-[3001] md:w-[30%] bg-white rounded-md mx-auto py-6 px-7"
    >
      <!--  -->
      <Report />
      <!--  -->
    </div>
  </div>
{/if}
