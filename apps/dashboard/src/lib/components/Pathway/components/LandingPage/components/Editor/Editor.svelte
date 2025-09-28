<script lang="ts">
  import { goto } from '$app/navigation';
  import { currentOrgDomain } from '$lib/utils/store/org';
  import ArrowLeftIcon from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import ArrowUpRightIcon from 'carbon-icons-svelte/lib/ArrowUpRight.svelte';
  import ChevronLeftIcon from 'carbon-icons-svelte/lib/ChevronLeft.svelte';
  import ChevronRightIcon from 'carbon-icons-svelte/lib/ChevronRight.svelte';
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';

  import CloseButton from '$lib/components/Buttons/Close/index.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import generateSlug from '$lib/utils/functions/generateSlug';
  import AboutForm from './AboutForm.svelte';
  import HeaderForm from './HeaderForm.svelte';
  import InstructorForm from './InstructorForm.svelte';
  import ObjectivesForm from './ObjectivesForm.svelte';
  import PricingForm from './PricingForm.svelte';
  import ReviewsForm from './ReviewsForm.svelte';

  import CustomPromptBtn from '$lib/components/AI/AIButton/CustomPromptBtn.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { updatePathway } from '$lib/utils/services/pathways';
  import { isMobile } from '$lib/utils/store/useMobile';
  import type { Pathway } from '$lib/utils/types';

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

  let sections: Section[] = [];
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

    await updatePathway(pathwayId, undefined, {
      ...pathway,
      group: undefined,
      pathway_course: undefined,
      slug: pathway.slug
    });

    loading = false;
    syncPathwayStore(pathway);
  }

  async function handlePreview() {
    const link = `${$currentOrgDomain}/pathway/${pathway.slug}`;
    window.open(link, '_blank');
  }

  function getSections(p: Pathway) {
    const title = p.title;
    const courseTitles = p.pathway_course.map((pc) => pc.course.title);

    const getTemplate = (field: string) =>
      `Please write a detailed learning pathway ${field} that is titled: ${title}. This pathway comprises ${
        courseTitles.length
      } courses which are ${courseTitles.join(
        ', '
      )}. Please format in html without using any header elements. Use only bold for formatting titles`;

    return [
      {
        key: 1,
        path: '',
        title: $t('course.navItem.landing_page.editor.title.header')
      },
      {
        key: 2,
        path: 'landingpage.about',
        title: $t('course.navItem.landing_page.editor.title.about'),
        enableAIWriter: true,
        initPrompt: getTemplate('description')
      },
      {
        key: 3,
        path: 'landingpage.objectives',
        title: $t('course.navItem.landing_page.editor.title.objectives'),
        enableAIWriter: true,
        initPrompt: getTemplate('goals')
      },
      {
        key: 4,
        path: 'landingpage.reviews',
        title: $t('course.navItem.landing_page.editor.title.reviews')
      },
      {
        key: 5,
        path: 'landingpage.instructor',
        title: $t('course.navItem.landing_page.editor.title.instructor')
      },
      {
        key: 6,
        path: 'landingpage.pricing',
        title: $t('course.navItem.landing_page.editor.title.pricing')
      }
    ];
  }
  $: sections = getSections(pathway);
</script>

<aside
  class={`${
    show ? 'fixed z-[50] -translate-x-[100%] md:absolute' : 'fixed z-[50] translate-x-0 md:relative'
  } border-r-1 left-0 z-[50] h-full w-[90vw] min-w-[300px] max-w-[350px] border border-b-0 border-l-0 border-t-0 bg-gray-100 transition dark:bg-neutral-800`}
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
          <IconButton onClick={handlePreview} disabled={loading || !pathway.slug}>
            <ArrowUpRightIcon size={24} class="carbon-icon dark:text-white" title="Preview" />
          </IconButton>
        </div>
      </div>
      <div class="mb-2 flex w-full items-center justify-between px-2">
        <h3 class="dark:text-white">{$t('course.navItem.landing_page.editor.page_builder')}</h3>
      </div>
      {#each sections as section, index}
        <button
          class="flex w-full items-center justify-between border border-l-0 px-2 py-3 {index + 1 <
            sections.length && 'border-b-0'} border-gray-300"
          on:click={handleSectionSelect(section.key)}
        >
          <p class="mr-2 dark:text-white">
            {section.title}
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
              defaultPrompt={selectedSection.initPrompt}
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

      <div class="title-content overflow-y-auto p-2">
        {#if selectedSection.key === 1}
          <HeaderForm bind:pathway />
        {:else if selectedSection.key === 2}
          <AboutForm bind:value={pathway.landingpage.about} />
        {:else if selectedSection.key === 3}
          <ObjectivesForm bind:value={pathway.landingpage.objectives} />
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
