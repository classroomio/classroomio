<script lang="ts">
  import get from 'lodash/get';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import getCurrencyFormatter from '$lib/utils/functions/getCurrencyFormatter';
  import { isCourseFree } from '$lib/utils/functions/course';
  import { getStudentInviteLink } from '$lib/utils/functions/course';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import PaymentModal from './PaymentModal.svelte';
  import type { Course } from '$lib/utils/types';
  import { ROLE } from '$lib/utils/constants/roles';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { t } from '$lib/utils/functions/translations';
  import { calcCourseDiscount } from '$lib/utils/functions/course';

  interface Props {
    className?: string;
    editMode?: boolean;
    courseData: Course;
    startCoursePayment?: boolean;
    mobile?: boolean;
  }

  let {
    className = '',
    editMode = false,
    courseData,
    startCoursePayment = $bindable(false),
    mobile = false
  }: Props = $props();

  let openModal = $state(false);
  let formatter: Intl.NumberFormat | undefined = $state();

  const discount = $derived(get(courseData, 'metadata.discount', 0));
  const calculatedCost = $derived(
    calcCourseDiscount(discount, courseData.cost || 0, !!courseData.metadata.showDiscount)
  );
  const isFree = $derived(isCourseFree(calculatedCost));

  function handleJoinCourse() {
    if (editMode) return;

    capturePosthogEvent('join_course', {
      course_id: courseData.id,
      course_title: courseData.title,
      course_cost: courseData.cost,
      course_free: isFree
    });
    if (isFree) {
      const link = getStudentInviteLink(courseData, $currentOrg.siteName, $currentOrgDomain);
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

  function getTeacherEmail(group: Course['group']) {
    const firstTutor = group?.members?.find((m) => m.role_id === ROLE.TUTOR);

    return firstTutor?.profile?.email || '';
  }

  $effect(() => {
    setFormatter(courseData.currency);
  });

  $effect(() => {
    startCoursePayment && handleJoinCourse();
  });
</script>

<PaymentModal
  bind:open={openModal}
  paymentLink={get(courseData, 'metadata.paymentLink', '')}
  courseName={courseData.title}
  teacherEmail={getTeacherEmail(courseData.group)}
/>

<!-- Pricing Details -->
{#if mobile}
  <div
    class="sticky bottom-0 flex h-fit w-full items-center justify-center bg-gray-50 transition duration-300 lg:hidden dark:bg-neutral-800"
  >
    <aside
      class="price-container sticky lg:hidden {editMode
        ? 'lg:bottom-2'
        : 'lg:top-10'} m-h-fit z-0 bg-gray-50 lg:rounded-lg lg:shadow-2xl dark:bg-neutral-800 {className}"
    >
      <div class="flex items-center justify-center gap-3 px-3 py-3">
        <!-- Pricing -->
        <div class=" text-center">
          {#if courseData?.metadata?.allowNewStudent}
            <p class="flex items-center gap-1 text-sm font-medium dark:text-white">
              {formatter?.format(calculatedCost) || calculatedCost}
              {#if isFree}
                <span class="text-xs">
                  ({$t('course.navItem.landing_page.pricing_section.free')})
                </span>
              {/if}
            </p>
            {#if courseData?.metadata?.showDiscount}
              <p class="text-sm font-light text-gray-500 dark:text-white">
                {discount}% {$t('course.navItem.landing_page.pricing_section.discount')}.
                <span class="line-through">
                  {formatter?.format(courseData?.cost || 0) || courseData.cost}
                </span>
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
            isDisabled={!courseData.metadata.allowNewStudent}
          />
        </div>
      </div>
    </aside>
  </div>
{:else}
  <aside
    class="price-container lg:sticky {editMode
      ? 'lg:top-0'
      : 'lg:top-10'} m-h-fit lg:rounded-lg lg:shadow-2xl dark:bg-neutral-800 {className}"
  >
    <div class="p-2 lg:p-10">
      <!-- Pricing -->
      <div class="mb-6">
        {#if courseData?.metadata?.allowNewStudent}
          <p class="text-lg font-medium dark:text-white">
            {formatter?.format(calculatedCost) || calculatedCost}
            {#if isFree}
              <span class="text-sm">
                ({$t('course.navItem.landing_page.pricing_section.free')})
              </span>
            {/if}
          </p>
          {#if courseData?.metadata?.showDiscount}
            <p class="text-sm font-light text-gray-500 dark:text-white">
              {discount}% {$t('course.navItem.landing_page.pricing_section.discount')}.
              <span class="line-through">
                {formatter?.format(courseData?.cost || 0) || courseData.cost}
              </span>
            </p>
          {/if}
        {:else}
          <p class="text-lg dark:text-white">
            {$t('course.navItem.landing_page.pricing_section.not_accepting')}
          </p>
        {/if}
      </div>

      <!-- Call To Action Buttons -->
      <div class="flex w-full flex-col items-center">
        <PrimaryButton
          label={isFree
            ? $t('course.navItem.landing_page.pricing_section.enroll')
            : $t('course.navItem.landing_page.pricing_section.buy')}
          className="w-full sm:w-full py-3 mb-3"
          onClick={handleJoinCourse}
          isDisabled={!courseData.metadata.allowNewStudent}
        />
        {#if courseData?.metadata?.showDiscount && courseData.metadata.allowNewStudent}
          <p class="text-sm font-light text-gray-500 dark:text-white">
            {$t('course.navItem.landing_page.pricing_section.bird')}
          </p>
        {/if}
      </div>
    </div>

    <!-- Gift Container -->
    {#if courseData?.metadata?.reward?.show}
      <div class="flex flex-col items-center border-b border-t border-gray-300 p-10">
        <HtmlRender>{@html get(courseData, 'metadata.reward.description', '')}</HtmlRender>
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
