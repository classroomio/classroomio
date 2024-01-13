<script lang="ts">
  export let className = '';
  export let value: string | number = '';
  export let size = '';
  export let shape = 'rounded-md';
</script>

<p
  class="{className} {size === 'sm' ? 'py-1 px-1' : 'py-1 px-3'} w-fit {className.includes('bg-')
    ? ''
    : 'bg-gray-200 dark:text-black'} {shape} text-center"
>
  {value}
</p>
