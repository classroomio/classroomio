<script lang="ts">
  import { FAQ_ITEMS } from '$lib/data/homepage-data';

  let openIndex = $state(
    Math.max(
      0,
      FAQ_ITEMS.findIndex((item) => item.open)
    )
  );

  function toggleItem(index: number, event: MouseEvent) {
    event.preventDefault();
    openIndex = openIndex === index ? -1 : index;
  }
</script>

<section class="cu-faq-sec" id="faq" aria-labelledby="faq-title">
  <div class="cu-wrap">
    <h2 class="cu-h2" id="faq-title" data-split>Frequently asked questions</h2>
    <p class="cu-lead" data-in>Got questions? Here is everything you need to know about getting started.</p>
    <div class="cu-faq" data-in>
      {#each FAQ_ITEMS as item, index}
        <details open={openIndex === index}>
          <summary onclick={(event) => toggleItem(index, event)}>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      {/each}
    </div>
  </div>
</section>
