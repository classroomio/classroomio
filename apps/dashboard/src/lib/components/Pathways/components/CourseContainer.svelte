<script lang="ts">
  export let border: boolean = true;
  export let className: string = '';
  export let maxHeight: boolean = true;
</script>

<div
  class="{className} {border && 'border border-[#EAEAEA]'} {maxHeight &&
    'max-h-[73vh]'} max-w-[87%] overflow-y-auto shadow-sm rounded-md w-full mx-auto my-10"
>
  <slot />
</div>
