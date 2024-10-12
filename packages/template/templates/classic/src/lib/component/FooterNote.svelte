<script>
  import Button from '$lib/components/ui/button/button.svelte';

  export let data;
</script>

{#if data.footerNote.show}
  <section class="flex flex-col items-center justify-between px-6 lg:px-10 py-20 bg-[#CE02CE]">
    <div class="flex items-center justify-center w-full">
      <p class="text-4xl text-white text-center font-bold w-full">
        {data.footerNote.title}
      </p>
    </div>
    <div class="w-full flex items-center justify-center my-5">
      <Button
        class="rounded-sm font-bold text-lg bg-[#FFE8FF] text-[#CE02CE] border hover:scale-95 hover:bg-[#FFE8FF] border-[#FFF9F9]"
        >{data.footerNote.buttonLabel}
      </Button>
    </div>
  </section>
{/if}
