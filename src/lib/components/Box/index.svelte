<script>
  export let className = '';
</script>

<div
  class="{className} w-full h-80 flex items-center justify-center flex-col border rounded border-gray-200"
>
  <slot />
</div>
