<script>
  import {
    RadioButtonGroup,
    RadioButton,
    Toggle,
  } from 'carbon-components-svelte';
  import UploadImage from './Upload.svelte';
  import PrimaryButton from '../../../PrimaryButton/index.svelte';
  import TextArea from '../../../Form/TextArea.svelte';
  import { certificateInfo } from './store';
  import Professional from './certificates/Professional.svelte';
  import Plain from './certificates/Plain.svelte';

  const theme1 = './theme1.png';
  const theme2 = './theme2.png';

  const themes = [
    { label: 'theme1', src: theme1 },
    { label: 'theme2', src: theme2 },
  ];

  let Selectedtheme = themes[0];
  const saveCertificate = () => {};
  const onToggle = (e) => {
    console.log(e);
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
            bind:value={$certificateInfo.Desc}
            onChange={$certificateInfo.Desc}
          />
        </span>

        <Toggle
          labelText="Add date of completion"
          on:toggle={(e) => onToggle(e)}
          class="my-2"
          size="sm"
        >
          <span slot="labelA" style="color: #161616">Automatic</span>
          <span slot="labelB" style="color: green">Automatic</span>
        </Toggle>
      </div>
    </section>
    <section
      class="certbg flex justify-center items-center rounded-md w-full md:w-3/5"
    >
      <div class="flex justify-center items-center h-5/6 w-5/6">
        {#if Selectedtheme.label == 'theme1'}
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
      onClick={() => saveCertificate()}
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
