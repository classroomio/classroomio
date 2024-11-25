<script lang="ts">
  import { Button } from '$lib/components/ui/button';

  export let onClick = () => {};
  export let label: string;
  export let href: string;
</script>

<Button
  {href}
  class="uppercase rounded-2xl py-6 bg-white hover:bg-white hover:text-black border-[1.5px] border-[#141414] text-[#141414] shadow-[0px_3px_#141414]"
  onclick={onClick}
>
  {label}
</Button>
