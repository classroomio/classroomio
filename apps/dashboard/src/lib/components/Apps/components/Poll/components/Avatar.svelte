<script>
  export let name;
  export let src;
  export let className;
</script>

<img alt={name} {src} class="w-10 max-h-10 rounded-full bg-primary-100 {className}" />
