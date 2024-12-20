<script lang="ts">
</script>

<div class="relative mx-auto w-fit rounded-lg px-4 shadow-sm sm:px-6 md:px-20">
  <!-- Top Border -->
  <div
    class="absolute left-0 top-4 z-20 hidden h-[0.2px] w-full overflow-hidden bg-zinc-400/20 sm:top-6 md:top-16 md:block"
  ></div>

  <!-- Bottom Border -->
  <div
    class="absolute bottom-4 left-0 z-20 hidden h-[0.2px] w-full bg-zinc-400/20 sm:bottom-6 md:bottom-16 md:block"
  ></div>

  <div class="relative w-fit border-x-0 border-zinc-400/20 md:border-x-[0.2px]">
    <!-- Inner Content -->
    <div class="relative mx-auto w-fit bg-black py-4">
      <slot />
    </div>
  </div>
</div>
