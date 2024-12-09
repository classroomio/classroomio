<script lang="ts">
  import { Button } from '$lib/components/ui/button';

  export let onClick = () => {};
  export let label: string;
  export let href: string | undefined = undefined;
  export let className: string;
</script>

<Button
  {href}
  class="px-8 transition bg-white capitalize font-bold text-black ring-1 ring-[#B17816] dark:bg-[#EB9D2A] hover:scale-95 hover:bg-[#EB9D2A] shadow-[0px_3px_#B17816] mb-4 {className}"
  onclick={onClick}
>
  {label}
</Button>
