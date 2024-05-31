<script>
  export let top = 'top-[20%]';
  export let left = 'left-10 md:left-[30%]';
  export let width = 'w-[80%] md:w-[43%]';
  export let className = '';
</script>

<div class="relative">
  <!-- black background -->
  <div class="fixed z-[3000] top-0 left-0 w-full h-full bg-black opacity-[0.7]"></div>
  <div
    class="fixed {top} {left} z-[3001] {width} {className} bg-white rounded-md mx-auto py-6 px-7"
  >
    <slot />
  </div>
</div>
