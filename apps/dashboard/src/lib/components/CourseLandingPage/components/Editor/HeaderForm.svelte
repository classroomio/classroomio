<script lang="ts">
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { handleOpenWidget } from '../../store';
  import { onMount } from 'svelte';

  export let course = {};
  
  function widgetControl() {
    $handleOpenWidget.open = true;
  }
  
  function widgetControl() {
    $handleOpenWidget.open = true;
    console.log('Opening widget...');
  }

///////////////////////////////////////////////////////////

<!-- Here is my suggested implementation of the replace button logic:

//Here is an array of fake images(i couldn't find the folder where the images are)

const imageArray = [
    'https://example.com/image1.png',
    'https://example.com/image2.png',
    'https://example.com/image3.png',
    // Add more image URLs as needed
  ];

  let currentImageIndex = 0;
  $: currentImageUrl = imageArray[currentImageIndex];

  function replaceCoverImage() {
    // Increment of the index or reset to 0 if it exceeds the array length
    currentImageIndex = (currentImageIndex + 1) % imageArray.length;
  }

  //The component template will contain an <img> tag for the cover image (i couldnt locate this either):

  <img bind:src={currentImageUrl} alt="Cover Image" />

  -->

//////////////////////////////////////////////////

</script>

<TextField className="mt-5" labelClassName="font-bold" label="Title" bind:value={course.title} />

<TextArea
  label="Description"
  bind:value={course.description}
  rows="6"
  className="mt-5"
  labelClassName="font-bold"
/>

<TextField
  className="mt-5"
  labelClassName="font-bold"
  label="Short Video"
  placeholder="www.youtube.com/watch?v=uYRq60G5XTk"
  helperMessage="Enter a link to a youtube video"
  type="text"
  bind:value={course.metadata.videoUrl}
/>
<div class="mt-7">
  <p class="font-bold mb-3">Replace cover image</p>
  <PrimaryButton label="Replace" variant={VARIANTS.OUTLINED} onClick={widgetControl} />
</div>
