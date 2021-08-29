<script>
  import MODES from '../../../../../utils/constants/mode.js';

  import Tabs from '../../../../Tabs/index.svelte';
  import TabContent from '../../../../TabContent/index.svelte';
  import MarkdownRender from '../../../../MarkdownRender/index.svelte';
  import Box from '../../../../Box/index.svelte';
  import EditContent from '../../../../EditContent/index.svelte';
  import TextField from '../../../../Form/TextField.svelte';
  import {
    lesson,
    handleUpdateLessonMaterials,
    isLessonDirty,
  } from '../store/lessons';
  import { tabs } from './constants';

  export let mode = MODES.view;
  export let prevMode = null;
  export let lessonId;

  let currentTab = tabs[0].value;
  let errors = {};

  const onChange = (tab) => () => (currentTab = tab);

  function formatYoutubeVideo(url) {
    console.log(`url`, url);
    const prefix = 'https://www.youtube.com/embed';

    // https://www.youtube.com/embed/qajK1J1neAM
    if (url.includes('embed')) {
      return url;
    }

    // https://youtu.be/qajK1J1neAM
    if (url.includes('.be/')) {
      const splittedUrlWithBe = url.split('.be/');

      return `${prefix}/${splittedUrlWithBe[1]}`;
    }

    // https://www.youtube.com/watch?v=qajK1J1neAM
    const splitedUrl = url.split('watch');
    if (splitedUrl.length !== 2) {
      errors.video = 'Wrong url format';
      return;
    }

    const query = new URLSearchParams(splitedUrl[1]);

    return `${prefix}/${query.get('v')}`;
  }

  function handleSave(prevMode) {
    if (prevMode === MODES.edit) {
      handleUpdateLessonMaterials($lesson, lessonId);
    }
  }

  $: handleSave(prevMode);
</script>

<Tabs {tabs} {currentTab} {onChange}>
  <slot:fragment slot="content">
    <TabContent value={tabs[0].value} index={currentTab}>
      {#if mode === MODES.edit}
        <TextField
          label="Slide link"
          bind:value={$lesson.materials.slide_url}
          onChange={() => ($isLessonDirty = true)}
        />
      {:else if $lesson.materials.slide_url}
        <iframe
          title="Embeded Slides"
          src={$lesson.materials.slide_url}
          frameborder="0"
          width="100%"
          height="569"
          allowfullscreen="true"
          mozallowfullscreen="true"
          webkitallowfullscreen="true"
        />
      {:else}
        <Box>
          <h3 class="text-3xl text-gray-500">No slide added</h3>
          <img alt="Slide not found" src="/notfound.webp" class="w-80" />
        </Box>
      {/if}
    </TabContent>

    <TabContent value={tabs[1].value} index={currentTab}>
      {#if mode === MODES.edit}
        <EditContent
          writeLabel="Note"
          bind:value={$lesson.materials.note}
          placeholder="Start typing your lesson"
          onInputChange={() => ($isLessonDirty = true)}
        />
      {:else if $lesson.materials.note}
        <MarkdownRender content={$lesson.materials.note} />
      {:else}
        <Box>
          <h3 class="text-3xl text-gray-500">No note added</h3>
          <img alt="Lesson note not found" src="/notfound.webp" class="w-80" />
        </Box>
      {/if}
    </TabContent>

    <TabContent value={tabs[2].value} index={currentTab}>
      {#if mode === MODES.edit}
        <TextField
          label="Youtube link"
          bind:value={$lesson.materials.video_url}
          onChange={() => ($isLessonDirty = true)}
        />
      {:else if $lesson.materials.video_url && $lesson.materials.video_url.includes('youtube')}
        {#each $lesson.materials.video_url.split(',') as url}
          <div class="mb-5">
            <iframe
              width="100%"
              height="569"
              src={formatYoutubeVideo(url)}
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            />
          </div>
        {/each}
      {:else}
        <Box>
          <h3 class="text-3xl text-gray-500">No youtube video added</h3>
          <img alt="Video not found" src="/notfound.webp" class="w-80" />
        </Box>
      {/if}
    </TabContent>
  </slot:fragment>
</Tabs>
