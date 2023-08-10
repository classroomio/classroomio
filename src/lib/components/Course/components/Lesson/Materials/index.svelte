<script lang="ts">
  import { useCompletion } from 'ai/svelte';
  import merge from 'lodash/merge';
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
  import { fetchLesson } from '$lib/utils/services/courses';
  import type { LessonPage } from '$lib/utils/types';

  export let mode = MODES.view;
  export let prevMode = '';
  export let lessonId = '';

  let tabs = CONSTANTS.tabs;
  let currentTab = tabs[0].value;
  let errors = {};
  let textareaRef = {};
  let aiButtonRef = {};
  let openPopover = false;
  let aiButtonClass =
    'flex items-center px-5 py-2 border border-gray-300 hover:bg-gray-200 rounded-md w-full mb-2';

  const onChange =
    (tab = 0) =>
    () =>
      (currentTab = tab);

  // problem: after we save an uploaded video,
  async function saveLesson() {
    const { data } = await fetchLesson(lessonId);
    const materials = merge(data, $lesson.materials);

    lesson.update((l) => ({
      ...l,
      materials
    }));
    handleUpdateLessonMaterials($lesson, lessonId);
  }

  function handleSave(prevMode: string) {
    if (prevMode === MODES.edit) {
      saveLesson();
    }
  }

  function addBadgeValueToTab(materials) {
    const { slide_url, videos, note } = materials;

    tabs = tabs.map((tab) => {
      let badgeValue;

      if (tab.value === 1) {
        badgeValue = !!slide_url ? 1 : 0;
      } else if (tab.value === 2) {
        badgeValue = !!note ? 1 : 0;
      } else {
        badgeValue = Array.isArray(videos) ? videos.length : 0;
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
    saveLesson();
    $uploadCourseVideoStore.isModalOpen = false;
    $uploadCourseVideoStore.formRes = null;
  };

  $: handleSave(prevMode);

  $: addBadgeValueToTab($lesson.materials);

  $: updateNoteByCompletion($completion);
</script>

<Modal
  {onClose}
  bind:open={$uploadCourseVideoStore.isModalOpen}
  width="w-4/5 h-[566px]"
  modalHeading="Add a Video"
>
  <VideoUploader {lessonId} {saveLesson} />
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
      {#if mode === MODES.edit && $lesson.materials.videos.length}
        <PrimaryButton label="Add/Edit Video(s)" onClick={openAddVideoModal} className="mb-2" />
      {/if}
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
                    <video class="plyr-video-trigger" playsinline controls>
                      <source src={video.link} type="video/mp4" />
                      <track kind="captions" />
                    </video>
                  {/if}
                </div>
              {/key}
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
