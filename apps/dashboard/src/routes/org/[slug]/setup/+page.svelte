<script>
  import Chip from '$lib/components/Chip/Text.svelte';

  export let data;

  console.log(data);
</script>

<section>
  <div class="flex items-center gap-2">
    <h2>Get started</h2>
    <Chip value="0/6" className="text-[10px] font-semibold px-3 !py-1" shape="rounded-full" />
  </div>
</section>
