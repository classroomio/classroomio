<script lang="ts">
  import FaqCard from './FaqCard.svelte';

  interface Props {
    data: any;
  }

  let { data }: Props = $props();
</script>

<!-- FAQ Cards -->
{#if data.faq.show}
  <div id="faq">
    <h1 class="text-center text-3xl mb-8 font-bold">{data.faq.title}</h1>

    <div class="grid place-items-center grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {#each data.faq.questions as faq, index}
        <FaqCard {index} {faq} />
      {/each}
    </div>
  </div>
{/if}
