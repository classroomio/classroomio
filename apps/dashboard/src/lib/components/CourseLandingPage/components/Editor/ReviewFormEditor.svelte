<script lang="ts">
  import SaveIcon from '@lucide/svelte/icons/save';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import { Toggle } from 'carbon-components-svelte';
  import { IconButton } from '$lib/components/IconButton';
  import UploadImage from '$lib/components/UploadImage/index.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { uploadAvatar } from '$lib/utils/services/courses';
  import { t } from '$lib/utils/functions/translations';

  let { courseId, reviews = $bindable([]), review = $bindable({}), errors = {}, onExpand = () => {} } = $props();

  let avatar = $state<string | undefined>();

  // function to delete review
  function deleteReviewData() {
    reviews = reviews.filter((r) => r.id !== review.id);
  }

  async function onAvatarChange(_avatar) {
    if (!_avatar) return;

    review.avatar_url = await uploadAvatar(courseId, _avatar);
  }

  $effect(() => {
    onAvatarChange(avatar);
  });
</script>

<div class="flex w-full flex-col items-center">
  <UploadImage bind:avatar src={review.avatar_url} widthHeight="w-20 h-20" errorMessage={errors.avatar_url} />

  <TextField
    className="mt-2 w-full"
    labelClassName="font-normal"
    label={$t('course.navItem.landing_page.editor.reviews_form.fullname')}
    placeholder=""
    type="text"
    bind:value={review.name}
    errorMessage={errors.name}
  />

  <!-- Description -->
  <TextArea
    label={$t('course.navItem.landing_page.editor.reviews_form.description')}
    rows={4}
    className="mt-2 w-full"
    labelClassName="font-normal"
    placeholder=""
    bind:value={review.description}
    errorMessage={errors.description}
    isAIEnabled={true}
    initAIPrompt="Generate a 20 word review from a student saying good things about me teaching"
    aiAlignPopover="top-right"
  />

  <div class="mt-2 flex w-full items-center justify-between">
    <!-- Rating -->
    <TextField
      className="mt-2 w-20"
      labelClassName="font-normal"
      label={$t('course.navItem.landing_page.editor.reviews_form.rating')}
      type="number"
      min={1}
      max={5}
      bind:value={review.rating}
      onInputChange={(e) => {
        review.rating = parseInt(e.target.value);
      }}
      errorMessage={errors.rating}
    />

    <!-- Toggle -->
    <div class="w-24">
      <Toggle
        labelText={$t('course.navItem.landing_page.editor.reviews_form.hide')}
        size="sm"
        bind:toggled={review.hide}
      />
    </div>
  </div>

  <div class="mt-8 flex w-full items-center justify-between">
    <IconButton contained={true} value="delete" onClick={deleteReviewData} size="large">
      <TrashIcon size={16} />
    </IconButton>
    <IconButton contained={true} value="save" onClick={() => onExpand(review.id)} size="large">
      <SaveIcon size={16} />
    </IconButton>
  </div>
</div>
