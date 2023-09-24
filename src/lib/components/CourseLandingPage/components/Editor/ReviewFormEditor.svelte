<script>
  import SaveIcon from 'carbon-icons-svelte/lib/Save.svelte';
  import TrashCanIcon from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import { Toggle } from 'carbon-components-svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { uploadAvatar } from '$lib/utils/services/courses';

  export let courseId;
  export let reviews = [];
  export let review = {};
  export let errors = {};
  export let onExpand = () => {};

  let avatar;

  // function to delete review
  function deleteReviewData() {
    reviews = reviews.filter((r) => r.id !== review.id);
  }

  async function onAvatarChange(_avatar) {
    if (!_avatar) return;

    review.avatar_url = await uploadAvatar(courseId, _avatar);
  }

  $: onAvatarChange(avatar);
  $: review.rating = parseInt(review.rating);
</script>

<div class="flex items-center flex-col w-full">
  <UploadImage
    bind:avatar
    src={review.avatar_url}
    widthHeight="w-20 h-20"
    errorMessage={errors.avatar_url}
  />

  <TextField
    className="mt-2 w-full"
    labelClassName="font-normal"
    label="Full Name"
    placeholder=""
    type="text"
    bind:value={review.name}
    errorMessage={errors.name}
  />

  <!-- Description -->
  <TextArea
    label="Description"
    rows="4"
    className="mt-2 w-full"
    labelClassName="font-normal"
    placeholder=""
    bind:value={review.description}
    errorMessage={errors.description}
    isAIEnabled={true}
    initAIPrompt="Generate a 20 word review from a student saying good things about me teaching"
    aiAlignPopover="top-right"
  />

  <div class="flex justify-between w-full items-center mt-2">
    <!-- Rating -->
    <TextField
      className="mt-2 w-20"
      labelClassName="font-normal"
      label="Rating"
      type="number"
      min={1}
      max={5}
      bind:value={review.rating}
      errorMessage={errors.rating}
    />

    <!-- Toggle -->
    <div class="w-24">
      <Toggle labelText="Hide Review" size="sm" bind:toggled={review.hide} />
    </div>
  </div>

  <div class="mt-8 flex justify-between items-center w-full">
    <IconButton contained={true} value="delete" onClick={deleteReviewData} size="large">
      <TrashCanIcon size={24} class="carbon-icon dark:text-white" />
    </IconButton>
    <IconButton contained={true} value="save" onClick={() => onExpand(review.id)} size="large">
      <SaveIcon size={24} class="carbon-icon dark:text-white" />
    </IconButton>
  </div>
</div>
