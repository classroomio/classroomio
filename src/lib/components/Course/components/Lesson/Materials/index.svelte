<script lang="ts">
  import isEmpty from 'lodash/isEmpty';
  import { useCompletion } from 'ai/svelte';
  import MODES from '$lib/utils/constants/mode.js';
  import TrashCanIcon from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { formatYoutubeVideo } from '$lib/utils/functions/formatYoutubeVideo';
  import Modal from '$lib/components/Modal/index.svelte';
  import { Popover } from 'carbon-components-svelte';
  import AlignBoxTopLeftIcon from 'carbon-icons-svelte/lib/AlignBoxTopLeft.svelte';
  import ListIcon from 'carbon-icons-svelte/lib/List.svelte';
  import IbmWatsonKnowledgeStudioIcon from 'carbon-icons-svelte/lib/IbmWatsonKnowledgeStudio.svelte';
  import MachineLearningModel from 'carbon-icons-svelte/lib/MachineLearningModel.svelte';
  import Tabs from '$lib/components/Tabs/index.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import TextField from '$lib/components/Form/TextField.svelte';
  import {
    lesson,
    lessons,
    handleUpdateLessonMaterials,
    isLessonDirty,
    uploadCourseVideoStore,
    deleteLessonVideo
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import VideoUploader from '$lib/components/Course/components/Lesson/Materials/Video/Index.svelte';
  import { course } from '$lib/components/Course/store';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import * as CONSTANTS from './constants';

  export let mode = MODES.view;
  export let prevMode = '';
  export let lessonId = '';
  export let isSaving = false;
  export let toggleMode = () => {};

  let lessonTitle = '';
  let initAutoSave = false;
  let timeoutId: NodeJS.Timeout;
  let tabs = CONSTANTS.tabs;
  let currentTab = tabs[0].value;
  let errors = {};
  let editorWindowRef;
  let aiButtonRef = {};
  let openPopover = false;
  let player = null;
  let aiButtonClass =
    'flex items-center px-5 py-2 border border-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md w-full mb-2';

  const onChange =
    (tab = 0) =>
    () =>
      (currentTab = tab);

  async function saveLesson(materials = undefined) {
    const _lesson = !!materials
      ? {
          ...$lesson,
          materials
        }
      : $lesson;
    handleUpdateLessonMaterials(_lesson, lessonId);
  }

  function isNoteEmpty(note) {
    if (!note || typeof note !== 'string') return true;

    if (!document) return false;

    const dummyDiv = document.createElement('div');
    dummyDiv.innerHTML = note;

    const rawText = dummyDiv.textContent?.trim();

    return rawText === '';
  }

  function isMaterialsEmpty(materials) {
    const { slide_url, videos, note } = materials;

    return isNoteEmpty(note) && !slide_url && isEmpty(videos);
  }

  function handleSave(prevMode: string) {
    if (prevMode === MODES.edit) {
      saveLesson();
    }
  }

  function addBadgeValueToTab(materials) {
    const { slide_url, videos, note } = materials;

    tabs = tabs.map((tab) => {
      let badgeValue = 0;

      if (tab.value === 1 && !isNoteEmpty(note)) {
        badgeValue = 1;
      } else if (tab.value === 2 && !!slide_url) {
        badgeValue = 1;
      } else if (tab.value === 3 && !isEmpty(videos)) {
        badgeValue = 1;
      }
      tab.badgeValue = badgeValue;
      return tab;
    });
  }

  const openAddVideoModal = () => {
    $uploadCourseVideoStore.isModalOpen = true;
  };

  const { input, handleSubmit, completion, isLoading } = useCompletion({
    api: '/api/completion'
  });

  function updateNoteByCompletion(completion) {
    $lesson.materials.note = completion;

    autoSave($lesson.materials);

    if (editorWindowRef) {
      const tmceBody = editorWindowRef?.document?.querySelector('body');

      editorWindowRef?.scrollTo(0, tmceBody?.scrollHeight);
    }
  }

  function callAI(type = '') {
    const _lesson = $lessons.find((les) => les.id === $lesson.id);
    $input = {
      type,
      lessonTitle: _lesson?.title || '',
      courseTitle: $course.title
    };
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} });
    }, 500);
  }

  function initPlyr(_player: any, _video: string | undefined) {
    if (!_player) return;

    const players = Array.from(document.querySelectorAll('.plyr-video-trigger')).map((p) => {
      // @ts-ignore
      return new Plyr(p);
    });

    // @ts-ignore
    window.players = players;
  }

  function autoSave(updatedMaterials, _isLoading?: boolean, lessonId?: string) {
    if (timeoutId) clearTimeout(timeoutId);

    if (!initAutoSave) {
      initAutoSave = true;
      return;
    }

    isSaving = true;
    timeoutId = setTimeout(async () => {
      await saveLesson(updatedMaterials);
      isSaving = false;
    }, 500);
  }

  function handleInputChange() {
    $isLessonDirty = true;
  }

  function onLessonIdChange(_lid: string) {
    initAutoSave = false;
    isSaving = false;
  }

  const onClose = () => {
    $uploadCourseVideoStore.isModalOpen = false;
  };

  $: autoSave($lesson.materials, $isLoading, lessonId);

  $: onLessonIdChange(lessonId);

  $: handleSave(prevMode);

  $: addBadgeValueToTab($lesson.materials);

  $: updateNoteByCompletion($completion);

  $: initPlyr(player, $lesson.materials.videos);

  $: lessonTitle = $lessons.find((les) => les.id === $lesson.id)?.title || '';
