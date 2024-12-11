<script lang="ts">
  import FaqCard from './FaqCard.svelte';
  import { homePage } from '$lib/utils/stores/pages';
  import { getPageSection } from '$lib/utils/helpers/page';

  /**
   * Constants
   */
  const content = $derived(getPageSection($homePage, 'faq'));
</script>

<!-- FAQ Cards -->
{#if content?.show}
  <div id="faq">
    <h1 class="text-center text-3xl mb-8 font-bold">{content.settings.title}</h1>

    <div class="flex flex-wrap items-center justify-center mx-auto gap-8 p-4">
      {#each content.settings.questions as faq, index}
        <FaqCard {index} {faq} />
      {/each}
    </div>
  </div>
{/if}
