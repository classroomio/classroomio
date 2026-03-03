<script lang="ts">
  import type {
    ExerciseAnswerValue,
    ExerciseQuestionModel,
    ExerciseQuestionRenderContract,
    ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { getExerciseQuestionLabel } from '@cio/question-types';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import XIcon from '@lucide/svelte/icons/x';
  import * as Dialog from '../../base/dialog';
  import * as DropdownMenu from '../../base/dropdown-menu';
  import { Input } from '../../base/input';
  import { Textarea } from '../../base/textarea';
  import { IconButton } from '../icon-button';
  import { MediaPlayer, isYoutubeUrl } from '../media-player';
  import QuestionTitle from './question-title.svelte';
  import { YoutubeLinkForm } from '../youtube-link-form';
  import QuestionSurface from './question-surface.svelte';
  import { getExerciseQuestionRenderer } from './renderer-contract';
  import type { Snippet } from 'svelte';

  interface Props {
    contract: ExerciseQuestionRenderContract;
    onAnswerChange?: (answer: ExerciseAnswerValue) => void;
    onQuestionChange?: (question: ExerciseQuestionRendererProps['question']) => void;
    showContainer?: boolean;
    questionTypeSelect?: Snippet;
  }

  let {
    contract,
    onAnswerChange = () => {},
    onQuestionChange = () => {},
    showContainer = true,
    questionTypeSelect
  }: Props = $props();

  const Renderer = $derived(getExerciseQuestionRenderer(contract.question.questionType, contract.mode));
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(contract.labels, key, fallback);

  let imageFileInput = $state<HTMLInputElement | null>(null);
  let isImageUploading = $state(false);
  let imageUploadError = $state('');
  let isDescriptionEditorVisible = $state(false);
  let isYoutubeDialogOpen = $state(false);

  const questionDescription = $derived(String((contract.question.settings?.description as string | undefined) ?? ''));
  const hasDescription = $derived(isDescriptionEditorVisible || questionDescription.trim().length > 0);
  const questionImageUrls = $derived.by(() => {
    const settings = contract.question.settings ?? {};

    const explicitImageUrls = Array.isArray(settings.imageUrls)
      ? settings.imageUrls.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      : [];

    if (explicitImageUrls.length > 0) return explicitImageUrls;

    const legacyImageUrl = settings.imageUrl;
    if (typeof legacyImageUrl === 'string' && legacyImageUrl.trim().length > 0) return [legacyImageUrl];

    return [] as string[];
  });
  const questionVideoUrls = $derived.by(() => {
    const settings = contract.question.settings ?? {};

    const explicitVideoUrls = Array.isArray(settings.videoUrls)
      ? settings.videoUrls.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      : [];

    if (explicitVideoUrls.length > 0) return explicitVideoUrls;

    const legacyVideoUrl = settings.videoUrl;
    if (typeof legacyVideoUrl === 'string' && legacyVideoUrl.trim().length > 0) return [legacyVideoUrl];

    return [] as string[];
  });
  const questionVideos = $derived.by(() =>
    questionVideoUrls
      .map((videoUrl, index) => {
        const sourceUrl = videoUrl.trim();
        return sourceUrl.length > 0
          ? {
              key: `${sourceUrl}-${index}`,
              sourceIndex: index,
              sourceUrl
            }
          : null;
      })
      .filter((entry): entry is { key: string; sourceIndex: number; sourceUrl: string } =>
        Boolean(entry && isYoutubeUrl(entry.sourceUrl))
      )
  );

  $effect(() => {
    if (questionDescription.trim().length > 0) {
      isDescriptionEditorVisible = true;
    }
  });

  function patchQuestion(partial: Partial<ExerciseQuestionModel>) {
    onQuestionChange({ ...contract.question, ...partial });
  }

  function patchSettings(next: Record<string, unknown>) {
    patchQuestion({
      settings: {
        ...(contract.question.settings ?? {}),
        ...next
      }
    });
  }

  function setQuestionDescription(nextDescription: string | null) {
    const nextSettings = { ...(contract.question.settings ?? {}) } as Record<string, unknown>;

    if (nextDescription === null) {
      delete nextSettings.description;
    } else {
      nextSettings.description = nextDescription;
    }

    patchQuestion({
      settings: nextSettings
    });
  }

  function setQuestionImageUrls(nextUrls: string[]) {
    const deduped = Array.from(new Set(nextUrls.map((value) => value.trim()).filter(Boolean)));
    const nextSettings = {
      ...(contract.question.settings ?? {}),
      imageUrls: deduped
    } as Record<string, unknown>;

    delete nextSettings.imageUrl;

    patchQuestion({
      settings: nextSettings
    });
  }

  function setQuestionVideoUrls(nextUrls: string[]) {
    const deduped = Array.from(new Set(nextUrls.map((value) => value.trim()).filter(Boolean)));
    const nextSettings = {
      ...(contract.question.settings ?? {}),
      videoUrls: deduped
    } as Record<string, unknown>;

    delete nextSettings.videoUrl;

    patchQuestion({
      settings: nextSettings
    });
  }

  function openImagePicker() {
    if (contract.disabled || isImageUploading) return;
    imageFileInput?.click();
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (!reader.result) {
          reject(new Error('Failed to read image file'));
          return;
        }

        resolve(String(reader.result));
      };

      reader.onerror = () => {
        reject(reader.error ?? new Error('Failed to read image file'));
      };

      reader.readAsDataURL(file);
    });
  }

  async function uploadQuestionImage(file: File): Promise<string> {
    if (contract.onImageUpload) {
      return contract.onImageUpload(file);
    }

    return fileToDataUrl(file);
  }

  async function handleImageFileSelection(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const selectedFiles = Array.from(input.files ?? []);
    input.value = '';

    if (!selectedFiles.length) return;

    const validFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));
    if (!validFiles.length) {
      imageUploadError = label('question.edit.upload_error_only_images');
      return;
    }

    imageUploadError = '';
    isImageUploading = true;

    try {
      const uploadedUrls: string[] = [];

      for (const file of validFiles) {
        const uploadedUrl = await uploadQuestionImage(file);
        if (!uploadedUrl) continue;
        uploadedUrls.push(uploadedUrl);
      }

      if (uploadedUrls.length > 0) {
        setQuestionImageUrls([...questionImageUrls, ...uploadedUrls]);
      }

      if (validFiles.length !== selectedFiles.length) {
        imageUploadError = label('question.edit.upload_error_skipped');
      }
    } catch (error) {
      imageUploadError = label('question.edit.upload_error_failed');
      console.error('Failed to upload question image:', error);
    } finally {
      isImageUploading = false;
    }
  }

  function removeImage(imageIndex: number) {
    setQuestionImageUrls(questionImageUrls.filter((_, index) => index !== imageIndex));
    imageUploadError = '';
  }

  function onDescriptionAction() {
    if (contract.disabled) return;

    if (hasDescription) {
      isDescriptionEditorVisible = false;
      setQuestionDescription(null);
      return;
    }

    isDescriptionEditorVisible = true;
    setQuestionDescription(questionDescription);
  }

  function openYoutubeDialog() {
    if (contract.disabled) return;
    isYoutubeDialogOpen = true;
  }

  async function addYoutubeVideos(links: string[]) {
    if (!links.length) return;
    setQuestionVideoUrls([...questionVideoUrls, ...links]);
    isYoutubeDialogOpen = false;
  }

  function removeVideo(videoIndex: number) {
    setQuestionVideoUrls(questionVideoUrls.filter((_, index) => index !== videoIndex));
  }
