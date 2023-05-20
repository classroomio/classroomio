<script>
  import { goto } from '@sapper/app';
  import ChevronRight24 from 'carbon-icons-svelte/lib/ChevronRight24';
  import ArrowLeft24 from 'carbon-icons-svelte/lib/ArrowLeft24';
  import ArrowUpRight24 from 'carbon-icons-svelte/lib/ArrowUpRight24';

  import Container from './Container.svelte';
  import IconButton from '../../../IconButton/index.svelte';
  import CloseButton from '../../../Buttons/Close/index.svelte';
  import HeaderForm from './HeaderForm.svelte';
  import RequirementForm from './RequirementForm.svelte';
  import DescriptionForm from './DescriptionForm.svelte';
  import PricingForm from './PricingForm.svelte';
  import GoalsForm from './GoalsForm.svelte';
  import InstructorForm from './InstructorForm.svelte';
  import PrimaryButton from '../../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../../PrimaryButton/constants';
  import { updateCourse } from '../../../../utils/services/courses';
  import generateSlug from '../../../../utils/functions/generateSlug';

  export let course;
  export let courseId;

  let borderBottomGrey = 'border-r-0 border-b border-l-0 border-gray-300';
  let loading = false;

  const sections = [
    {
      key: 1,
      title: 'Header',
    },
    {
      key: 2,
      title: 'Requirement',
    },
    {
      key: 3,
      title: 'Description',
    },
    {
      key: 4,
      title: 'Goals',
    },
    {
      key: 5,
      title: 'Instructor',
    },
    {
      key: 6,
      title: 'Pricing',
    },
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
      slug: course.slug,
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
      is_published: true,
    });
    loading = false;
  }
</script>

<Container show={true}>
  <!-- Publish Header Section -->
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
          <ArrowUpRight24 class="carbon-icon" title="Preview" />
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
        <ChevronRight24 class="carbon-class" />
      </button>
    {/each}
  {:else}
    <!-- Title -->
    <div class="flex items-center {borderBottomGrey} w-full">
      <IconButton onClick={handleClose}>
        <ArrowLeft24 class="carbon-icon" title="Go back" />
      </IconButton>
      <h3 class="dark:text-white">{selectedSection.title}</h3>
    </div>

    <div class="p-2 h-4/5 overflow-y">
      {#if selectedSection.key === 1}
        <HeaderForm bind:course />
      {:else if selectedSection.key === 2}
        <RequirementForm bind:course />
      {:else if selectedSection.key === 3}
        <DescriptionForm bind:course />
      {:else if selectedSection.key === 4}
        <GoalsForm bind:course />
      {:else if selectedSection.key === 5}
        <InstructorForm bind:course />
      {:else if selectedSection.key === 6}
        <PricingForm bind:course />
      {/if}
    </div>
  {/if}
</Container>
