<script lang="ts">
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import get from 'lodash/get';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import getCurrencyFormatter from '$lib/utils/functions/getCurrencyFormatter';
  import { isCourseFree } from '$lib/utils/functions/course';
  import { getStudentInviteLink } from '$lib/utils/functions/course';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';
  import PaymentModal from './PaymentModal.svelte';
  import type { Pathway } from '$lib/utils/types';
  import { ROLE } from '$lib/utils/constants/roles';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { t } from '$lib/utils/functions/translations';

  export let className = '';
  export let editMode = false;
  export let pathwayData: Pathway;
  export let startCoursePayment = false;
  export let mobile = false;

  let openModal = false;
  let calculatedCost = 0;
  let discount = 0;
  let formatter: Intl.NumberFormat | undefined;
  let isFree = false;

  function calcDisc(percent: number, cost: number, showDiscount: boolean) {
    if (!percent || !showDiscount) return cost;
    const discountAmount = (percent / 100) * cost;
    const discountedPrice = cost - discountAmount;
    return Math.round(discountedPrice);
  }

  function handleJoinCourse() {
    if (editMode) return;

    capturePosthogEvent('join_course', {
      course_id: pathwayData.id,
      course_title: pathwayData.title,
      course_cost: pathwayData.cost,
      course_free: isFree
    });
    if (isFree) {
      const link = getStudentInviteLink(pathwayData, $currentOrg.siteName, $currentOrgDomain);
      goto(link);
    } else {
      openModal = true;
    }

    startCoursePayment = false;
  }

  function setFormatter(currency: string | undefined) {
    if (!currency) return;
    formatter = getCurrencyFormatter(currency);
  }

  function getTeacherEmail(group: Pathway['group']) {
    const firstTutor = group?.members?.find((m) => m.role_id === ROLE.TUTOR);

    return firstTutor?.profile?.email || '';
  }

  $: setFormatter(pathwayData.currency);

  $: discount = get(pathwayData, 'landingpage.discount', 0);
  $: calculatedCost = calcDisc(
    discount,
    pathwayData.cost || 0,
    !!pathwayData.landingpage.showDiscount
  );
  $: isFree = isCourseFree(calculatedCost);
  $: startCoursePayment && handleJoinCourse();
</script>

<PaymentModal
  bind:open={openModal}
  paymentLink={get(pathwayData, 'landingpage.paymentLink', '')}
  courseName={pathwayData.title}
  teacherEmail={getTeacherEmail(pathwayData.group)}
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
          {#if pathwayData?.landingpage?.allowNewStudent}
            <p class="dark:text-white font-medium text-sm flex items-center gap-1">
              {formatter?.format(calculatedCost) || calculatedCost}
              {#if isFree}
                <span class="text-xs"
                  >({$t('course.navItem.landing_page.pricing_section.free')})</span
                >
              {/if}
            </p>
            {#if pathwayData?.landingpage?.showDiscount}
              <p class="dark:text-white font-light text-sm text-gray-500">
                {discount}% {$t('course.navItem.landing_page.pricing_section.discount')}.
                <span class="line-through"
                  >{formatter?.format(pathwayData?.cost || 0) || pathwayData.cost}</span
                >
              </p>
            {/if}
          {:else}
            <p class="dark:text-white text-lg">
              {$t('course.navItem.landing_page.pricing_section.not_accepting')}
            </p>
          {/if}
        </div>

        <!-- Call To Action Buttons -->
        <div class="flex flex-col w-full h-full items-center">
          <PrimaryButton
            label={isFree
              ? $t('course.navItem.landing_page.pricing_section.enroll')
              : $t('course.navItem.landing_page.pricing_section.buy')}
            className="w-full sm:w-full h-[40px]"
            onClick={handleJoinCourse}
            isDisabled={!pathwayData.landingpage.allowNewStudent}
          />
        </div>
      </div>
    </aside>
  </div>
{:else}
  <aside class="price-container lg:shadow-lg lg:rounded-lg m-h-fit dark:bg-neutral-800 {className}">
    <div class="py-2 lg:py-10">
      <!-- Pricing -->
      <div class="mb-6 px-2 lg:px-10">
        {#if pathwayData?.landingpage?.allowNewStudent}
          <p class="dark:text-white font-semibold text-xl">
            {formatter?.format(calculatedCost) || calculatedCost}
            {#if isFree}
              <span class="text-sm">({$t('course.navItem.landing_page.pricing_section.free')})</span
              >
            {/if}
          </p>
          {#if pathwayData?.landingpage?.showDiscount}
            <p class="dark:text-white font-light text-sm text-gray-500">
              {discount}% {$t('course.navItem.landing_page.pricing_section.discount')}.
              <span class="line-through"
                >{formatter?.format(pathwayData?.cost || 0) || pathwayData.cost}</span
              >
            </p>
          {/if}
        {:else}
          <p class="dark:text-white text-lg">
            {$t('course.navItem.landing_page.pricing_section.not_accepting')}
          </p>
        {/if}
      </div>

      <!-- Call To Action Buttons -->
      <div class="px-2 pb-10 lg:px-10 flex flex-col w-full items-center">
        <PrimaryButton
          label={isFree ? $t('course.navItem.landing_page.pricing_section.enroll') : 'Add to Cart'}
          className="w-full sm:w-full py-3 mb-3 rounded-none"
          onClick={handleJoinCourse}
          isDisabled={!pathwayData.landingpage.allowNewStudent}
        />
        <PrimaryButton
          label={isFree
            ? $t('course.navItem.landing_page.pricing_section.enroll')
            : $t('course.navItem.landing_page.pricing_section.buy')}
          className="w-full sm:w-full py-3 mb-3 rounded-none border-blue-600 hover:border-gray-600"
          variant={VARIANTS.OUTLINED}
          onClick={handleJoinCourse}
          isDisabled={!pathwayData.landingpage.allowNewStudent}
        />
        {#if pathwayData?.landingpage?.showDiscount && pathwayData.landingpage.allowNewStudent}
          <p class="dark:text-white font-light text-xs text-gray-500">
            {$t('course.navItem.landing_page.pricing_section.bird')}
          </p>
        {/if}
      </div>

      <div class="border-t px-2 pt-10 lg:px-10 text-center">
        <img src="/pricingCard-icon.svg" alt="Pricing Card" class="w-[85%] mx-auto" />
        <p class="dark:text-white font-light text-xs my-5 text-gray-500">
          {$t('pathway.pages.landingPage.main.pricing_win')}
        </p>
        <a href="/#" class="text-xs underline text-blue-600 font-semibold">
          {$t('pathway.pages.landingPage.main.start')}
        </a>
      </div>
    </div>

    <!-- Gift Container -->
    {#if pathwayData?.landingpage?.reward?.show}
      <div class="p-10 text-sm flex items-center flex-col border-t border-b border-gray-300">
        {@html get(pathwayData, 'landingpage.reward.description', '')}
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
    width: 100%;
    max-width: 255px;
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
