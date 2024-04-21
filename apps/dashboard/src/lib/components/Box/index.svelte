<script>
  export let className = '';
</script>

<div
  class="{className} w-full max-w-[500px] mx-auto h-[350px] flex items-center justify-center flex-col border rounded border-gray-200 dark:border-neutral-600"
>
  <slot />
</div>
