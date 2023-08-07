<script>
  import { CopyButton, Tag } from 'carbon-components-svelte';
  import TrashCanIcon from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { lesson, isLessonDirty } from '$lib/components/Course/components/Lesson/store/lessons';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Chip from '$lib/components/Chip/Text.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';

  let youtubeLinks = '';
  let error = '';

  function addVideo() {
    const links = youtubeLinks.split(',').map((link) => link.trim());
    const validLinks = links.filter(isValidYouTubeLink);

    if (validLinks.length === 0) {
      error = 'Invalid YouTube link(s)';
    } else {
      const existingLinks = $lesson.materials.video_url
        .split(',')
        .map((link) => link.trim())
        .filter(Boolean);
      const updatedLinks = [
        ...existingLinks,
        ...validLinks.filter((link) => !existingLinks.includes(link))
      ];
      $lesson.materials.video_url = updatedLinks.join(',').trim();
      youtubeLinks = '';
      error = '';
    }
  }

  function isValidYouTubeLink(link) {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

    return youtubeRegex.test(link.trim());
  }

  function removeVideo(index) {
    const links = $lesson.materials.video_url.split(',').map((link) => link.trim());
    links.splice(index, 1);
    $lesson.materials.video_url = links.join(',').trim();
  }
</script>

<div class="w-full flex items-{error ? 'center' : 'end'} justify-between gap-5">
  <TextField
    label="Youtube link"
    bind:value={youtubeLinks}
    className="flex-1 text-left "
    inputClassName="text-sm"
    onChange={() => ($isLessonDirty = true)}
    placeholder="https://www.youtube.com/watch?v="
    errorMessage={error}
  />
  <PrimaryButton label="Add Video" className="rounded-md" onClick={addVideo} />
</div>
<p class="mt-4 pl-2 text-sm">
  Added : <strong
    >{($lesson?.materials?.video_url && $lesson.materials.video_url.trim().split(',').length) || 0} Videos</strong
  >
</p>
<div class="">
  {#each $lesson?.materials?.video_url && $lesson.materials.video_url
      .trim()
      .split(',') as videoLink, index}
    <div class="flex items-center gap-1">
      <Tag type="blue">
        {videoLink}
      </Tag>
      <CopyButton text={videoLink} feedback="Copied to clipboard" />
      <IconButton value="delete-video" onClick={() => removeVideo(index)}>
        <TrashCanIcon size={16} class="carbon-icon dark:text-white" />
      </IconButton>
    </div>
  {/each}
</div>
