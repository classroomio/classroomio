<script>
  import {
    RadioButtonGroup,
    RadioButton,
    Toggle,
  } from 'carbon-components-svelte';
  import UploadImage from './Upload.svelte';
  import PrimaryButton from '../../../PrimaryButton/index.svelte';
  import { course } from '../../../Course/store';
  import TextArea from '../../../Form/TextArea.svelte';
  import Professional from './certificates/Professional.svelte';
  import Plain from './certificates/Plain.svelte';

  const professional = './theme1.png';
  const plain = './theme2.png';

  const themes = [
    { label: 'professional', src: professional },
    { label: 'plain', src: plain },
  ];

  let Selectedtheme = themes[0];
  let isSaving = false;

  const saveCertificate = () => {
    // set isSaving to true
    // Validation - make sure description isn't empty
    // Upload the brand logo to give you a URL
    // Update organisation logo (like in `src/components/Org/Settings/OrgSettings.svelte` line 25-51)
    //    - Note from the file above both logo and name is updated, in this case we only want to update logo
    /**
     * Update only course description (like in src/components/Course/components/Settings/index.svelte)
     * 
     * await updateCourse($course.id, undefined, {
        description: $course.description,
        is_certificate_downloadable: $course.is_certificate_downloadable
      });
     * */
    // set isSaving to false
  };
</script>

<main class="md:-ml-4 md:-mr-4">
  <div
    class="flex-1 flex flex-col md:flex-row justify-between gap-3 w-full mb-3 h-4/5"
  >
    <section class="w-full md:w-2/5 h-full">
      <strong class="my-2 text-base font-semibold text-black"
        >Certificate settings</strong
      >
      <p class="text-xs font-normal my-4">Choose a theme</p>
      <RadioButtonGroup bind:selected={Selectedtheme} class="mb-10">
        {#each themes as value}
          <div class="flex mr-3">
            <RadioButton {value} size="sm" />
            <img src={value.src} alt="themes" />
          </div>
        {/each}
      </RadioButtonGroup>
      <div>
        <p class="text-xs font-normal text-black my-2">Brand Logo</p>
        <p class="text-base font-normal mt-2 mb-4">
          We recommend using a PNG file with transparency. Maximum size: 1200 x
          600px.
        </p>

        <UploadImage />

        <span class="my-4">
          <p class="text-xs font-normal mt-4 mb-2">Course Description</p>
          <TextArea
            maxRows={6}
            rows={6}
            placeholder="a little description about the course"
            bgColor="bg-gray-100"
            bind:value={$course.description}
          />
        </span>

        <Toggle
          labelText="Allow students download certificate"
          bind:toggled={$course.is_certificate_downloadable}
          class="my-4"
          size="sm"
        >
          <span slot="labelA" style="color: #161616">Student access</span>
          <span slot="labelB" style="color: green">Student access</span>
        </Toggle>
      </div>
    </section>
    <section
      class="certbg flex justify-center items-center rounded-md w-full md:w-3/5"
    >
      <div class="flex justify-center items-center h-5/6 w-5/6">
        {#if Selectedtheme.label == 'professional'}
          <Professional />
        {:else}
          <Plain />
        {/if}
        <!-- <img src="./certImg.png" alt="cert" class="object-cover" /> -->
        <!-- <img src={Selectedtheme.src} alt="cert" class="img object-cover" /> -->
        <!-- {Selectedtheme.label} -->
      </div>
    </section>
  </div>
  <div class="h-1/5">
    <PrimaryButton
      label="Save Changes"
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
  .certbg {
    background-color: #f5f8fe;
  }
  /* .img {
    width: 600px;
    height: 200px;
  } */
</style>
