<script>
  import { fly } from 'svelte/transition';

  const quiz = {};
</script>

<div
  class="root absolute inset-0 flex justify-center items-center z-50 bg-white"
  in:fly={{ y: 500, duration: 500 }}
  out:fly={{ y: 500, duration: 500 }}
>
  <div>something</div>
</div>
