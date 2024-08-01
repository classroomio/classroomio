<script>
  import { createEventDispatcher } from 'svelte';

  let isOn = false;
  const dispatch = createEventDispatcher();

  function toggle() {
    isOn = !isOn;
    dispatch('toggle', { isOn });
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="toggle {isOn ? 'on' : ''} " on:click={toggle}>
  <div class="toggle-circle {isOn ? 'on' : ''}"></div>
</div>

<style>
  .toggle {
    @apply w-12 h-5 bg-gray-300 rounded-full relative cursor-pointer;
  }
  .toggle.on {
    @apply bg-green-400;
  }
  .toggle-circle {
    @apply w-[14px] h-[14px] bg-white rounded-full absolute left-0.5 top-[3.2px] transition-transform transform;
  }
  .toggle-circle.on {
    @apply translate-x-[1.8rem];
  }
</style>
