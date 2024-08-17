<script lang="ts">
  import { goto } from '$app/navigation';
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import ChevronRightIcon from 'carbon-icons-svelte/lib/ChevronRight.svelte';
  import ArrowLeftIcon from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import ArrowUpRightIcon from 'carbon-icons-svelte/lib/ArrowUpRight.svelte';
  import ChevronLeftIcon from 'carbon-icons-svelte/lib/ChevronLeft.svelte';
  import { currentOrgDomain } from '$lib/utils/store/org';

  import IconButton from '$lib/components/IconButton/index.svelte';
  import CloseButton from '$lib/components/Buttons/Close/index.svelte';
  import HeaderForm from './HeaderForm.svelte';
  import AboutForm from './AboutForm.svelte';
  import ObjectivesForm from './ObjectivesForm.svelte';
  import PricingForm from './PricingForm.svelte';
  import ReviewsForm from './ReviewsForm.svelte';
  import InstructorForm from './InstructorForm.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import generateSlug from '$lib/utils/functions/generateSlug';

  import { isMobile } from '$lib/utils/store/useMobile';
  import CustomPromptBtn from '$lib/components/AI/AIButton/CustomPromptBtn.svelte';
  import type { Pathway } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';

  export let pathway: Pathway;
  export let pathwayId: string;
  export let syncPathwayStore: (pathway: Pathway) => void;

  let borderBottomGrey = 'border-r-0 border-b border-l-0 border-gray-300';
  let loading = false;
  let show = false;

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
      path: 'metadata.about',
      title: 'About',
      enableAIWriter: true,
      initPrompt: 'Please write a detailed course requirement for this course:'
    },
    {
      key: 3,
      path: 'metadata.objectives',
      title: 'Objectives',
      enableAIWriter: true,
      initPrompt: 'Please write educational objectives for this course:'
    },
    {
      key: 4,
      path: 'metadata.reviews',
      title: $t('course.navItem.landing_page.editor.title.reviews')
    },
    {
      key: 5,
      path: 'metadata.instructor',
      title: $t('course.navItem.landing_page.editor.title.instructor')
    },
    {
      key: 6,
      path: 'metadata.pricing',
      title: $t('course.navItem.landing_page.editor.title.pricing')
    }
  ];
  let selectedSection: Section | null = null;

  function handleClose() {
    if (!selectedSection) {
      goto(`/pathways/${pathwayId}`);
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
    pathway.slug = pathway.slug || generateSlug(pathway.title);

    // await updateCourse(pathwayId, undefined, {
    //   ...pathway,
    //   attendance: undefined,
    //   group: undefined,
    //   lessons: undefined,
    //   polls: undefined,
    //   slug: pathway.slug
    // });

    // loading = false;
    // syncCourseStore(pathway);
  }

  async function handlePreview() {
    const link = `${$currentOrgDomain}/pathway/${pathway.slug}`;
    window.open(link, '_blank');
  }
</script>

<aside
  class={`${
    show ? '-translate-x-[100%] fixed md:absolute z-[50]' : 'translate-x-0 fixed md:relative z-[50]'
  }left-0 z-[50] transition w-[90vw] min-w-[300px] max-w-[350px] bg-gray-100 dark:bg-neutral-800 h-full border border-l-0 border-t-0 border-b-0 border-r-1`}
>
  <div class="toggler rounded-full shadow-lg absolute">
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
  <div class="h-full flex flex-col">
    {#if !selectedSection}
      <div class="flex justify-between items-center px-2 w-full">
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
          <IconButton onClick={handlePreview} disabled={loading || !pathway.slug}>
            <ArrowUpRightIcon size={24} class="carbon-icon dark:text-white" title="Preview" />
          </IconButton>
        </div>
      </div>
      <div class="flex justify-between items-center px-2 w-full mb-2">
        <h3 class="dark:text-white">{$t('course.navItem.landing_page.editor.page_builder')}</h3>
      </div>
      {#each sections as section, index}
        <button
          class="w-full flex items-center justify-between px-2 py-3 border border-l-0 {index + 1 <
            sections.length && 'border-b-0'} border-gray-300"
          on:click={handleSectionSelect(section.key)}
        >
          <p class="dark:text-white mr-2">
            {section.title}
            {$t('course.navItem.landing_page.editor.section')}
          </p>
          <ChevronRightIcon size={24} class="carbon-class" />
        </button>
      {/each}
    {:else}
      <!-- Title -->
      <div class="flex items-center {borderBottomGrey} w-full">
        <IconButton onClick={handleClose}>
          <ArrowLeftIcon size={24} class="carbon-icon dark:text-white" title="Go back" />
        </IconButton>
        <div class=" flex items-center">
          <h3 class="dark:text-white">
            {selectedSection.title}
          </h3>
          {#if selectedSection.enableAIWriter}
            <CustomPromptBtn
              className="w-fit ml-2"
              alignPopover="bottom-left"
              defaultPrompt={`${selectedSection.initPrompt} ${pathway.title}. Please format in html`}
              isHTML={true}
              handleInsert={(v) => {
                if (!selectedSection) return;
                const _course = cloneDeep(pathway);
                set(_course, selectedSection.path, v);
                pathway = _course;
              }}
            />
          {/if}
        </div>
      </div>

      <div class="title-content p-2 overflow-y-auto">
        {#if selectedSection.key === 1}
          <HeaderForm bind:pathway />
        {:else if selectedSection.key === 2}
          <AboutForm bind:value={pathway.metadata.about} />
        {:else if selectedSection.key === 3}
          <ObjectivesForm bind:value={pathway.metadata.objectives} />
        {:else if selectedSection.key === 4}
          <ReviewsForm bind:pathway />
        {:else if selectedSection.key === 5}
          <InstructorForm bind:pathway />
        {:else if selectedSection.key === 6}
          <PricingForm bind:pathway />
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
