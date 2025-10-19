<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-right';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import { currentOrgDomain } from '$lib/utils/store/org';

  import { IconButton } from '$lib/components/IconButton';
  import { CloseButton } from '$lib/components/Buttons/Close';
  import HeaderForm from './HeaderForm.svelte';
  import RequirementForm from './RequirementForm.svelte';
  import DescriptionForm from './DescriptionForm.svelte';
  import PricingForm from './PricingForm.svelte';
  import GoalsForm from './GoalsForm.svelte';
  import ReviewsForm from './ReviewsForm.svelte';
  import CertificateForm from './CertificateForm.svelte';
  import InstructorForm from './InstructorForm.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { updateCourse } from '$lib/utils/services/courses';
  import generateSlug from '$lib/utils/functions/generateSlug';

  import { isMobile } from '$lib/utils/store/useMobile';
  // import CustomPromptBtn from '$lib/components/AI/AIButton/CustomPromptBtn.svelte';
  import type { Course } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    course: Course;
    courseId: string;
    syncCourseStore: (course: Course) => void;
  }

  let { course = $bindable(), courseId, syncCourseStore }: Props = $props();

  let borderBottomGrey = 'border-r-0 border-b border-l-0 border-gray-300';
  let loading = $state(false);
  let show = $state(false);

  interface Section {
    key: number;
    path: string;
    title: string;
    enableAIWriter?: boolean;
    initPrompt?: string;
  }

  const sections: Section[] = [
    {
      key: 1,
      path: '',
      title: $t('course.navItem.landing_page.editor.title.header')
    },
    {
      key: 2,
      path: 'metadata.requirements',
      title: $t('course.navItem.landing_page.editor.title.requirement'),
      enableAIWriter: true,
      initPrompt: $t('course.navItem.landing_page.editor.title.requirement')
    },
    {
      key: 3,
      path: 'metadata.description',
      title: $t('course.navItem.landing_page.editor.title.description'),
      enableAIWriter: true,
      initPrompt: 'Please write a detailed course description for this course:'
    },
    {
      key: 4,
      path: 'metadata.goals',
      title: $t('course.navItem.landing_page.editor.title.goals'),
      enableAIWriter: true,
      initPrompt: 'What should a student expect to learn from this course:'
    },
    {
      key: 5,
      path: '',
      title: $t('course.navItem.landing_page.editor.title.certificate')
    },
    {
      key: 6,
      path: '',
      title: $t('course.navItem.landing_page.editor.title.reviews')
    },
    {
      key: 7,
      path: '',
      title: $t('course.navItem.landing_page.editor.title.instructor')
    },
    {
      key: 8,
      path: '',
      title: $t('course.navItem.landing_page.editor.title.pricing')
    }
  ];
  let selectedSection: Section | null = $state(null);

  function handleClose() {
    if (!selectedSection) {
      goto(`/courses/${courseId}`);
    }

    selectedSection = null;
  }

  function handleSectionSelect(sectionKey: number) {
    return () => {
      selectedSection = sections.find((section) => section.key === sectionKey) || null;

      if (selectedSection) {
        const sectionId = selectedSection.title.toLowerCase();

        const sectionEl = document.getElementById(sectionId);
        if (sectionEl) {
          sectionEl.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    };
  }

  async function handleSave() {
    loading = true;
    course.slug = course.slug || generateSlug(course.title);

    console.log('course', course);
    await updateCourse(courseId, undefined, {
      ...course,
      id: courseId,
      attendance: undefined,
      group: undefined,
      lessons: undefined,
      lesson_section: undefined,
      polls: undefined,
      slug: course.slug
    });

    loading = false;
    syncCourseStore(course);
  }

  async function handlePreview() {
    const link = `${$currentOrgDomain}/course/${course.slug}`;
    window.open(link, '_blank');
  }

  function setter(value: any, setterKey: string) {
    if (typeof value === 'undefined') return;

    // Untrack the course change to avoid unnecessary re-renders
    const _course = untrack(() => cloneDeep(course));
    set(_course, setterKey, value);

    course = _course;
  }
</script>

<aside
  class={`${
    show ? 'fixed z-50 -translate-x-full md:absolute' : 'fixed z-50 translate-x-0 md:relative'
  }left-0 border-r z-50 h-full w-[90vw] min-w-[300px] max-w-[350px] border border-b-0 border-l-0 border-t-0 bg-gray-100 transition dark:bg-neutral-800`}
>
  <div class="toggler absolute rounded-full shadow-lg">
    <IconButton
      value="toggle"
      onClick={() => (show = !show)}
      size={$isMobile ? 'large' : 'small'}
      color="text-black"
      toolTipProps={$isMobile
        ? undefined
        : {
            title: 'Toggle editor',
            direction: 'right',
            hotkeys: []
          }}
    >
      {#if show}
        <ChevronRightIcon size={16} />
      {:else}
        <ChevronLeftIcon size={16} />
      {/if}
    </IconButton>
  </div>
  <div class="flex h-full flex-col">
    {#if !selectedSection}
      <div class="flex w-full items-center justify-between px-2">
        <CloseButton onClick={handleClose} />
        <div class="flex items-center">
          <PrimaryButton
            label={$t('course.navItem.landing_page.editor.save')}
            type="button"
            className="mr-1"
            variant={VARIANTS.OUTLINED}
            onClick={handleSave}
            isLoading={loading}
          />
          <IconButton onClick={handlePreview} disabled={loading || !course.slug}>
            <ArrowUpRightIcon size={16} />
          </IconButton>
        </div>
      </div>
      <div class="mb-2 flex w-full items-center justify-between px-2">
        <h3 class="dark:text-white">{$t('course.navItem.landing_page.editor.page_builder')}</h3>
      </div>
      {#each sections as section, index}
        <button
          class="flex w-full items-center justify-between border border-l-0 px-2 py-3 {index + 1 < sections.length &&
            'border-b-0'} border-gray-300"
          onclick={handleSectionSelect(section.key)}
        >
          <p class="mr-2 dark:text-white">
            {section.title}
            {$t('course.navItem.landing_page.editor.section')}
          </p>
          <ChevronRightIcon size={16} />
        </button>
      {/each}
    {:else}
      <!-- Title -->
      <div class="flex items-center {borderBottomGrey} w-full">
        <IconButton onClick={handleClose}>
          <ArrowLeftIcon size={16} />
        </IconButton>
        <div class=" flex items-center">
          <h3 class="dark:text-white">
            {selectedSection.title}
          </h3>
          <!-- {#if selectedSection.enableAIWriter}
            <CustomPromptBtn
              className="w-fit ml-2"
              alignPopover="bottom-left"
              defaultPrompt={`${selectedSection.initPrompt} ${course.title}. Please format in html`}
              isHTML={true}
              handleInsert={(v) => {
                if (!selectedSection) return;
                const _course = cloneDeep(course);
                set(_course, selectedSection.path, v);
                course = _course;
              }}
            />
          {/if} -->
        </div>
      </div>

      <div class="title-content overflow-y-auto p-2">
        {#if selectedSection.key === 1}
          <HeaderForm bind:course />
        {:else if selectedSection.key === 2}
          <RequirementForm bind:course {setter} />
        {:else if selectedSection.key === 3}
          <DescriptionForm bind:course {setter} />
        {:else if selectedSection.key === 4}
          <GoalsForm bind:course {setter} />
        {:else if selectedSection.key === 5}
          <CertificateForm bind:course {setter} />
        {:else if selectedSection.key === 6}
          <ReviewsForm bind:course {setter} />
        {:else if selectedSection.key === 7}
          <InstructorForm bind:course {setter} />
        {:else if selectedSection.key === 8}
          <PricingForm bind:course {setter} />
        {/if}
      </div>
    {/if}
  </div>
</aside>

<style>
  .title-content {
    height: 90%;
  }
  .toggler {
    right: -15px;
    z-index: 10;
    border: 1px solid var(--border-color);
    top: 50px;
    height: fit-content;
    background: var(--border-color);
  }
  @media screen and (max-width: 767px) {
    .toggler {
      right: -25px;
    }
  }
</style>
