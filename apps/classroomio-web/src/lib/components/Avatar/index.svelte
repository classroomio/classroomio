<script>
  export let name = '';
  export let src = '';
  export let className = '';
  export let shape = 'rounded-full';
  export let width = 'w-10';
  export let height = 'h-10';
</script>

<img alt={name} {src} class="{className} {width} {height} {shape}" />