</script>

<Modal
  {onClose}
  bind:open={$uploadCourseVideoStore.isModalOpen}
  width="w-4/5 w-[90%] h-[80%] md:h-[566px]"
  modalHeading="Add a Video"
>
  <VideoUploader {lessonId} />
</Modal>

<h1 class="text-4xl mt-0 capitalize">
  {lessonTitle}
</h1>

{#if mode === MODES.edit}
  <Tabs {tabs} {currentTab} {onChange}>
    <slot:fragment slot="content">
      <TabContent value={tabs[0].value} index={currentTab}>
        <div bind:this={aiButtonRef} class="w-full flex flex-row-reverse">
          <PrimaryButton
            className="flex items-center relative"
            onClick={() => {
              openPopover = !openPopover;
            }}
            isLoading={$isLoading}
            isDisabled={$isLoading}
            variant={VARIANTS.OUTLINED}
          >
            <MachineLearningModel size={20} class="carbon-icon mr-3" />
            AI
            <Popover
              caret
              align="left"
              bind:open={openPopover}
              on:click:outside={({ detail }) => {
                openPopover = aiButtonRef?.contains(detail.target);
              }}
            >
              <div class="p-2">
                <button class={aiButtonClass} on:click={() => callAI('outline')}>
                  <ListIcon class="carbon-icon mr-2" />
                  Generate Lesson Outline
                </button>
                <button class={aiButtonClass} on:click={() => callAI('note')}>
                  <AlignBoxTopLeftIcon class="carbon-icon mr-2" />
                  Generate Lesson Note
                </button>
                <button class={aiButtonClass} on:click={() => callAI('activities')}>
                  <IbmWatsonKnowledgeStudioIcon class="carbon-icon mr-2" />
                  Generate Lesson Activities
                </button>
              </div>
            </Popover>
          </PrimaryButton>
        </div>

        <div class="h-[60vh] mt-5">
          <TextEditor
            id={lessonId}
            bind:editorWindowRef
            value={$lesson.materials.note}
            onChange={(html) => ($lesson.materials.note = html)}
            placeholder="Write your lesson note here"
          />
        </div>
      </TabContent>

      <TabContent value={tabs[1].value} index={currentTab}>
        {#if mode === MODES.edit}
          <TextField
            label="Slide link"
            bind:value={$lesson.materials.slide_url}
            onInputChange={handleInputChange}
          />
        {/if}
      </TabContent>

      <TabContent value={tabs[2].value} index={currentTab}>
        <PrimaryButton label="Add/Edit Video(s)" onClick={openAddVideoModal} className="mb-2" />
        {#if $lesson.materials.videos.length}
          <div class="flex flex-col items-start w-full h-full">
            {#each $lesson.materials.videos as video, index}
              {#if mode === MODES.edit}
                <div class="ml-auto">
                  <IconButton
                    value="delete-video"
                    contained={true}
                    onClick={() => deleteLessonVideo(index)}
                  >
                    <TrashCanIcon size={20} class="carbon-icon dark:text-white" />
                  </IconButton>
                </div>
              {/if}
              <div class="w-full h-full flex flex-col gap-2 overflow-hidden">
                {#key video.link}
                  <div class="mb-5">
                    {#if video.type === 'youtube'}
                      <iframe
                        width="100%"
                        height="569"
                        class="iframe"
                        src={formatYoutubeVideo(video.link, errors)}
                        title="YouTube video player"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                      />
                    {:else if video.metadata?.svid}
                      <div style="position:relative;padding-bottom:51.416579%">
                        <iframe
                          src="https://muse.ai/embed/{video.metadata
                            ?.svid}?logo=https://app.classroomio.com/logo-512.png&subtitles=auto&cover_play_position=center"
                          style="width:100%;height:100%;position:absolute;left:0;top:0"
                          frameborder="0"
                          allowfullscreen
                          title="Muse AI Video Embed"
                        />
                      </div>
                    {:else}
                      <video bind:this={player} class="plyr-video-trigger" playsinline controls>
                        <source src={video.link} type="video/mp4" />
                        <track kind="captions" />
                      </video>
                    {/if}
                  </div>
                {/key}
              </div>
            {/each}
          </div>
        {/if}
      </TabContent>
    </slot:fragment>
  </Tabs>
{:else if !isMaterialsEmpty($lesson.materials)}
  {#if $lesson.materials.videos.length}
    <div class="w-full">
      {#each $lesson.materials.videos as video}
        <div class="w-full overflow-hidden mb-5">
          {#key video.link}
            <div class="mb-5">
              {#if video.type === 'youtube'}
                <iframe
                  class="iframe"
                  src={formatYoutubeVideo(video.link, errors)}
                  title="YouTube video player"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                />
              {:else if video.metadata?.svid}
                <div style="position:relative;padding-bottom:51.416579%">
                  <iframe
                    src="https://muse.ai/embed/{video.metadata
                      ?.svid}?logo=https://app.classroomio.com/logo-512.png&subtitles=auto&cover_play_position=center"
                    style="width:100%;height:100%;position:absolute;left:0;top:0"
                    frameborder="0"
                    allowfullscreen
                    title="Muse AI Video Embed"
                  />
                </div>
              {:else}
                <video bind:this={player} class="plyr-video-trigger" playsinline controls>
                  <source src={video.link} type="video/mp4" />
                  <track kind="captions" />
                </video>
              {/if}
            </div>
          {/key}
        </div>
      {/each}
    </div>
  {/if}

  {#if $lesson.materials.slide_url}
    <iframe
      title="Embeded Slides"
      src={$lesson.materials.slide_url}
      frameborder="0"
      width="100%"
      height="569"
      class="iframe my-3"
      allowfullscreen="true"
      mozallowfullscreen="true"
      webkitallowfullscreen="true"
    />
  {/if}

  {#if !isNoteEmpty($lesson.materials?.note)}
    <article class="preview prose prose-sm sm:prose p-2">
      {@html $lesson.materials.note}
    </article>
  {/if}
{:else}
  <Box className="text-center">
    <img src="/no-video.svg" alt="Video not found" />
    <h3 class="text-xl font-normal dark:text-white py-2">
      No note, video or slide added for this lesson yet
    </h3>
    <p class="text-sm text-center font-normal py-2">
      Share your knowledge with your students by creating engaging content<br />
      Start by clicking on <strong>Get started</strong> button.
    </p>
    <PrimaryButton label="Get started" className="rounded-md" onClick={toggleMode} />
  </Box>
{/if}

<style>
  .iframe {
    width: 100%;
    height: 450px;
  }

  @media (max-width: 760px) {
    .iframe {
      height: 209px;
    }
  }
</style>
