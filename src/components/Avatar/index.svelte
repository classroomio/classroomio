<script>
  export let name = '';
  export let src = '';
  export let className = '';
</script>

<img
  alt={name}
  {src}
  class="w-10 h-10 rounded-full bg-light-blue-100 {className}"
/>
