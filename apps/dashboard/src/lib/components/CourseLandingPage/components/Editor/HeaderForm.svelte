<script lang="ts">
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { handleOpenWidget } from '../../store';

  export let course = {};

  function widgetControl() {
    $handleOpenWidget.open = !$handleOpenWidget.open;
  }
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
