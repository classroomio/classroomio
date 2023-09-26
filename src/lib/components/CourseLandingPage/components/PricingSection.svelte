<script lang="ts">
  import get from 'lodash/get';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import getCurrencyFormatter from '$lib/utils/functions/getCurrencyFormatter';
  import { isCourseFree } from '$lib/utils/functions/course';
  import { getStudentInviteLink } from '$lib/utils/functions/course';
  import { currentOrg } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';
  import PaymentModal from './PaymentModal.svelte';
  import type { Course } from '$lib/utils/types';
  import { ROLE } from '$lib/utils/constants/roles';

  export let className = '';
  export let editMode = false;
  export let courseData: Course;
  export let startCoursePayment = false;
  export let mobile = false;

  let calculatedCost = 0;
  let discount = 0;
  let formatter: Intl.NumberFormat | undefined;
  let isFree = false;

  function calcDisc(percent: number, cost: number) {
    if (!percent) return cost;
    const discountAmount = (percent / 100) * cost;
    const discountedPrice = cost - discountAmount;
    return Math.round(discountedPrice);
  }

  function handleJoinCourse() {
    if (editMode) return;

    if (isFree) {
      const link = getStudentInviteLink(courseData, $currentOrg.siteName);
      goto(link);
    } else {
      startCoursePayment = true;
    }
  }

  function setFormatter(currency: string | undefined) {
    if (!currency) return;
    formatter = getCurrencyFormatter(currency);
  }

  function getTeacherEmail(group: Course['group']) {
    const firstTutor = group?.members?.find((m) => m.role_id === ROLE.TUTOR);

    return firstTutor?.profile?.email || '';
  }

  $: setFormatter(courseData.currency);
  $: discount = get(courseData, 'metadata.discount', 0);
  $: calculatedCost = calcDisc(discount, courseData.cost || 0);
  $: isFree = isCourseFree(calculatedCost);
</script>

<PaymentModal
  bind:open={startCoursePayment}
  paymentLink={get(courseData, 'metadata.paymentLink', '')}
  courseName={courseData.title}
  teacherEmail={getTeacherEmail(courseData.group)}
/>

<!-- Pricing Details -->
{#if mobile}
  <div
    class="sticky w-full flex items-center justify-center transition duration-300 h-fit bottom-0 lg:hidden bg-gray-50 dark:bg-neutral-800"
  >
    <aside
      class="price-container sticky lg:hidden {editMode
        ? 'lg:bottom-2'
        : 'lg:top-10'} lg:shadow-2xl lg:rounded-lg m-h-fit bg-gray-50 dark:bg-neutral-800 z-0 {className}"
    >
      <div class="flex items-center justify-center gap-3 px-3 py-3">
        <!-- Pricing -->
        <div class=" text-center">
          <p class="dark:text-white font-medium text-sm flex items-center gap-1">
            {formatter?.format(calculatedCost) || calculatedCost}
            {#if isFree}
              <span class="text-xs">(Free)</span>
            {/if}
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
        <div class="flex flex-col w-full h-full items-center">
          <PrimaryButton
            label={isFree ? 'Join Course' : 'Buy Now'}
            className="w-full sm:w-full h-[40px]"
            onClick={handleJoinCourse}
          />
        </div>
      </div>
    </aside>
  </div>
{:else}
  <aside
    class="price-container lg:sticky {editMode
      ? 'lg:top-0'
      : 'lg:top-10'} lg:shadow-2xl lg:rounded-lg m-h-fit dark:bg-neutral-800 {className}"
  >
    <div class="p-2 lg:p-10">
      <!-- Pricing -->
      <div class="mb-6">
        <p class="dark:text-white font-medium text-lg">
          {formatter?.format(calculatedCost) || calculatedCost}
          {#if isFree}
            <span class="text-sm">(Free)</span>
          {/if}
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
          label={isFree ? 'Join Course' : 'Buy Now'}
          className="w-full sm:w-full py-3 mb-3"
          onClick={handleJoinCourse}
        />
        <p class="dark:text-white font-light text-sm text-gray-500">Early bird offer. Buy ASAP</p>
      </div>
    </div>

    <!-- Gift Container -->
    {#if courseData?.metadata?.reward?.show}
      <div class="p-10 flex items-center flex-col border-t border-b border-gray-300">
        {@html get(courseData, 'metadata.reward.description', '')}
      </div>
    {/if}
  </aside>
{/if}

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
    width: 90%;
    max-width: 405px;
    height: fit-content;
  }

  @media screen and (min-width: 768px) {
    .price-container {
      width: 50%;
      height: fit-content;
    }
  }
  @media screen and (min-width: 1024px) {
    .price-container {
      width: 350px;
      min-width: 250px;
    }
  }
  @media screen and (min-width: 1280px) {
    .price-container {
      width: 405px;
      min-width: 330px;
      height: fit-content;
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
