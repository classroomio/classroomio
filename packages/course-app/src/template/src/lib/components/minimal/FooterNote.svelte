<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/button/button.svelte';

  interface Props {
    data: any;
  }

  let { data }: Props = $props();
</script>

{#if data.footerNote.show}
  <section
    class="flex flex-col md:flex-row items-center justify-between px-6 lg:px-10 py-20 bg-blue-800"
  >
    <div class="flex items-center justify-center w-full">
      <p
        class="text-4xl text-white text-center md:text-start font-bold w-full lg:w-[70%] capitalize"
      >
        {data.footerNote.title}
      </p>
    </div>
    <div class="w-full flex items-center justify-center my-5">
      <Button
        on:click={() => goto('/courses')}
        class="rounded-none uppercase py-2 bg-white text-blue-700 hover:scale-95 hover:bg-white font-bold"
        >{data.footerNote.buttonLabel}</Button
      >
    </div>
  </section>
{/if}
