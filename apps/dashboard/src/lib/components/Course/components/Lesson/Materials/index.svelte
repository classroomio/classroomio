<script lang="ts">
  import { untrack } from 'svelte';
  import isEmpty from 'lodash/isEmpty';
  import { writable } from 'svelte/store';
  import { fade } from 'svelte/transition';
  import type { Editor } from '@tiptap/core';
  import { Popover } from 'carbon-components-svelte';

  import TrashIcon from '@lucide/svelte/icons/trash';
  import ListTodoIcon from '@lucide/svelte/icons/list-todo';
  import ListChecksIcon from '@lucide/svelte/icons/list-checks';
  import NotepadTextIcon from '@lucide/svelte/icons/notepad-text';
  import WandSparklesIcon from '@lucide/svelte/icons/wand-sparkles';

  import * as CONSTANTS from './constants';
  import { orderedTabs } from './constants';
  import MODES from '$lib/utils/constants/mode';
  import { currentOrg } from '$lib/utils/store/org';
  import { course } from '$lib/components/Course/store';
  import { supabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import type { LessonPage, LOCALE } from '$lib/utils/types';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import {
    deleteLessonVideo,
    handleUpdateLessonMaterials,
    isLessonDirty,
    lesson,
    lessonByTranslation,
    lessonVideoUpload,
    lessonDocUpload
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { lessonFallbackNote, t } from '$lib/utils/functions/translations';

  import Loader from './Loader.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import Comments from './components/Comments.svelte';
  import Tabs from '$lib/components/Tabs/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import { IconButton } from '$lib/components/IconButton';
  import TextField from '$lib/components/Form/TextField.svelte';
  import ComponentNote from './components/ComponentNote.svelte';
  import ComponentSlide from './components/ComponentSlide.svelte';
  import ComponentVideo from './components/ComponentVideo.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import ComponentDocument from './components/ComponentDocument.svelte';
  import { formatYoutubeVideo } from '$lib/utils/functions/formatYoutubeVideo';
  import AddVideoToLesson from '$lib/components/Course/components/Lesson/Materials/Video/AddVideoToLesson.svelte';
  import AddDocumentToLesson from '$lib/components/Course/components/Lesson/Materials/Document/AddDocumentToLesson.svelte';

  interface Props {
    mode?: any;
    prevMode?: string;
    lessonId?: string;
    isSaving?: boolean;
    isStudent?: boolean;
    toggleMode?: any;
  }

  let {
    mode = MODES.view,
    prevMode = '',
    lessonId = '',
    isSaving = $bindable(false),
    isStudent = false,
    toggleMode = () => {}
  }: Props = $props();

  let openPopover = $state<boolean>(false);
  let aiButtonRef = $state<HTMLDivElement>();
  let aiButtonClass =
    'flex items-center px-5 py-2 border border-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md w-full mb-2';
  let player = $state<HTMLVideoElement>();
  let localeExists: Record<string, boolean> = {};
  // let prevContent = '';
  let timeoutId: NodeJS.Timeout;
  let errors: Record<string, string> = {};
  let editorWindowRef: Window | undefined = $state();
  let editorInstance = $state<Editor>(); // Add proper typing
  ('flex items-center gap-2 px-5 py-2 border border-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md w-full mb-2');

  let isLoading = writable(false);
  const lessonTitle = $derived($lesson.title);
  const tabs = $derived.by(() => {
    const ordered = orderedTabs(CONSTANTS.tabs, $course.metadata?.lessonTabsOrder);
    const content = $lessonByTranslation[lessonId]?.[$lesson.locale] || '';

    const { slide_url, videos, note, documents } = $lesson.materials;

    return ordered.map((tab) => {
      let badgeValue = 0;

      if (tab.value === 1 && (!isHtmlValueEmpty(note) || !isHtmlValueEmpty(content))) {
        badgeValue = 1;
      } else if (tab.value === 2 && !!slide_url) {
        badgeValue = 1;
      } else if (tab.value === 3 && !isEmpty(videos)) {
        badgeValue = videos.length;
      } else if (tab.value === 4 && !isEmpty(documents)) {
        badgeValue = documents.length;
      }
      tab.badgeValue = badgeValue;
      return tab;
    });
  });
  const componentsToRender = $derived(getComponentOrder(tabs));
  let currentTab = $derived(tabs[0].value);

  function onEdraUpdate(content: string) {
    console.log('content updated:', content);

    if (mode === MODES.view) return;

    $lessonByTranslation[lessonId][$lesson.locale] = content;

    try {
      localStorage.setItem(`lesson-${lessonId}-${$lesson.locale}`, content);
    } catch (error) {
      console.error('Error saving lesson note to localStorage', error);
    }

    $isLessonDirty = true;
  }

  const onChange = (tab) => {
    return () => {
      currentTab = tab;
    };
  };

  const getValue = (label: string) => {
    const tabValue = tabs.find((tab) => tab.label === label)?.value;
    return tabValue;
  };

  async function saveOrUpdateTranslation(locale, lessonId) {
    const content = $lessonByTranslation[lessonId][locale];

    if (typeof localeExists[locale] === 'undefined') {
      const { data } = await supabase
        .from('lesson_language')
        .select(`id`)
        .eq('lesson_id', lessonId)
        .eq('locale', locale)
        .maybeSingle();

      localeExists[locale] = !!(data && data?.id);
    }

    if (localeExists[locale]) {
      const { error: updateError } = await supabase
        .from('lesson_language')
        .update({ content })
        .eq('lesson_id', lessonId)
        .eq('locale', locale);

      if (updateError) {
        console.error('Error updating translation:', updateError.message);
        snackbar.error('snackbar.materials.update_translations');
      }
    } else {
      const { error: insertError } = await supabase.from('lesson_language').insert({
        locale,
        lesson_id: lessonId,
        content
      });

      if (insertError) {
        console.error('Error inserting translation:', insertError.message);
        snackbar.error('snackbar.materials.creating_new');
        return;
      }

      localeExists[locale] = true;
    }
  }

  async function saveLesson(materials?: LessonPage['materials']) {
    const _lesson = materials
      ? {
          ...$lesson,
          materials
        }
      : $lesson;

    console.log('updating lesson');
    const [lessonRes] = await Promise.all([
      handleUpdateLessonMaterials(_lesson, lessonId),
      saveOrUpdateTranslation($lesson.locale, lessonId)
    ]);

    return lessonRes;
  }

  function isMaterialsEmpty(materials: LessonPage['materials'], translation: Record<LOCALE, string>) {
    const { slide_url, videos, note, documents } = materials;

    return (
      isHtmlValueEmpty(note) &&
      !slide_url &&
      isEmpty(videos) &&
      isEmpty(documents) &&
      Object.values(translation || {}).every((t) => isHtmlValueEmpty(t))
    );
  }

  function handleSave(prevMode: string) {
    untrack(() => {
      if (prevMode === MODES.edit) {
        saveLesson();
      }
    });
  }

  const openAddVideoModal = () => {
    $lessonVideoUpload.isModalOpen = true;
  };

  // const { input, handleSubmit, completion, isLoading } = useCompletion({
  //   api: '/api/completion'
  // });

  // function updateNoteByCompletion(completion: string) {
  // if (!completion) return;
  // if ($lessonByTranslation[lessonId]) {
  //   $lessonByTranslation[lessonId][$lesson.locale] = `${prevContent}${completion}`;
  // }
  // autoSave($lesson.materials, $lessonByTranslation[lessonId], false, lessonId);
  // if (editorInstance && editorInstance.view) {
  //   try {
  //     // For TipTap editor, we can use the editor's commands to scroll
  //     const { view } = editorInstance;
  //     const { state } = view;
  //     const endPos = state.doc.content.size;
  //     // Move cursor to end and scroll into view
  //     editorInstance.commands.setTextSelection(endPos);
  //     editorInstance.commands.scrollIntoView();
  //     // Alternative: Focus the editor
  //     editorInstance.commands.focus();
  //   } catch (error) {
  //     console.warn('Error scrolling editor:', error);
  //   }
  // }
  // }

  function callAI(_type = '') {
    // prevContent = $lessonByTranslation[lessonId]?.[$lesson.locale] || '';
    // const _lesson = $lessons.find((les) => les.id === $lesson.id);
    // $input = JSON.stringify({
    //   _type,
    //   lessonTitle: _lesson?.title || '',
    //   courseTitle: $course.title,
    //   locale: $lesson.locale
    // });
    // setTimeout(() => {
    //   handleSubmit({ preventDefault: () => {} });
    // }, 500);
  }

  function initPlyr(_player: any, _video: LessonPage['materials']['videos']) {
    if (!_player) return;

    const players = Array.from(document.querySelectorAll('.plyr-video-trigger')).map((p) => {
      // @ts-ignore
      return new Plyr(p);
    });

    // @ts-ignore
    window.players = players;
  }

  function autoSave(
    updatedMaterials: LessonPage['materials'],
    _translation: Record<LOCALE, string>,
    _isLoading?: boolean,
    _lessonId?: string
  ) {
    if (mode === MODES.view) return;

    if (timeoutId) clearTimeout(timeoutId);

    untrack(() => {
      isSaving = true;
      timeoutId = setTimeout(async () => {
        const { error } = await saveLesson(updatedMaterials);

        if (error) {
          console.error('error saving lesson', error);
          snackbar.error('snackbar.materials.apology');
        }
        isSaving = false;
      }, 1000);
    });
  }

  const onClose = () => {
    if ($lessonVideoUpload.isUploading) return;

    $lessonVideoUpload.isModalOpen = false;
    autoSave($lesson.materials, $lessonByTranslation[lessonId], $isLoading, lessonId);
  };

  const onDocumentClose = () => {
    if ($lessonDocUpload.isUploading) return;

    $lessonDocUpload.isModalOpen = false;
    // Clear any error messages when modal closes
    $lessonDocUpload.error = null;
    autoSave($lesson.materials, $lessonByTranslation[lessonId], $isLoading, lessonId);
  };

  function getComponentOrder(tabs = CONSTANTS.tabs) {
    const componentMap = {
      '1': ComponentNote,
      '2': ComponentSlide,
      '3': ComponentVideo,
      '4': ComponentDocument
    };

    const componentNames = tabs
      .map((tab) => {
        const component = componentMap[tab.value];
        return component || null;
      })
      .filter(Boolean);

    return componentNames;
  }

  $effect(() => {
    console.log('autoSaving...');
    autoSave($lesson.materials, $lessonByTranslation[lessonId], $isLoading, lessonId);
  });

  $effect(() => {
    console.log('handleSave...');
    handleSave(prevMode);
  });

  // $effect(() => {
  //   updateNoteByCompletion($completion);
  // });

  $effect(() => {
    initPlyr(player, $lesson.materials.videos);
  });

  let _editorValue = $derived(
    lessonFallbackNote($lesson.materials.note, $lessonByTranslation[lessonId], $lesson.locale)
  );
</script>

<Modal
  {onClose}
  bind:open={$lessonVideoUpload.isModalOpen}
  width="w-4/5 w-[90%] h-[80%] md:h-[566px]"
  modalHeading={$t('course.navItem.lessons.materials.tabs.video.add_video.title')}
>
  <AddVideoToLesson {lessonId} />
</Modal>

<Modal
  onClose={onDocumentClose}
  bind:open={$lessonDocUpload.isModalOpen}
  width="w-4/5 w-[90%] h-[80%] md:h-[566px]"
  modalHeading={$t('course.navItem.lessons.materials.tabs.document.upload_title')}
>
  <AddDocumentToLesson />
</Modal>

<HtmlRender className="m-auto text-center">
  <h1 class="mt-0 text-2xl capitalize md:text-4xl">
    {lessonTitle}
  </h1>
</HtmlRender>

{#if $lesson.isFetching}
  <Loader />
{:else if mode === MODES.edit}
  <Tabs {tabs} {currentTab} {onChange}>
    {#snippet content()}
      <slot:fragment>
        <TabContent value={getValue('course.navItem.lessons.materials.tabs.note.title')} index={currentTab}>
          <div class="flex justify-end gap-1">
            <!-- Update this when ai-sdk is updated -->
            <div bind:this={aiButtonRef} class="hidden flex-row-reverse">
              <PrimaryButton
                className="flex items-center relative"
                onClick={() => {
                  openPopover = !openPopover;
                }}
                isLoading={$isLoading}
                isDisabled={$isLoading}
                variant={VARIANTS.OUTLINED}
                disableScale
              >
                <WandSparklesIcon size={16} />
                AI
                <Popover
                  caret
                  align="left"
                  bind:open={openPopover}
                  on:click:outside={({ detail }) => {
                    openPopover = aiButtonRef?.contains(detail.target) || false;
                  }}
                >
                  <div class="p-2">
                    <button class={aiButtonClass} onclick={() => callAI('outline')}>
                      <ListChecksIcon size={16} />
                      {$t('course.navItem.lessons.materials.tabs.note.ai.outline')}
                    </button>
                    <button class={aiButtonClass} onclick={() => callAI('note')}>
                      <NotepadTextIcon size={16} />
                      {$t('course.navItem.lessons.materials.tabs.note.ai.note')}
                    </button>
                    <button class={aiButtonClass} onclick={() => callAI('activities')}>
                      <ListTodoIcon size={16} />
                      {$t('course.navItem.lessons.materials.tabs.note.ai.activities')}
                    </button>
                  </div>
                </Popover>
              </PrimaryButton>
            </div>
          </div>

          <div class="mt-5 h-[60vh]">
            <TextEditor
              content={_editorValue}
              onChange={(content) => onEdraUpdate(content)}
              onReady={(editor) => {
                editorInstance = editor;
                editorWindowRef = editor.view.dom.ownerDocument.defaultView;
              }}
              placeholder={$t('course.navItem.lessons.materials.tabs.note.placeholder')}
            />
          </div>
        </TabContent>

        <TabContent value={getValue('course.navItem.lessons.materials.tabs.slide.title')} index={currentTab}>
          {#if mode === MODES.edit}
            <TextField
              label={$t('course.navItem.lessons.materials.tabs.slide.slide_link')}
              bind:value={$lesson.materials.slide_url}
              onInputChange={() => ($isLessonDirty = true)}
              helperMessage={$t('course.navItem.lessons.materials.tabs.slide.helper_message')}
            />
          {/if}
        </TabContent>
        <TabContent value={getValue('course.navItem.lessons.materials.tabs.video.title')} index={currentTab}>
          <PrimaryButton
            label={$t('course.navItem.lessons.materials.tabs.video.button')}
            onClick={openAddVideoModal}
            className="mb-2"
          />
          {#if $lesson.materials.videos.length}
            <div class="flex h-full w-full flex-col items-start">
              {#each $lesson.materials.videos as video, index}
                {#if mode === MODES.edit}
                  <div class="ml-auto">
                    <IconButton value="delete-video" contained={true} onClick={() => deleteLessonVideo(index)}>
                      <TrashIcon size={16} />
                    </IconButton>
                  </div>
                {/if}
                <div class="flex h-full w-full flex-col gap-2 overflow-hidden">
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
                        ></iframe>
                      {:else if video.type === 'generic'}
                        <iframe
                          width="100%"
                          height="569"
                          class="iframe"
                          src={video.link}
                          title="Embeded Video player"
                          frameborder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowfullscreen
                        ></iframe>
                      {:else if video.metadata?.svid}
                        <div style="position:relative;padding-bottom:51.416579%">
                          <iframe
                            src="https://muse.ai/embed/{video.metadata
                              ?.svid}?logo=https://app.classroomio.com/logo-512.png&subtitles=auto&cover_play_position=center"
                            style="width:100%;height:100%;position:absolute;left:0;top:0"
                            frameborder="0"
                            allowfullscreen
                            title="Muse AI Video Embed"
                          ></iframe>
                        </div>
                      {:else}
                        <video
                          bind:this={player}
                          class="plyr-video-trigger"
                          style="max-height: 569px;"
                          playsinline
                          controls
                        >
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
        <TabContent value={getValue('course.navItem.lessons.materials.tabs.document.title')} index={currentTab}>
          <ComponentDocument {mode} />
        </TabContent>
      </slot:fragment>
    {/snippet}
  </Tabs>
{:else if !isMaterialsEmpty($lesson.materials, $lessonByTranslation[lessonId])}
  {#key lessonId}
    <div class="mb-20 flex w-full flex-col gap-6" in:fade={{ delay: 500 }} out:fade>
      {#each componentsToRender as Component}
        <Component {lessonId} />
      {/each}

      {#if $currentOrg.customization.apps.comments}
        <hr class="my-5" />
        <Comments {lessonId} />
      {/if}
    </div>
  {/key}
{:else}
  <Box className="text-center">
    <img src="/no-video.svg" alt="Video not found" />
    <h3 class="py-2 text-xl font-normal dark:text-white">
      {$t('course.navItem.lessons.materials.body_heading')}
    </h3>

    {#if !isStudent}
      <p class="py-2 text-center text-sm font-normal">
        {$t('course.navItem.lessons.materials.body_content')}
        <strong>{$t('course.navItem.lessons.materials.get_started')}</strong>
        {$t('course.navItem.lessons.materials.button')}.
      </p>
      <PrimaryButton
        label={$t('course.navItem.lessons.materials.get_started')}
        className="rounded-md"
        onClick={toggleMode}
      />
    {/if}
  </Box>
{/if}
