<script lang="ts">
  import { untrack } from 'svelte';
  import isEmpty from 'lodash/isEmpty';
  import { writable } from 'svelte/store';
  import { fade } from 'svelte/transition';
  import * as Popover from '@cio/ui/base/popover';

  import TrashIcon from '@lucide/svelte/icons/trash';
  import ListTodoIcon from '@lucide/svelte/icons/list-todo';
  import ListChecksIcon from '@lucide/svelte/icons/list-checks';
  import NotepadTextIcon from '@lucide/svelte/icons/notepad-text';
  import WandSparklesIcon from '@lucide/svelte/icons/wand-sparkles';

  import * as CONSTANTS from './constants';
  import { orderedTabs } from './constants';
  import MODES from '$lib/utils/constants/mode';
  import { currentOrg } from '$lib/utils/store/org';
  import type { Content } from '@cio/ui/custom/editor';
  import { courseApi, lessonApi } from '$features/course/api';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { lessonVideoUpload, lessonDocUpload } from '$features/course/components/lesson/store/lessons';
  import type { Lesson } from '$features/course/utils/types';
  import { formatYoutubeVideo } from '$lib/utils/functions/formatYoutubeVideo';
  import { Button } from '@cio/ui/base/button';
  import { Chip } from '@cio/ui/custom/chip';
  import Loader from './loader.svelte';
  import Comments from './components/comments.svelte';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { Empty } from '@cio/ui/custom/empty';
  import VideoIcon from '@lucide/svelte/icons/video';
  import * as Dialog from '@cio/ui/base/dialog';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { InputField } from '@cio/ui/custom/input-field';
  import ComponentNote from './components/component-note.svelte';
  import ComponentSlide from './components/component-slide.svelte';
  import ComponentVideo from './components/component-video.svelte';
  import { TextEditor, HTMLRender } from '$features/ui';
  import ComponentDocument from './components/component-document.svelte';
  import AddVideoToLesson from './video/add-video-to-lesson.svelte';
  import AddDocumentToLesson from '$features/course/components/lesson/materials/document/add-document-to-lesson.svelte';
  import type { TLocale } from '@cio/db/types';
  import { t } from '$lib/utils/functions/translations';

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
  let aiButtonClass =
    'flex items-center px-5 py-2 border border-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md w-full mb-2';
  let localeExists: Record<string, boolean> = {};
  // let prevContent = '';
  let timeoutId: NodeJS.Timeout;
  let errors: Record<string, string> = {};
  // let editorWindowRef: Window | undefined = $state();
  // let editorInstance = $state<Editor>(); // Add proper typing
  ('flex items-center gap-2 px-5 py-2 border border-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md w-full mb-2');

  let isLoading = writable(false);
  const lessonTitle = $derived(lessonApi.lesson?.title || '');
  const tabs = $derived.by(() => {
    const ordered = orderedTabs(CONSTANTS.tabs, courseApi.course?.metadata?.lessonTabsOrder);
    const content = lessonApi.translations[lessonId]?.[lessonApi.currentLocale] || '';

    const slideUrl = lessonApi.lesson?.slideUrl || '';
    const videos = lessonApi.lesson?.videos || [];
    const note = lessonApi.lesson?.note || '';
    const documents = lessonApi.lesson?.documents || [];

    return ordered.map((tab) => {
      let badgeValue = 0;

      if (tab.value === 1 && (!isHtmlValueEmpty(note) || !isHtmlValueEmpty(content))) {
        badgeValue = 1;
      } else if (tab.value === 2 && !!slideUrl) {
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
  let currentTab = $state<string>('');

  function onEditorChange(content: Content) {
    console.log('content updated:', content);

    if (mode === MODES.view) return;

    if (!lessonApi.translations[lessonId]) {
      lessonApi.translations[lessonId] = {} as Record<TLocale, string>;
    }
    lessonApi.translations[lessonId][lessonApi.currentLocale] = `${content}`;

    try {
      localStorage.setItem(`lesson-${lessonId}-${lessonApi.currentLocale}`, `${content}`);
    } catch (error) {
      console.error('Error saving lesson note to localStorage', error);
    }

    lessonApi.isDirty = true;
  }

  $effect(() => {
    if (tabs.length > 0 && !currentTab) {
      currentTab = String(tabs[0].value);
    }
  });

  const getValue = (label: string) => {
    const tabValue = tabs.find((tab) => tab.label === label)?.value;
    return tabValue;
  };

  async function saveOrUpdateTranslation(locale, lessonId) {
    const content = lessonApi.translations[lessonId]?.[locale] || '';

    if (!courseApi.course?.id) return;

    // Use API to upsert lesson language (creates if doesn't exist, updates if exists)
    await lessonApi.upsertLanguage(courseApi.course.id, lessonId, locale, content);

    if (lessonApi.success) {
      localeExists[locale] = true;
    }
  }

  async function saveLesson() {
    if (!lessonApi.lesson) return false;

    console.log('updating lesson');
    await Promise.all([
      lessonApi.update(courseApi.course?.id || '', lessonId, {
        note: lessonApi.lesson.note || undefined,
        slideUrl: lessonApi.lesson.slideUrl || undefined,
        videos: lessonApi.lesson.videos || [],
        documents: lessonApi.lesson.documents || []
      }),

      saveOrUpdateTranslation(lessonApi.currentLocale, lessonId)
    ]);
  }

  function isMaterialsEmpty(
    materials: { slide_url?: string; videos?: any[]; note?: string; documents?: any[] },
    translation: Record<TLocale, string>
  ) {
    const { slide_url, videos, note, documents } = materials;

    return (
      isHtmlValueEmpty(note || '') &&
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

  function initPlyr(_player: any, _video: Lesson['videos']) {
    if (!_player) return;

    const players = Array.from(document.querySelectorAll('.plyr-video-trigger')).map((p) => {
      // @ts-ignore
      return new Plyr(p);
    });

    // @ts-ignore
    window.players = players;
  }

  function autoSave(
    _updatedMaterials: Partial<Lesson>,
    _translation: Record<TLocale, string>,
    _isLoading?: boolean,
    _lessonId?: string
  ) {
    if (mode === MODES.view) return;

    if (timeoutId) clearTimeout(timeoutId);

    untrack(() => {
      isSaving = true;
      timeoutId = setTimeout(async () => {
        await saveLesson();

        isSaving = false;
      }, 1000);
    });
  }

  const onClose = () => {
    if ($lessonVideoUpload.isUploading) return;

    $lessonVideoUpload.isModalOpen = false;
    if (lessonApi.lesson) {
      autoSave(
        {
          note: lessonApi.lesson.note || '',
          slideUrl: lessonApi.lesson.slideUrl || '',
          videos: lessonApi.lesson.videos || [],
          documents: lessonApi.lesson.documents || []
        },
        lessonApi.translations[lessonId] || {},
        $isLoading,
        lessonId
      );
    }
  };

  const onDocumentClose = () => {
    if ($lessonDocUpload.isUploading) return;

    $lessonDocUpload.isModalOpen = false;
    // Clear any error messages when modal closes
    $lessonDocUpload.error = null;
    if (lessonApi.lesson) {
      autoSave(
        {
          note: lessonApi.lesson.note || '',
          slideUrl: lessonApi.lesson.slideUrl || '',
          videos: lessonApi.lesson.videos || [],
          documents: lessonApi.lesson.documents || []
        },
        lessonApi.translations[lessonId] || {},
        $isLoading,
        lessonId
      );
    }
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
    if (lessonApi.lesson) {
      autoSave(
        {
          note: lessonApi.lesson.note || '',
          slideUrl: lessonApi.lesson.slideUrl || '',
          videos: lessonApi.lesson.videos || [],
          documents: lessonApi.lesson.documents || []
        },
        lessonApi.translations[lessonId] || {},
        $isLoading,
        lessonId
      );
    }
  });

  $effect(() => {
    console.log('handleSave...');
    handleSave(prevMode);
  });

  // $effect(() => {
  //   updateNoteByCompletion($completion);
  // });

  let player = $state<HTMLVideoElement | null>(null);
  $effect(() => {
    if (lessonApi.lesson?.videos) {
      initPlyr(player, lessonApi.lesson.videos);
    }
  });
</script>

<Dialog.Root
  bind:open={$lessonVideoUpload.isModalOpen}
  onOpenChange={(isOpen) => {
    if (!isOpen) onClose();
  }}
>
  <Dialog.Content class="h-[80%] w-[90%] max-w-4/5 md:h-[566px]">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.lessons.materials.tabs.video.add_video.title')}</Dialog.Title>
    </Dialog.Header>
    <AddVideoToLesson {lessonId} />
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root
  bind:open={$lessonDocUpload.isModalOpen}
  onOpenChange={(isOpen) => {
    if (!isOpen) onDocumentClose();
  }}
>
  <Dialog.Content class="h-[80%] w-[90%] max-w-4/5 md:h-[566px]">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.lessons.materials.tabs.document.upload_title')}</Dialog.Title>
    </Dialog.Header>
    <AddDocumentToLesson />
  </Dialog.Content>
</Dialog.Root>

<HTMLRender className="m-auto text-center">
  <h1 class="mt-0 text-2xl capitalize md:text-4xl">
    {lessonTitle}
  </h1>
</HTMLRender>

{#if lessonApi.isLoading}
  <Loader />
{:else if mode === MODES.edit}
  <UnderlineTabs.Root bind:value={currentTab}>
    <UnderlineTabs.List>
      {#each tabs as tab}
        <UnderlineTabs.Trigger value={String(tab.value)}>
          {#if tab.icon}
            <tab.icon size={16} />
          {/if}
          {$t(tab.label)}
          {#if typeof tab.badgeValue === 'number' && tab.badgeValue > 0}
            <Chip value={`${tab.badgeValue}`} className="ml-1" />
          {/if}
        </UnderlineTabs.Trigger>
      {/each}
    </UnderlineTabs.List>
    <UnderlineTabs.Content value={String(getValue('course.navItem.lessons.materials.tabs.note.title') || '')}>
      <div class="flex justify-end gap-1">
        <!-- Update this when ai-sdk is updated -->
        <div class="hidden flex-row-reverse">
          <Popover.Root>
            <Popover.Trigger>
              <Button
                variant="outline"
                onclick={() => {
                  openPopover = !openPopover;
                }}
                loading={$isLoading}
                disabled={$isLoading}
              >
                <WandSparklesIcon size={16} />
                AI
              </Button>
            </Popover.Trigger>
            <Popover.Content align="start" class="w-80">
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
            </Popover.Content>
          </Popover.Root>
        </div>
      </div>

      <div class="mt-5 h-[60vh]">
        <TextEditor
          content={lessonApi.note}
          onChange={(content) => onEditorChange(content)}
          onReady={() =>
            // editor
            {
              // editorInstance = editor;
              // editorWindowRef = editor.view.dom.ownerDocument.defaultView;
            }}
          placeholder={$t('course.navItem.lessons.materials.tabs.note.placeholder')}
        />
      </div>
    </UnderlineTabs.Content>

    <UnderlineTabs.Content value={String(getValue('course.navItem.lessons.materials.tabs.slide.title') || '')}>
      {#if mode === MODES.edit}
        {@const slideUrlValue = lessonApi.lesson?.slideUrl || ''}
        <InputField
          label={$t('course.navItem.lessons.materials.tabs.slide.slide_link')}
          value={slideUrlValue}
          onInputChange={(e) => {
            lessonApi.updateLessonState('slideUrl', e.currentTarget.value);
          }}
          helperMessage={$t('course.navItem.lessons.materials.tabs.slide.helper_message')}
        />
      {/if}
    </UnderlineTabs.Content>
    <UnderlineTabs.Content value={String(getValue('course.navItem.lessons.materials.tabs.video.title') || '')}>
      <Button onclick={openAddVideoModal} class="mb-2">
        {$t('course.navItem.lessons.materials.tabs.video.button')}
      </Button>
      {#if lessonApi.lesson?.videos && lessonApi.lesson.videos.length}
        <div class="flex h-full w-full flex-col items-start">
          {#each lessonApi.lesson.videos as video, index}
            {#if mode === MODES.edit}
              <div class="ml-auto">
                <IconButton onclick={() => lessonApi.deleteLessonVideo(index)}>
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
    </UnderlineTabs.Content>
    <UnderlineTabs.Content value={String(getValue('course.navItem.lessons.materials.tabs.document.title') || '')}>
      <ComponentDocument {mode} />
    </UnderlineTabs.Content>
  </UnderlineTabs.Root>
{:else if lessonApi.lesson && !isMaterialsEmpty({ note: lessonApi.lesson.note || '', slide_url: lessonApi.lesson.slideUrl || '', videos: lessonApi.lesson.videos || [], documents: lessonApi.lesson.documents || [] }, lessonApi.translations[lessonId] || {})}
  {#key lessonId}
    <div class="mb-20 flex w-full flex-col gap-6" in:fade={{ delay: 500 }} out:fade>
      {#each componentsToRender as Component}
        <Component {lessonId} />
      {/each}

      {#if $currentOrg.customization?.apps?.comments}
        <hr class="my-5" />

        <Comments {lessonId} />
      {/if}
    </div>
  {/key}
{:else}
  <Empty
    title={$t('course.navItem.lessons.materials.body_heading')}
    description={$t('course.navItem.lessons.materials.body_content') +
      ' ' +
      $t('course.navItem.lessons.materials.get_started') +
      ' ' +
      $t('course.navItem.lessons.materials.button') +
      '.'}
    icon={VideoIcon}
    variant="page"
    class="text-center"
  >
    {#if !isStudent}
      <Button onclick={toggleMode}>
        {$t('course.navItem.lessons.materials.get_started')}
      </Button>
    {/if}
  </Empty>
{/if}