</script>

{#snippet content()}
  {#if contract.mode === 'edit'}
    <div class="ui:space-y-3">
      <div class="ui:flex ui:items-end ui:gap-2">
        <div class="ui:space-y-1 ui:w-full">
          <p class="ui:text-sm ui:font-medium">{label('question.edit.title_label')}</p>
          <Input
            class="ui:w-full"
            value={contract.question.title}
            placeholder={label('question.edit.title_placeholder')}
            disabled={contract.disabled}
            onchange={(event) => patchQuestion({ title: event.currentTarget.value })}
          />
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger disabled={contract.disabled}>
            {#snippet child({ props })}
              <IconButton {...props} type="button" disabled={contract.disabled}>
                <PlusIcon class="ui:size-4" />
                <span class="ui:sr-only">{label('question.edit.media_menu_sr')}</span>
              </IconButton>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item disabled={contract.disabled} onclick={onDescriptionAction}>
              {hasDescription ? label('question.edit.remove_description') : label('question.edit.add_description')}
            </DropdownMenu.Item>
            <DropdownMenu.Item disabled={contract.disabled || isImageUploading} onclick={openImagePicker}>
              {label('question.edit.add_image')}
            </DropdownMenu.Item>
            <DropdownMenu.Item disabled={contract.disabled} onclick={openYoutubeDialog}>
              {label('question.edit.add_video')}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        {#if questionTypeSelect}
          {@render questionTypeSelect()}
        {/if}
      </div>

      {#if hasDescription}
        <div class="ui:space-y-1">
          <p class="ui:text-sm ui:font-medium">{label('question.edit.description_label')}</p>
          <Textarea
            rows={2}
            value={questionDescription}
            placeholder={label('question.edit.description_placeholder')}
            disabled={contract.disabled}
            onchange={(event) => patchSettings({ description: event.currentTarget.value })}
          />
        </div>
      {/if}

      <input
        bind:this={imageFileInput}
        type="file"
        accept="image/*"
        multiple
        class="ui:hidden"
        disabled={contract.disabled || isImageUploading}
        onchange={handleImageFileSelection}
      />

      {#if imageUploadError || questionImageUrls.length > 0}
        <div class="ui:space-y-2">
          {#if imageUploadError}
            <p class="ui:text-destructive ui:text-xs">{imageUploadError}</p>
          {/if}

          {#if questionImageUrls.length > 0}
            <div class="ui:flex ui:flex-wrap ui:gap-3">
              {#each questionImageUrls as imageUrl, imageIndex (`${imageUrl}-${imageIndex}`)}
                <div class="ui:group ui:relative ui:h-40 ui:w-40 ui:rounded-md ui:border">
                  <div class="ui:absolute ui:inset-0 ui:overflow-hidden ui:rounded-md">
                    <img
                      src={imageUrl}
                      alt={label('question.edit.image_alt')}
                      class="ui:h-full ui:w-full ui:object-cover"
                    />
                  </div>
                  <IconButton
                    disabled={contract.disabled}
                    tooltipClass="ui:absolute ui:right-[-12px] ui:top-[-12px] ui:z-10"
                    class="ui:opacity-0 ui:transition-opacity ui:group-hover:opacity-100"
                    tooltip={label('question.edit.remove_image_tooltip')}
                    onclick={() => removeImage(imageIndex)}
                    size="icon-sm"
                  >
                    <XIcon />
                    <span class="ui:sr-only">{label('question.edit.remove_image_sr')}</span>
                  </IconButton>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      {#if questionVideos.length > 0}
        <div class="ui:space-y-3">
          {#each questionVideos as video (video.key)}
            <div class="ui:group ui:relative ui:max-w-xl ui:rounded-md ui:border">
              <MediaPlayer
                source={{
                  type: 'youtube',
                  url: video.sourceUrl
                }}
                options={{
                  maxHeight: '320px',
                  width: '100%',
                  controls: true,
                  playsinline: true
                }}
              />
              <IconButton
                disabled={contract.disabled}
                tooltipClass="ui:absolute ui:right-[-12px] ui:top-[-12px] ui:z-10"
                class="ui:opacity-0 ui:transition-opacity ui:group-hover:opacity-100"
                tooltip={label('question.edit.remove_video_tooltip')}
                onclick={() => removeVideo(video.sourceIndex)}
                size="icon-sm"
              >
                <XIcon />
                <span class="ui:sr-only">{label('question.edit.remove_video_sr')}</span>
              </IconButton>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <Dialog.Root bind:open={isYoutubeDialogOpen}>
      <Dialog.Content class="ui:max-w-xl">
        <Dialog.Header>
          <Dialog.Title>{label('question.edit.video_modal_title')}</Dialog.Title>
        </Dialog.Header>
        <YoutubeLinkForm
          inputLabel={label('question.edit.video_link_label')}
          inputPlaceholder={label('question.edit.video_link_placeholder')}
          addButtonLabel={label('question.edit.video_add_button')}
          invalidYoutubeMessage={label('question.edit.video_invalid_link')}
          disabled={contract.disabled}
          onSubmit={addYoutubeVideos}
        />
      </Dialog.Content>
    </Dialog.Root>
  {/if}

  {#if contract.mode !== 'edit'}
    <div class="ui:mb-4 ui:space-y-3">
      {#if contract.question.title.trim().length > 0}
        <QuestionTitle title={contract.question.title} />
      {/if}

      {#if questionDescription.trim().length > 0}
        <p class="ui:text-sm ui:text-muted-foreground">{questionDescription}</p>
      {/if}

      {#if questionImageUrls.length > 0}
        <div class="ui:flex ui:flex-wrap ui:gap-3">
          {#each questionImageUrls as imageUrl, imageIndex (`${imageUrl}-${imageIndex}`)}
            <div class="ui:h-40 ui:w-40 ui:overflow-hidden ui:rounded-md ui:border">
              <img src={imageUrl} alt={label('question.edit.image_alt')} class="ui:h-full ui:w-full ui:object-cover" />
            </div>
          {/each}
        </div>
      {/if}

      {#if questionVideos.length > 0}
        <div class="ui:space-y-3">
          {#each questionVideos as video (video.key)}
            <div class="ui:max-w-xl ui:overflow-hidden ui:rounded-md ui:border">
              <MediaPlayer
                source={{
                  type: 'youtube',
                  url: video.sourceUrl
                }}
                options={{
                  maxHeight: '320px',
                  width: '100%',
                  controls: true,
                  playsinline: true
                }}
              />
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <Renderer
    question={contract.question}
    answer={contract.answer}
    disabled={contract.disabled}
    labels={contract.labels}
    onImageUpload={contract.onImageUpload}
    onFileUpload={contract.onFileUpload}
    {onAnswerChange}
    {onQuestionChange}
  />
{/snippet}

{#if showContainer}
  <QuestionSurface>
    {@render content()}
  </QuestionSurface>
{:else}
  {@render content()}
{/if}
