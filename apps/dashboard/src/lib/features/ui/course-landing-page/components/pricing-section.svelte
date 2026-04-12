<script lang="ts">
  import get from 'lodash/get';
  import { Button } from '@cio/ui/base/button';
  import getCurrencyFormatter from '$lib/utils/functions/getCurrencyFormatter';
  import { isCourseFree, calcCourseDiscount } from '$lib/utils/functions/course';
  import { currentOrg } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import HTMLRender from '$features/ui/html-render.svelte';
  import PaymentModal from './payment-modal.svelte';
  import type { Course } from '$features/course/utils/types';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { t } from '$lib/utils/functions/translations';
  import { BorderBeam } from '@cio/ui/custom/animation/border-beam';

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
    calcCourseDiscount(discount, courseData.cost || 0, !!courseData.metadata?.showDiscount)
  );
  const isFree = $derived(isCourseFree(calculatedCost));

  async function handleJoinCourse() {
    if (editMode || !$currentOrg.siteName) return;

    capturePosthogEvent('join_course', {
      course_id: courseData.id,
      course_title: courseData.title,
      course_cost: courseData.cost,
      course_free: isFree
    });

    if (isFree) {
      goto(`/course/${courseData.slug}/enroll`);
    } else {
      openModal = true;
    }

    startCoursePayment = false;
  }

  function setFormatter(currency: string | undefined) {
    if (!currency) return;
    formatter = getCurrencyFormatter(currency);
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
  courseId={courseData.id}
/>

<!-- Pricing Details -->
{#if mobile}
  <div
    class="sticky bottom-0 flex h-fit w-full items-center justify-center bg-gray-50 transition duration-300 lg:hidden dark:bg-neutral-800"
  >
    <aside class="sticky z-0 w-[90%] max-w-[405px] bg-gray-50 lg:hidden dark:bg-neutral-800 {className}">
      <div class="flex items-center justify-center gap-3 px-3 py-3">
        <!-- Pricing -->
        <div class="text-center">
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
          <Button onclick={handleJoinCourse} disabled={!courseData.metadata?.allowNewStudent} class="w-full">
            {isFree
              ? $t('course.navItem.landing_page.pricing_section.enroll')
              : $t('course.navItem.landing_page.pricing_section.buy')}
          </Button>
        </div>
      </div>
    </aside>
  </div>
{:else}
  <aside
    class="relative w-[90%] max-w-[405px] overflow-hidden rounded-xl border border-gray-200 shadow-lg lg:sticky lg:w-[350px] lg:min-w-[250px] xl:w-[405px] xl:min-w-[330px] {editMode
      ? 'lg:top-0'
      : 'lg:top-10'} h-fit dark:border-neutral-700 dark:bg-neutral-800 {className}"
  >
    <BorderBeam size={150} duration={12} colorFrom="#3b82f6" colorTo="#8b5cf6" borderWidth={1.5} />

    <div class="p-4 lg:p-10">
      <!-- Pricing -->
      <div class="mb-6">
        {#if courseData?.metadata?.allowNewStudent}
          <p class="text-2xl font-bold dark:text-white">
            {formatter?.format(calculatedCost) || calculatedCost}
            {#if isFree}
              <span class="text-base font-normal">
                ({$t('course.navItem.landing_page.pricing_section.free')})
              </span>
            {/if}
          </p>
          {#if courseData?.metadata?.showDiscount}
            <p class="mt-1 text-sm font-light text-gray-500 dark:text-white">
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
        <Button
          class="mb-3 h-12 w-full text-base font-semibold"
          onclick={handleJoinCourse}
          disabled={!courseData.metadata?.allowNewStudent}
        >
          {isFree
            ? $t('course.navItem.landing_page.pricing_section.enroll')
            : $t('course.navItem.landing_page.pricing_section.buy')}
        </Button>
        {#if courseData?.metadata?.showDiscount && courseData.metadata.allowNewStudent}
          <p class="text-sm font-light text-gray-500 dark:text-white">
            {$t('course.navItem.landing_page.pricing_section.bird')}
          </p>
        {/if}
      </div>
    </div>

    <!-- Gift Container -->
    {#if courseData?.metadata?.reward?.show}
      <div class="flex flex-col items-center border-t border-gray-200 p-10 dark:border-neutral-700">
        <HTMLRender>
          <SafeHtmlContent content={get(courseData, 'metadata.reward.description', '') as string} />
        </HTMLRender>
      </div>
    {/if}
  </aside>
{/if}
