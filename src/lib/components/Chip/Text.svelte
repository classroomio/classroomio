<script>
  export let className = '';
  export let value = '';
  export let size = '';
  export let shape = 'rounded-md';
</script>

<p
  class="{className} {size === 'sm' ? 'py-1 px-1' : 'py-2 px-2'} org-avatar {className.includes(
    'bg-'
  )
    ? ''
    : 'bg-gray-200'} {shape} text-center"
>
  {value}
</p>

<style>
  .org-avatar {
    width: fit-content;
  }
</style>
