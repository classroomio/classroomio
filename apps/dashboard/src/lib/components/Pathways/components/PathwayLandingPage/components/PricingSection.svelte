<script lang="ts">
  import { goto } from '$app/navigation';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { ROLE } from '$lib/utils/constants/roles';
  import { isCourseFree } from '$lib/utils/functions/course';
  import getCurrencyFormatter from '$lib/utils/functions/getCurrencyFormatter';
  import { getStudentInviteLink } from '$lib/utils/functions/pathway';
  import { t } from '$lib/utils/functions/translations';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import type { Pathway } from '$lib/utils/types';
  import get from 'lodash/get';
  import PaymentModal from './PaymentModal.svelte';

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

  $: setFormatter(pathwayData?.currency);

  $: discount = get(pathwayData, 'landingpage.discount', 0);
  $: showDiscount = get(pathwayData, 'landingpage.showDiscount');
  $: calculatedCost = calcDisc(
    discount,
    pathwayData?.cost || 0,
    !!pathwayData?.landingpage.showDiscount
  );
  $: isFree = isCourseFree(calculatedCost);
  $: startCoursePayment && handleJoinCourse();
</script>

<PaymentModal
  bind:open={openModal}
  paymentLink={get(pathwayData, 'landingpage.paymentLink', '')}
  courseName={pathwayData?.title}
  teacherEmail={getTeacherEmail(pathwayData?.group)}
/>

<!-- Pricing Details -->
{#if mobile}
  <div
    class="sticky bottom-0 flex h-fit w-full items-center justify-center bg-gray-50 transition duration-300 dark:bg-neutral-800 lg:hidden"
  >
    <aside
      class="price-container sticky lg:hidden {editMode
        ? 'lg:bottom-2'
        : 'lg:top-10'} m-h-fit z-0 bg-gray-50 dark:bg-neutral-800 lg:rounded-lg lg:shadow-2xl {className}"
    >
      <div class="flex items-center justify-center gap-3 px-3 py-3">
        <!-- Pricing -->
        <div class=" text-center">
          {#if pathwayData?.landingpage?.allowNewStudent}
            <p class="flex items-center gap-1 text-sm font-medium dark:text-white">
              {formatter?.format(calculatedCost) || calculatedCost}
              {#if isFree}
                <span class="text-xs"
                  >({$t('course.navItem.landing_page.pricing_section.free')})</span
                >
              {/if}
            </p>
            {#if pathwayData?.landingpage?.showDiscount}
              <p class="text-sm font-light text-gray-500 dark:text-white">
                {discount}% {$t('course.navItem.landing_page.pricing_section.discount')}.
                <span class="line-through"
                  >{formatter?.format(pathwayData?.cost || 0) || pathwayData.cost}</span
                >
              </p>
            {/if}
          {:else}
            <p class="text-lg dark:text-white">
              {$t('course.navItem.landing_page.pricing_section.not_accepting')}
            </p>
          {/if}
        </div>

        <!-- Call To Action Buttons -->
        <div class="flex h-full w-full flex-col items-center">
          <PrimaryButton
            label={isFree
              ? $t('course.navItem.landing_page.pricing_section.enroll')
              : $t('course.navItem.landing_page.pricing_section.buy')}
            className="w-full sm:w-full h-[40px]"
            onClick={handleJoinCourse}
            isDisabled={!pathwayData?.is_published}
          />
        </div>
      </div>
    </aside>
  </div>
{:else}
  <aside class="price-container m-h-fit dark:bg-neutral-800 lg:rounded-lg lg:shadow-lg {className}">
    <div class="py-2 lg:py-10">
      <!-- Pricing -->
      <div class="mb-6 px-2 lg:px-10">
        {#if pathwayData?.is_published}
          <p class="text-xl font-semibold dark:text-white">
            {formatter?.format(calculatedCost) || calculatedCost}
            {#if isFree}
              <span class="text-sm">({$t('course.navItem.landing_page.pricing_section.free')})</span
              >
            {/if}
          </p>
          {#if pathwayData?.landingpage?.showDiscount}
            <p class="text-sm font-light text-gray-500 dark:text-white">
              {discount}% {$t('course.navItem.landing_page.pricing_section.discount')}.
              <span class="line-through"
                >{formatter?.format(pathwayData?.cost || 0) || pathwayData.cost}</span
              >
            </p>
          {/if}
        {:else}
          <p class="text-lg dark:text-white">
            {$t('course.navItem.landing_page.pricing_section.not_accepting')}
          </p>
        {/if}
      </div>

      <!-- Call To Action Buttons -->
      <div class="flex w-full flex-col items-center px-2 pb-10 lg:px-10">
        <PrimaryButton
          label={isFree
            ? $t('course.navItem.landing_page.pricing_section.enroll')
            : $t('course.navItem.landing_page.editor.pricing_form.cart')}
          className="w-full sm:w-full py-3 mb-3 rounded-none"
          onClick={handleJoinCourse}
          isDisabled={!pathwayData?.is_published}
        />
        <PrimaryButton
          label={isFree
            ? $t('course.navItem.landing_page.pricing_section.enroll')
            : $t('course.navItem.landing_page.pricing_section.buy')}
          className="w-full sm:w-full py-3 mb-3 rounded-none border-blue-600 hover:border-gray-600"
          variant={VARIANTS.OUTLINED}
          onClick={handleJoinCourse}
          isDisabled={!pathwayData?.is_published}
        />
        {#if pathwayData?.landingpage?.showDiscount && pathwayData?.is_published}
          <p class="text-xs font-light text-gray-500 dark:text-white">
            {$t('course.navItem.landing_page.pricing_section.bird')}
          </p>
        {/if}
      </div>

      {#if showDiscount}
        <div class="border-t px-2 pt-10 text-center lg:px-10">
          <img src="/pricingCard-icon.svg" alt="Pricing Card" class="mx-auto w-[85%]" />
          <p class="my-5 text-xs font-light text-gray-500 dark:text-white">
            {$t('pathway.pages.landingPage.main.pricing_win')}
          </p>
          <a href="/#" class="text-xs font-semibold text-blue-600 underline">
            {$t('pathway.pages.landingPage.main.start')}
          </a>
        </div>
      {/if}
    </div>

    <!-- Gift Container -->
    {#if pathwayData?.landingpage?.reward?.show}
      <div class="flex flex-col items-center border-t border-gray-300 px-10 py-5 text-sm">
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
