<script>
  import Save24 from 'carbon-icons-svelte/lib/Save24';
  import Delete24 from 'carbon-icons-svelte/lib/Delete24';
  import { Toggle } from 'carbon-components-svelte';
  import IconButton from '../../../IconButton/index.svelte';
  import UploadImage from '../../../UploadImage/index.svelte';
  import TextArea from '../../../Form/TextArea.svelte';
  import TextField from '../../../Form/TextField.svelte';
  import { uploadAvatar } from '../../../../utils/services/courses';

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
    <IconButton
      contained={true}
      value="delete"
      onClick={deleteReviewData}
      size="large"
    >
      <Delete24 class="carbon-icon" />
    </IconButton>
    <IconButton
      contained={true}
      value="save"
      onClick={() => onExpand(review.id)}
      size="large"
    >
      <Save24 class="carbon-icon" />
    </IconButton>
  </div>
</div>
