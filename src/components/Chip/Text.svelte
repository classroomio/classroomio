<script>
  export let className;
  export let value;
  export let size;
</script>

<p
  class="{className} {size === 'sm'
    ? 'py-1 px-1'
    : 'py-2 px-2'} org-avatar bg-blue-200 font-bold rounded-md text-center"
>
  {value}
</p>

<style>
  .org-avatar {
    width: fit-content;
  }
</style>
