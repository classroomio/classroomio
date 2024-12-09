<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';

  export let onClick = () => {};
  export let label: string;
  export let href: string | undefined = undefined;
</script>

<Button
  {href}
  onclick={onClick}
  class="rounded-none uppercase bg-blue-900 p-3 hover:bg-blue-900 hover:scale-95 font-bold"
  >{label}</Button
>
