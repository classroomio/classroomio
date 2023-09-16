<script>
  import { goto } from '$app/navigation';
  import ChevronRightIcon from 'carbon-icons-svelte/lib/ChevronRight.svelte';
  import ArrowLeftIcon from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import ArrowUpRightIcon from 'carbon-icons-svelte/lib/ArrowUpRight.svelte';

  import Container from './Container.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import CloseButton from '$lib/components/Buttons/Close/index.svelte';
  import HeaderForm from './HeaderForm.svelte';
  import RequirementForm from './RequirementForm.svelte';
  import DescriptionForm from './DescriptionForm.svelte';
  import PricingForm from './PricingForm.svelte';
  import GoalsForm from './GoalsForm.svelte';
  import ReviewsForm from './ReviewsForm.svelte';
  import InstructorForm from './InstructorForm.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { updateCourse } from '$lib/utils/services/courses';
  import generateSlug from '$lib/utils/functions/generateSlug';
  import ChevronLeftIcon from 'carbon-icons-svelte/lib/ChevronLeft.svelte';

  import { isMobile } from '$lib/utils/store/useMobile';

  export let course;
  export let courseId;

  let borderBottomGrey = 'border-r-0 border-b border-l-0 border-gray-300';
  let loading = false;
  let show = false;
  const sections = [
    {
      key: 1,
      title: 'Header'
    },
    {
      key: 2,
      title: 'Requirement'
    },
    {
      key: 3,
      title: 'Description'
    },
    {
      key: 4,
      title: 'Goals'
    },
    {
      key: 5,
      title: 'Reviews'
    },
    {
      key: 6,
      title: 'Instructor'
    },
    {
      key: 7,
      title: 'Pricing'
    }
  ];
  let selectedSection = null;

  function handleClose() {
    console.log('closing');
    if (!selectedSection) {
      goto(`/courses/${courseId}`);
    }

    selectedSection = null;
  }

  function handleSectionSelect(sectionKey) {
    return () => {
      selectedSection = sections.find((section) => section.key === sectionKey);
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

    await updateCourse(courseId, undefined, {
      ...course,
      attendance: undefined,
      group: undefined,
      lessons: undefined,
      slug: course.slug
    });
    loading = false;

    return `${window.location.origin}/course/${course.slug}`;
  }
  /**
   * 1. Use all you have for editing now
   * 2. Make course one interface we might need to computation
   */
  async function handlePreview() {
    const link = `${window.location.origin}/course/${course.slug}`;
    window.open(link, '_blank');
  }

  async function handlePublish() {
    loading = true;
    await updateCourse(courseId, undefined, {
      is_published: true
    });
    loading = false;
  }
</script>

<aside
  class={`${
    show ? '-translate-x-[100%] fixed z-[9999]' : 'translate-x-0 fixed z-[9999]'
  } left-0 transition w-[280px] min-w-[280px] bg-gray-100 dark:bg-black h-full border border-l-0 border-t-0 border-b-0 border-r-1`}
>
  <div class="toggler rounded-full shadow-lg absolute">
    <IconButton
      value="toggle"
      onClick={() => (show = !show)}
      size={$isMobile ? 'large' : 'small'}
      color="text-black"
      toolTipProps={$isMobile
        ? {}
        : {
            title: 'Toggle editor',
            direction: 'right'
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
            label="Save"
            type="button"
            className="mr-1"
            variant={VARIANTS.OUTLINED}
            onClick={handleSave}
            isLoading={loading}
          />
          <PrimaryButton
            label="Publish"
            type="button"
            onClick={handlePublish}
            isDisabled={loading}
          />
          <IconButton onClick={handlePreview} disabled={loading || !course.slug}>
            <ArrowUpRightIcon size={24} class="carbon-icon dark:text-white" title="Preview" />
          </IconButton>
        </div>
      </div>
      <div class="flex justify-between items-center px-2 w-full mb-2">
        <h3 class="dark:text-white">Page Builder</h3>
      </div>
      {#each sections as section}
        <button
          class="w-full flex items-center justify-between px-2 py-3 border border-b-0 border-gray-300"
          on:click={handleSectionSelect(section.key)}
        >
          <p class="dark:text-white mr-2">{section.title} section</p>
          <ChevronRightIcon size={24} class="carbon-class" />
        </button>
      {/each}
    {:else}
      <!-- Title -->
      <div class="flex items-center {borderBottomGrey} w-full">
        <IconButton onClick={handleClose}>
          <ArrowLeftIcon size={24} class="carbon-icon dark:text-white" title="Go back" />
        </IconButton>
        <h3 class="dark:text-white">{selectedSection.title}</h3>
      </div>

      <div class="title-content p-2 overflow-y-auto">
        {#if selectedSection.key === 1}
          <HeaderForm bind:course />
        {:else if selectedSection.key === 2}
          <RequirementForm bind:course />
        {:else if selectedSection.key === 3}
          <DescriptionForm bind:course />
        {:else if selectedSection.key === 4}
          <GoalsForm bind:course />
        {:else if selectedSection.key === 5}
          <ReviewsForm bind:course />
        {:else if selectedSection.key === 6}
          <InstructorForm bind:course />
        {:else if selectedSection.key === 7}
          <PricingForm bind:course />
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
