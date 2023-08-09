<script lang="ts">
  import { useCompletion } from 'ai/svelte';
  import MODES from '$lib/utils/constants/mode.js';
  import { getEmbedId } from '$lib/utils/functions/formatYoutubeVideo';
  import Modal from '$lib/components/Modal/index.svelte';
  import { Popover } from 'carbon-components-svelte';
  import AlignBoxTopLeftIcon from 'carbon-icons-svelte/lib/AlignBoxTopLeft.svelte';
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import ListIcon from 'carbon-icons-svelte/lib/List.svelte';
  import IbmWatsonKnowledgeStudioIcon from 'carbon-icons-svelte/lib/IbmWatsonKnowledgeStudio.svelte';
  import MachineLearningModel from 'carbon-icons-svelte/lib/MachineLearningModel.svelte';
  import Tabs from '$lib/components/Tabs/index.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import MarkdownRender from '$lib/components/MarkdownRender/index.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import EditContent from '$lib/components/EditContent/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
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
  import * as CONSTANTS from './constants';
  import { browser } from '$app/environment';

  export let mode = MODES.view;
  export let prevMode = '';
  export let lessonId = '';

  let tabs = CONSTANTS.tabs;
  let currentTab = tabs[0].value;
  let errors = {};
  let player = {};
  let textareaRef = {};
  let aiButtonRef = {};
  let openPopover = false;
  let videoUrls: Array<string> = [];
  let aiButtonClass =
    'flex items-center px-5 py-2 border border-gray-300 hover:bg-gray-200 rounded-md w-full mb-2';

  const onChange =
    (tab = 0) =>
    () =>
      (currentTab = tab);

  function initPlyr(_player, videoUrl = '') {
    if (!browser) return;

    const players = Array.from(document.querySelectorAll('.plyr-video-trigger')).map((p) => {
      // @ts-ignore
      return new Plyr(p);
    });

    // @ts-ignore
    window.players = players;
  }

  function handleSave(prevMode) {
    if (prevMode === MODES.edit) {
      handleUpdateLessonMaterials($lesson, lessonId);
    }
  }

  function addBadgeValueToTab(materials) {
    const { slide_url, video_url, note } = materials;

    tabs = tabs.map((tab) => {
      let badgeValue;

      if (tab.value === 1) {
        badgeValue = !!slide_url ? 1 : 0;
      } else if (tab.value === 2) {
        badgeValue = !!note ? 1 : 0;
      } else {
        badgeValue = typeof video_url === 'string' && !!video_url ? video_url.split(',').length : 0;
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
    if (textareaRef) {
      textareaRef.scrollTop = textareaRef.scrollHeight;
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

  const onClose = () => {
    handleUpdateLessonMaterials($lesson, lessonId);
    $uploadCourseVideoStore.isModalOpen = false;
  };

  $: handleSave(prevMode);

  $: initPlyr(player, $lesson.materials.video_url);

  $: addBadgeValueToTab($lesson.materials);

  $: updateNoteByCompletion($completion);

  $: videoUrls = ($lesson?.materials?.video_url || '').split(',').filter((url) => !!url.trim());
</script>

<Modal
  {onClose}
  bind:open={$uploadCourseVideoStore.isModalOpen}
  width="w-4/5 h-[566px]"
  modalHeading="Add a Video"
>
  <VideoUploader {onClose} />
</Modal>

<Tabs {tabs} {currentTab} {onChange}>
  <slot:fragment slot="content">
    <TabContent value={tabs[0].value} index={currentTab}>
      {#if mode === MODES.edit}
        <EditContent
          writeLabel="Note"
          bind:value={$lesson.materials.note}
          placeholder="Start typing your lesson"
          onInputChange={() => ($isLessonDirty = true)}
          bind:textareaRef
          bind:buttonRef={aiButtonRef}
        >
          <div slot="buttons">
            <PrimaryButton
              className="flex items-center relative"
              onClick={() => {
                openPopover = !openPopover;
              }}
              isLoading={$isLoading}
              isDisabled={$isLoading}
            >
              <MachineLearningModel size={20} class="carbon-icon mr-3" />
              AI Assistant
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
        </EditContent>
      {:else if $lesson.materials.note}
        <MarkdownRender content={$lesson.materials.note} />
      {:else}
        <Box>
          <div class="flex justify-between flex-col items-center w-96">
            <img src="/images/empty-note-icon.svg" alt="No Note" class="my-2.5 mx-auto" />
            <h2 class="text-xl my-1.5 font-normal">No Notes yet</h2>
            <p class="text-sm text-center text-slate-500">
              Share your knowledge with the world by creating engaging notes. Add your notes now.
            </p>
          </div>
        </Box>
      {/if}
    </TabContent>

    <TabContent value={tabs[1].value} index={currentTab}>
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
          class="iframe"
          allowfullscreen="true"
          mozallowfullscreen="true"
          webkitallowfullscreen="true"
        />
      {:else}
        <Box>
          <div class="flex justify-between flex-col items-center w-96">
            <img src="/images/empty-slide-icon.svg" alt="No Slide" class="my-2.5 mx-auto" />
            <h2 class="text-xl my-1.5 font-normal">No slides yet</h2>
            <p class="text-sm text-center text-slate-500">
              Share your knowledge with the world by creating engaging slides. Add your slide's link
              now.
            </p>
          </div>
        </Box>
      {/if}
    </TabContent>

    <TabContent value={tabs[2].value} index={currentTab}>
      {#if mode === MODES.edit && videoUrls.length}
        <PrimaryButton label="Add/Edit Video" onClick={openAddVideoModal} className="mb-2" />
      {/if}
      <!-- Line 230 would run if its in edit mode or the video is truthy but then in line 235 we are mapping for an empty string -->
      {#if videoUrls.length}
        <div class="flex flex-col items-start w-full h-full">
          {#each videoUrls as url, index}
            <div class="w-full h-full flex flex-col gap-2 overflow-hidden">
              {#if url.includes('youtube')}
                <div class="mb-5">
                  <div
                    bind:this={player}
                    class="plyr-video-trigger"
                    data-plyr-provider="youtube"
                    data-plyr-embed-id={getEmbedId(url)}
                  />
                </div>
              {:else}
                <video bind:this={player} class="plyr-video-trigger" playsinline controls>
                  <source
                    src="https://pub-bd38ff7251aa402a93762181a947f7ea.r2.dev/generate-lesson-draft.mp4"
                    type="video/mp4"
                  />
                  <!-- <source src="/path/to/video.webm" type="video/webm" /> -->
                  <!-- Captions are optional -->
                  <track kind="captions" />
                </video>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <Box>
          <img src="/no-video.svg" alt="Video not found" />
          <h3 class="text-xl font-normal dark:text-white py-2">
            No youtube video added for this lesson yet
          </h3>
          <p class="text-sm text-center font-normal py-2">
            Share your knowledge with the world by creating engaging lessons.<br />
            Start by clicking on New Lesson button.
          </p>
          <PrimaryButton label="Add Video" className="rounded-md" onClick={openAddVideoModal} />
        </Box>
      {/if}
    </TabContent>
  </slot:fragment>
</Tabs>

<style>
  .iframe {
    height: 569px;
  }

  @media (max-width: 760px) {
    .iframe {
      height: 209px;
    }
  }
</style>
