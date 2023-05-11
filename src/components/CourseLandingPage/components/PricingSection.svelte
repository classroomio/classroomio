<script lang="ts">
  import PrimaryButton from '../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../PrimaryButton/constants';
  import type { Course } from '../../../utils/types';
  import getCurrencyFormatter from '../../../utils/functions/getCurrencyFormatter';
  import get from 'lodash/get';

  export let className = '';
  export let courseData: Course = {
    id: '',
    title: '',
    description: '',
  };

  let calculatedCost = 0;
  let discount = 0;
  let formatter: Intl.NumberFormat | undefined;

  function calcDisc(percent: number, cost: number) {
    if (!percent) return cost;
    return Math.round((percent / 100) * cost) || cost;
  }

  function addToCart() {}

  function buyNow() {}

  function setFormatter(currency: string | undefined) {
    if (!currency) return;
    formatter = getCurrencyFormatter(currency);
  }

  $: setFormatter(courseData.currency);
  $: discount = get(courseData, 'metadata.discount', 0);
  $: calculatedCost = calcDisc(discount, courseData.cost || 0);
</script>

<!-- Pricing Details -->
<aside
  class="{className} price-container md:sticky md:top-0 md:shadow-2xl md:rounded-lg m-h-fit"
>
  <div class="p-10">
    <!-- Pricing -->
    <div class="mb-6">
      <p class="dark:text-white font-medium text-lg">
        {formatter?.format(calculatedCost) || calculatedCost}
      </p>
      {#if courseData?.metadata?.showDiscount}
        <p class="dark:text-white font-light text-sm text-gray-500">
          {discount}% Discount.
          <span class="line-through"
            >{formatter?.format(courseData?.cost || 0) || courseData.cost}</span
          >
        </p>
      {/if}
    </div>

    <!-- Call To Action Buttons -->
    <div class="flex flex-col w-full items-center">
      <PrimaryButton
        label="Add to Cart"
        className="w-full sm:w-full py-3 mb-3"
        onClick={addToCart}
      />
      <PrimaryButton
        label="Buy Now"
        className="w-full sm:w-full py-3 mb-3"
        variant={VARIANTS.OUTLINED}
        onClick={addToCart}
      />
      <p class="dark:text-white font-light text-sm text-gray-500">
        Early bird offer. Buy ASAP
      </p>
    </div>
  </div>

  <!-- Gift Container -->
  {#if courseData?.metadata?.reward?.show}
    <div
      class="p-10 flex items-center flex-col border-t border-b border-gray-300"
    >
      {@html get(courseData, 'metadata.reward.description', '')}
    </div>
  {/if}
</aside>

<style lang="scss">
  .banner {
    background-color: #040f2d;
    min-height: 472px;
  }

  .author {
    color: #7888b7;
  }

  .banner-image {
    max-width: 559px;
  }

  .backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }

  .active {
    position: relative;
    display: inline-block;
  }

  .active::after {
    position: absolute;
    content: '';
    width: 100%;
    height: 3px;
    background-color: var(--main-primary-color);
    display: block;
    bottom: -14px;
    left: 0px;
  }

  .price-container {
    width: 405px;
    min-width: 330px;
    height: fit-content;
  }

  @media (max-width: 768px) {
    .price-container {
      width: 100%;
      min-width: unset;
    }
  }

  .course-content {
    max-width: 608px;
  }

  :global(.list ul li) {
    margin-left: 1rem;
    list-style-type: disc;
  }

  :global(.plyr) {
    width: 100% !important;
  }
</style>
