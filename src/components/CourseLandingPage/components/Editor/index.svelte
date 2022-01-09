<script>
  import { goto } from '@sapper/app';
  import ChevronRight24 from 'carbon-icons-svelte/lib/ChevronRight24';
  import ArrowLeft24 from 'carbon-icons-svelte/lib/ArrowLeft24';
  import Container from './Container.svelte';
  import IconButton from '../../../IconButton/index.svelte';
  import CloseButton from '../../../Buttons/Close/index.svelte';
  import HeaderForm from './HeaderForm.svelte';
  import RequirementForm from './RequirementForm.svelte';
  import DescriptionForm from './DescriptionForm.svelte';
  import SyllabusForm from './SyllabusForm.svelte';
  import AboutUsForm from './AboutUsForm.svelte';
  import PrimaryButton from '../../../PrimaryButton/index.svelte';

  export let courseId;

  let borderBottomGrey = 'border-r-0 border-b border-l-0 border-gray-300';

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
      title: 'Syllabus',
    },
    {
      key: 5,
      title: 'About Us',
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

  function handlePublish() {}
</script>

<Container>
  {#if !selectedSection}
    <div
      class="flex justify-between items-center px-2 {borderBottomGrey} w-full"
    >
      <CloseButton onClick={handleClose} />
      <PrimaryButton
        label="Publish"
        onClick={handlePublish}
        disablePadding={true}
      />
    </div>
    <div
      class="flex justify-between items-center px-2 bg-white {borderBottomGrey} w-full mb-2"
    >
      <h3 class="">Page Builder</h3>
    </div>
    {#each sections as section}
      <button
        class="w-full flex items-center justify-between px-2 py-3 bg-white border border-b-0 border-gray-300"
        on:click={handleSectionSelect(section.key)}
      >
        <p class="mr-2">{section.title} section</p>
        <ChevronRight24 class="carbon-class" />
      </button>
    {/each}
  {:else}
    <div class="flex items-center bg-white {borderBottomGrey} w-full">
      <IconButton onClick={handleClose}>
        <ArrowLeft24 class="carbon-icon" title="Go back" />
      </IconButton>
      <h3 class="">{selectedSection.title}</h3>
    </div>

    <div class="p-2">
      {#if selectedSection.key === 1}
        <HeaderForm />
      {:else if selectedSection.key === 2}
        <RequirementForm />
      {:else if selectedSection.key === 3}
        <DescriptionForm />
      {:else if selectedSection.key === 4}
        <SyllabusForm />
      {:else if selectedSection.key === 5}
        <AboutUsForm />
      {/if}
    </div>
  {/if}
</Container>
