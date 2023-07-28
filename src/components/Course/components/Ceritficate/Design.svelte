<script>
  import {
    RadioButtonGroup,
    RadioButton,
    Toggle,
  } from 'carbon-components-svelte';
  import { goto } from '@sapper/app';
  import { updateCourse } from '../../../../utils/services/courses';
  import PrimaryButton from '../../../PrimaryButton/index.svelte';
  import TextArea from '../../../Form/TextArea.svelte';
  import Professional from './certificates/Professional.svelte';
  import Plain from './certificates/Plain.svelte';
  import { course } from '../../store';
  import { currentOrg } from '../../../../utils/store/org';

  const studentNamePlaceholder = 'Name of student';
  const themes = ['professional', 'plain'];

  let isSaving = false;
  let Saved = false;
  let errors = {};

  const saveCertificate = async () => {
    isSaving = true;
    if (!$course.description) {
      errors.description = 'Description cannot be empty';
      isSaving = false;
      return;
    }
    await updateCourse($course.id, undefined, {
      description: $course.description,
      is_certificate_downloadable: $course.is_certificate_downloadable,
      certificate_theme: $course.certificate_theme,
    });
    Saved = true;
    isSaving = false;
  };
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Qwitcher+Grypen&family=Roboto:wght@300;400;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<main class="md:-ml-4 md:-mr-4 px-2">
  <div
    class="flex-1 flex flex-col md:flex-row justify-between gap-3 w-full mb-3 h-4/5"
  >
    <section class="w-full md:w-2/5 h-full">
      <strong class="my-2 text-base font-semibold text-black"
        >Certificate settings</strong
      >
      <p class="text-xs font-normal my-4">Choose a theme</p>
      <RadioButtonGroup bind:selected={$course.certificate_theme} class="mb-10">
        {#each themes as theme}
          <div class="flex mr-3">
            <RadioButton value={theme} size="sm" />
            <img src={`./${theme}.svg`} alt="themes" />
          </div>
        {/each}
      </RadioButtonGroup>
      <div>
        <p class="text-xs font-normal text-black my-2">Brand Logo</p>
        <div>
          <p class="text-base mt-1">
            To update your brand image, go to <strong class="font-semibold"
              >Settings &gt; Organisation settings</strong
            > and upload you brand logo
          </p>
          <PrimaryButton
            label="Go to Settings"
            className="rounded-md mt-3"
            onClick={() => goto(`org/${$currentOrg.siteName}/settings`)}
          />
        </div>
        <span class="my-4">
          <p class="text-xs font-normal mt-4 mb-2">Course Description</p>
          <TextArea
            maxRows={6}
            rows={6}
            placeholder="a little description about the course"
            bgColor="bg-gray-100"
            bind:value={$course.description}
            errorMessage={errors.description}
          />
        </span>
        <Toggle
          labelText="Allow students download certificate"
          bind:toggled={$course.is_certificate_downloadable}
          class="my-4"
          size="sm"
        >
          <span slot="labelA" style="color: #161616">Locked</span>
          <span slot="labelB" style="color: green">Unlocked</span>
        </Toggle>
      </div>
    </section>
    <section
      class="certificate-bg flex justify-center items-center rounded-md w-full md:w-3/5"
    >
      <div class="certificate-container flex justify-center items-center h-5/6">
        {#if $course.certificate_theme === 'professional'}
          <Professional studentName={studentNamePlaceholder} />
        {:else}
          <Plain studentName={studentNamePlaceholder} />
        {/if}
      </div>
    </section>
  </div>
  <div class="h-1/5">
    <PrimaryButton
      label={Saved == true ? 'Saved' : 'Save Changes'}
      className="rounded-md"
      onClick={saveCertificate}
      isLoading={isSaving}
    />
  </div>
</main>

<style>
  p {
    color: #262626;
  }
  .certificate-container {
    width: 95%;
    max-width: 95%;
  }
  .certificate-bg {
    background-color: #f5f8fe;
  }
</style>
