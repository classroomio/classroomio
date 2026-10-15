<script lang="ts">
  /*
   * The Questions tab of the exercise page (apps/dashboard exercises/[exerciseId], Questions tab):
   * update-description.svelte + edit-mode.svelte + section-editor.svelte + order-modal.svelte +
   * question-type-select.svelte + question-container.svelte + delete-confirmation.svelte, with the real
   * `@cio/ui` ExerciseQuestion renderers. The dashboard versions read Svelte stores wired to the API; this
   * one keeps one `state` object and reports every change through `onChange`.
   */
  import { untrack } from 'svelte';
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import {
    QUESTION_TYPE_KEY,
    QUESTION_TYPE_REGISTRY,
    PREMIUM_QUESTION_TYPE_KEYS,
    resolveTrueFalseCorrectValue,
    syncTrueFalseOptions
  } from '@cio/question-types';
  import * as ExerciseQuestion from '$src/custom/exercise-question';
  import { Button } from '$src/base/button';
  import { Input } from '$src/base/input';
  import { Badge } from '$src/base/badge';
  import * as Dialog from '$src/base/dialog';
  import * as Select from '$src/base/select';
  import * as Tooltip from '$src/base/tooltip';
  import { IconButton } from '$src/custom/icon-button';
  import { NumberField } from '$src/custom/number-field';
  import { Editor } from '$src/custom/editor';
  import { SafeHtmlContent } from '$src/custom/safe-html-content';
  import { HoverableItem, MaximizeIcon, PremiumIcon } from '$src/custom/moving-icons';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import InfoIcon from '@lucide/svelte/icons/info';
  import XIcon from '@lucide/svelte/icons/x';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { t } from '$lib/utils/functions/translations';
  import { getExerciseQuestionLabels } from './shims/question-labels.generated';

  type Q = any;
  type Section = any;

  let {
    initial,
    mode = 'edit',
    isFreePlan = false,
    isPublicCourse = false,
    onChange,
    onUpgrade
  }: {
    initial: any;
    mode?: 'edit' | 'preview';
    isFreePlan?: boolean;
    isPublicCourse?: boolean;
    onChange?: (snapshot: any) => void;
    onUpgrade?: () => void;
  } = $props();

  const KEYS = 'course.navItem.lessons.exercises.all_exercises';
  const flipDurationMs = 200;
  const COLOR_THEMES = ['blue', 'green', 'amber', 'rose', 'violet', 'slate'];
  const COLOR_CLASSES: Record<string, string> = {
    blue: 'ui:bg-blue-500',
    green: 'ui:bg-emerald-500',
    amber: 'ui:bg-amber-500',
    rose: 'ui:bg-rose-500',
    violet: 'ui:bg-violet-500',
    slate: 'ui:bg-slate-500'
  };
  const BORDER_CLASSES: Record<string, string> = {
    blue: 'ui:border-blue-500',
    green: 'ui:border-emerald-500',
    amber: 'ui:border-amber-500',
    rose: 'ui:border-rose-500',
    violet: 'ui:border-violet-500',
    slate: 'ui:border-slate-500'
  };

  const TYPE_LABEL_KEYS: Record<string, string> = {
    [QUESTION_TYPE_KEY.RADIO]: 'single',
    [QUESTION_TYPE_KEY.CHECKBOX]: 'multiple',
    [QUESTION_TYPE_KEY.TEXTAREA]: 'paragraph',
    [QUESTION_TYPE_KEY.TRUE_FALSE]: 'true_false',
    [QUESTION_TYPE_KEY.THUMBS]: 'thumbs',
    [QUESTION_TYPE_KEY.SHORT_ANSWER]: 'short_answer',
    [QUESTION_TYPE_KEY.NUMERIC]: 'numeric',
    [QUESTION_TYPE_KEY.FILL_BLANK]: 'fill_blank',
    [QUESTION_TYPE_KEY.FILE_UPLOAD]: 'file_upload',
    [QUESTION_TYPE_KEY.MATCHING]: 'matching',
    [QUESTION_TYPE_KEY.ORDERING]: 'ordering',
    [QUESTION_TYPE_KEY.HOTSPOT]: 'hotspot',
    [QUESTION_TYPE_KEY.LINK]: 'link',
    [QUESTION_TYPE_KEY.WORD_BANK]: 'word_bank',
    [QUESTION_TYPE_KEY.STAR]: 'star',
    [QUESTION_TYPE_KEY.VIDEO_RECORDING]: 'video_recording'
  };

  const ALL_TYPES = QUESTION_TYPE_REGISTRY.filter((type) => !type.disabled);
  const OPTION_TYPES = new Set([
    QUESTION_TYPE_KEY.RADIO,
    QUESTION_TYPE_KEY.CHECKBOX,
    QUESTION_TYPE_KEY.TRUE_FALSE,
    QUESTION_TYPE_KEY.THUMBS
  ]);

  const labels = getExerciseQuestionLabels();

  let state = $state<any>(untrack(() => structuredClone(initial)));
  let errors = $state<Record<string, Record<string, string>>>({});
  let currentMode = $state<'edit' | 'preview'>(untrack(() => mode));
  let reorderQuestions = $state(false);
  let orderOpen = $state(false);
  let orderItems = $state<any[]>([]);
  let deleteDialog = $state<{ open: boolean; kind: 'question' | 'section'; id: string }>({
    open: false,
    kind: 'question',
    id: ''
  });
  let descriptionExpanded = $state(false);
  let reorderBySection = $state<Record<string, Q[]>>({});
  let counter = 0;

  const autoGradableLabel = (key: string) => t.get(`${KEYS}.edit_mode.${key}`);

  function typeLabel(type: any) {
    const key = TYPE_LABEL_KEYS[type?.key];
    if (!key) return t.get(`${KEYS}.edit_mode.select_type`);

    return t.get(`${KEYS}.edit_mode.question_types.${key}`);
  }

  function typeOf(question: Q) {
    return QUESTION_TYPE_REGISTRY.find((type) => type.key === question.questionType) ?? ALL_TYPES[0];
  }

  const availableTypes = $derived(isPublicCourse ? ALL_TYPES.filter((type) => type.autoGradable) : ALL_TYPES);
  const autoTypes = $derived(availableTypes.filter((type) => type.autoGradable));
  const manualTypes = $derived(availableTypes.filter((type) => !type.autoGradable));
  const activeSections = $derived<Section[]>(
    [...(state.sections ?? [])].filter((section) => !section.deletedAt).sort((a, b) => a.order - b.order)
  );
  const sectioned = $derived(activeSections.length > 0);
  const totalPoints = $derived(
    (state.questions ?? []).reduce((total: number, question: Q) => total + Number(question.points ?? 0), 0)
  );

  $effect(() => {
    const snapshot = $state.snapshot(state);
    untrack(() => onChange?.(snapshot));
  });

  function nextId(prefix: string) {
    counter += 1;

    return `${prefix}-${Date.now().toString(36)}${counter}`;
  }

  function questionsFor(sectionId: string) {
    return (state.questions ?? []).filter((question: Q) => question.exerciseSectionId === sectionId);
  }

  function elementId(prefix: string, id: string) {
    return `exercise-${prefix}-${id}`;
  }

  function scrollTo(id: string) {
    setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth', inline: 'nearest' }),
      30
    );
  }

  function newQuestion(sectionId: string | null): Q {
    return {
      id: nextId('q'),
      title: '',
      questionType: QUESTION_TYPE_KEY.RADIO,
      questionTypeId: 1,
      points: 1,
      required: true,
      settings: {},
      options: [{ id: nextId('o'), label: '', value: null, isCorrect: false }],
      exerciseSectionId: sectionId
    };
  }

  export function addQuestion(sectionId?: string | null) {
    currentMode = 'edit';
    const target = sectionId ?? (sectioned ? activeSections[0].id : null);
    const question = newQuestion(target);

    state.questions = [...state.questions, question];
    scrollTo(elementId('question', question.id));

    return question.id;
  }

  export function addSection() {
    currentMode = 'edit';
    const highestOrder = activeSections.reduce((highest, section) => Math.max(highest, section.order), -1);
    const loose = state.questions.filter((question: Q) => !question.exerciseSectionId);
    const sections = [...(state.sections ?? [])];
    let order = highestOrder + 1;

    if (loose.length > 0) {
      const untitled = {
        id: nextId('s'),
        title: 'Untitled section',
        description: null,
        order,
        colorTheme: 'blue',
        afterBehavior: { action: 'continue' }
      };

      order += 1;
      sections.push(untitled);
      state.questions = state.questions.map((question: Q) =>
        question.exerciseSectionId ? question : { ...question, exerciseSectionId: untitled.id }
      );
    }

    const displayNumber = activeSections.length + (loose.length > 0 ? 2 : 1);
    const section = {
      id: nextId('s'),
      title: `Section ${displayNumber}`,
      description: null,
      order,
      colorTheme: 'blue',
      afterBehavior: { action: 'continue' }
    };

    state.sections = [...sections, section];
    scrollTo(elementId('section', section.id));

    return section.id;
  }

  export function setMode(next: 'edit' | 'preview') {
    currentMode = next;
    reorderQuestions = false;
  }

  export function setReorder(value: boolean) {
    reorderQuestions = value && sectioned;
  }

  export function isSectioned() {
    return sectioned;
  }

  export function openOrder() {
    orderItems = (state.questions ?? []).map((question: Q) => ({
      id: question.id,
      name: question.title,
      type: question.questionTypeId
    }));
    orderOpen = true;
  }

  export function setErrors(next: Record<string, Record<string, string>>) {
    errors = next ?? {};
    const first = Object.keys(errors)[0];

    if (first) scrollTo(document.getElementById(elementId('question', first)) ? elementId('question', first) : elementId('section', first));
  }

  export function patch(partial: Record<string, unknown>) {
    Object.assign(state, partial);
  }

  function applyOrder(items: any[]) {
    const byId = new Map(items.map((item, index) => [String(item.id), index]));

    state.questions = [...state.questions].sort(
      (left: Q, right: Q) => (byId.get(String(left.id)) ?? 0) - (byId.get(String(right.id)) ?? 0)
    );
  }

  function closeOrder(open: boolean) {
    orderOpen = open;

    if (!open) applyOrder(orderItems);
  }

  function requestDelete(kind: 'question' | 'section', id: string) {
    deleteDialog = { open: true, kind, id };
  }

  function confirmDelete() {
    const { kind, id } = deleteDialog;

    deleteDialog = { open: false, kind: 'question', id: '' };

    if (kind === 'question') {
      state.questions = state.questions.filter((question: Q) => String(question.id) !== String(id));
      delete errors[id];

      return;
    }

    const index = activeSections.findIndex((section) => section.id === id);
    const nearest = activeSections[index + 1] ?? activeSections[index - 1];
    const remaining = activeSections.filter((section) => section.id !== id);

    state.questions = state.questions.map((question: Q) =>
      question.exerciseSectionId === id
        ? { ...question, exerciseSectionId: remaining.length === 0 ? null : nearest?.id }
        : question
    );
    state.sections = state.sections
      .filter((section: Section) => section.id !== id)
      .map((section: Section) =>
        section.afterBehavior?.action === 'go_to_section' && section.afterBehavior.exerciseSectionId === id
          ? { ...section, afterBehavior: { action: 'continue' } }
          : section
      );
  }

  function updateQuestion(id: string, mutate: (question: Q) => Q) {
    state.questions = state.questions.map((question: Q) =>
      String(question.id) === String(id) ? mutate(question) : question
    );
  }

  function trueFalseOptions(correct = true) {
    const stamp = Date.now();

    return [
      { id: `${stamp}-true`, label: 'True', value: 'true', isCorrect: correct },
      { id: `${stamp}-false`, label: 'False', value: 'false', isCorrect: !correct }
    ];
  }

  function onTypeChange(id: string, value: string) {
    const type = QUESTION_TYPE_REGISTRY.find((entry) => String(entry.id) === value);

    if (!type) return;

    updateQuestion(id, (current) => {
      let options = current.options ?? [];
      let settings = current.settings ?? {};

      if (type.key === QUESTION_TYPE_KEY.TRUE_FALSE) {
        const correctValue = settings.correctValue ?? true;

        settings = { ...settings, correctValue };
        options = trueFalseOptions(correctValue);
      } else if (type.key === QUESTION_TYPE_KEY.THUMBS) {
        const stamp = Date.now();

        options = [
          { id: `${stamp}-yes`, label: 'Yes', value: 'true', isCorrect: false },
          { id: `${stamp}-no`, label: 'No', value: 'false', isCorrect: false }
        ];
      } else if (OPTION_TYPES.has(type.key)) {
        if (!options.length) options = [{ id: nextId('o'), label: '', value: '', isCorrect: false }];
      } else {
        options = [];
      }

      if (type.key === QUESTION_TYPE_KEY.VIDEO_RECORDING) {
        settings = { ...settings, maxDurationSeconds: 60, allowRetakes: true };
      }

      return { ...current, questionType: type.key, questionTypeId: type.id, settings, options };
    });
  }

  function onQuestionChange(id: string, next: Q) {
    updateQuestion(id, (current) => {
      let settings = next.settings ?? {};
      let options = next.options ?? current.options ?? [];

      if (current.questionType === QUESTION_TYPE_KEY.TRUE_FALSE) {
        const correctValue = resolveTrueFalseCorrectValue(settings, options);

        settings = { ...settings, correctValue };
        options = syncTrueFalseOptions(options, correctValue);
      }

      return { ...current, title: next.title, settings, options };
    });
  }

  function isAutoGradable(question: Q) {
    return Boolean(typeOf(question)?.autoGradable);
  }

  function moveSection(id: string, direction: -1 | 1) {
    const index = activeSections.findIndex((section) => section.id === id);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= activeSections.length) return;

    const ids = activeSections.map((section) => section.id);
    const [moved] = ids.splice(index, 1);

    ids.splice(target, 0, moved);
    state.sections = state.sections.map((section: Section) => ({
      ...section,
      order: ids.includes(section.id) ? ids.indexOf(section.id) : section.order
    }));
  }

  function patchSection(id: string, partial: Record<string, unknown>) {
    state.sections = state.sections.map((section: Section) => (section.id === id ? { ...section, ...partial } : section));
  }

  function requiredCount(questions: Q[]) {
    return questions.filter((question) => question.required !== false).length;
  }

  let collapsedSections = $state<Record<string, boolean>>({});

  function sectionTitleFallback(section: Section, index: number) {
    return section.title?.trim() || `${t.get(`${KEYS}.section.fallback_title`)} ${index + 1}`;
  }

  $effect(() => {
    if (reorderQuestions) {
      untrack(() => {
        reorderBySection = Object.fromEntries(activeSections.map((section) => [section.id, questionsFor(section.id)]));
      });
    } else {
      untrack(() => (reorderBySection = {}));
    }
  });

  function onQuestionDndConsider(sectionId: string, event: CustomEvent) {
    reorderBySection = { ...reorderBySection, [sectionId]: event.detail.items };
  }

  function onQuestionDndFinalize(sectionId: string, event: CustomEvent) {
    reorderBySection = { ...reorderBySection, [sectionId]: event.detail.items };

    const orderedIds = event.detail.items.map((question: Q) => String(question.id));
    const rest = state.questions.filter((question: Q) => question.exerciseSectionId !== sectionId);
    const mine = event.detail.items.map((question: Q) => state.questions.find((entry: Q) => String(entry.id) === String(question.id)) ?? question);

    state.questions = [...rest, ...mine.filter((question: Q) => orderedIds.includes(String(question.id)))];
  }

  function formatDue(value: string) {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }
</script>

{#snippet gradingBadge(question: Q)}
  {@const auto = isAutoGradable(question)}
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Badge
            {...props}
            variant="outline"
            class="ui:absolute ui:top-0 ui:right-4 ui:z-10 ui:translate-y-[-50%] ui:gap-1 ui:bg-white ui:font-normal"
          >
            {auto ? autoGradableLabel('question_type_auto_gradable') : autoGradableLabel('question_type_manual_grading')}
            <InfoIcon class="ui:h-3 ui:w-3" aria-hidden="true" />
          </Badge>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="top" sideOffset={6} class="ui:max-w-xs">
        {auto
          ? autoGradableLabel('question_type_auto_gradable_description')
          : autoGradableLabel('question_type_manual_grading_description')}
      </Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
{/snippet}

{#snippet typeSelect(question: Q)}
  {@const premiumGate = (key: string) => isFreePlan && PREMIUM_QUESTION_TYPE_KEYS.has(key as never)}
  <Select.Root type="single" value={String(question.questionTypeId)} onValueChange={(value) => onTypeChange(question.id, value)}>
    <Select.Trigger class="ui:w-full ui:min-w-0 ui:sm:w-[180px]">
      {typeLabel(typeOf(question))}
    </Select.Trigger>
    <Select.Content class="ui:max-h-[300px]!">
      <Select.Group>
        <Select.Label>
          <p class="ui:font-semibold">{autoGradableLabel('question_type_auto_gradable')}</p>
          <p class="ui:text-muted-foreground ui:mt-1 ui:text-xs">{autoGradableLabel('question_type_auto_gradable_description')}</p>
        </Select.Label>
        {#each autoTypes as type (type.key)}
          {#if premiumGate(type.key)}
            <button
              type="button"
              class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:relative ui:flex ui:w-full ui:cursor-pointer ui:items-center ui:justify-between ui:gap-2 ui:rounded-sm ui:px-2 ui:py-1.5 ui:text-sm ui:outline-hidden ui:select-none"
              title={autoGradableLabel('premium_question_type')}
              onclick={() => onUpgrade?.()}
            >
              <span>{typeLabel(type)}</span>
              <PremiumIcon size={16} class="ui:ml-auto ui:shrink-0 ui:text-blue-700" />
            </button>
          {:else}
            <Select.Item value={String(type.id)} label={typeLabel(type)}>{typeLabel(type)}</Select.Item>
          {/if}
        {/each}
      </Select.Group>
      {#if manualTypes.length > 0}
        <Select.Separator />
        <Select.Group>
          <Select.Label>
            <p class="ui:font-semibold">{autoGradableLabel('question_type_manual_grading')}</p>
            <p class="ui:text-muted-foreground ui:mt-1 ui:text-xs">{autoGradableLabel('question_type_manual_grading_description')}</p>
          </Select.Label>
          {#each manualTypes as type (type.key)}
            {#if premiumGate(type.key)}
              <button
                type="button"
                class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:relative ui:flex ui:w-full ui:cursor-pointer ui:items-center ui:justify-between ui:gap-2 ui:rounded-sm ui:px-2 ui:py-1.5 ui:text-sm ui:outline-hidden ui:select-none"
                title={autoGradableLabel('premium_question_type')}
                onclick={() => onUpgrade?.()}
              >
                <span>{typeLabel(type)}</span>
                <PremiumIcon size={16} class="ui:ml-auto ui:shrink-0 ui:text-blue-700" />
              </button>
            {:else}
              <Select.Item value={String(type.id)} label={typeLabel(type)}>{typeLabel(type)}</Select.Item>
            {/if}
          {/each}
        </Select.Group>
      {/if}
    </Select.Content>
  </Select.Root>
{/snippet}

{#snippet questionEditor(question: Q, index: number)}
  {@const questionErrors = errors[question.id] ?? {}}
  <div
    id={elementId('question', question.id)}
    class="ui:mb-6 ui:scroll-mt-36"
  >
    <div
      class="{Object.keys(questionErrors).length ? 'ui:border-destructive' : 'ui:border-border'} ui:relative ui:rounded-md ui:border ui:bg-white"
    >
      <div class="ui:px-4 ui:pt-2 ui:pb-3">
        {@render gradingBadge(question)}
        <div class="ui:mt-2 ui:flex ui:flex-col">
          <ExerciseQuestion.QuestionRenderer
            showContainer={false}
            titleError={questionErrors.title ?? null}
            exerciseTitle={state.title}
            contract={{
              mode: 'edit',
              question,
              labels,
              platformMaxFileSizeMb: 25,
              onImageUpload: (file: File) =>
                new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();

                  reader.onload = () => resolve(String(reader.result));
                  reader.onerror = () => reject(reader.error);
                  reader.readAsDataURL(file);
                })
            }}
            onQuestionChange={(next) => onQuestionChange(question.id, next)}
          >
            {#snippet questionTypeSelect()}
              {@render typeSelect(question)}
            {/snippet}
          </ExerciseQuestion.QuestionRenderer>
          {#if questionErrors.option}
            <p class="ui:text-sm ui:text-red-500">{questionErrors.option}</p>
          {/if}
        </div>
      </div>

      <div class="ui:flex ui:items-center ui:justify-between ui:border-t-2 ui:p-2">
        <div class="ui:flex ui:w-40 ui:items-center">
          <p class="ui:mr-2 ui:text-sm">{t.get(`${KEYS.replace('all_exercises', 'new_exercise_modal')}.points`)}:</p>
          <NumberField
            integer
            min={1}
            placeholder={t.get(`${KEYS.replace('all_exercises', 'new_exercise_modal')}.points`)}
            value={typeof question.points === 'number' ? question.points : null}
            onValueChange={(next) => {
              if (next === null) return;

              updateQuestion(question.id, (current) => ({ ...current, points: next }));
            }}
          />
          {#if Number(question.points) === 0}
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger class="ui:ml-2 ui:shrink-0">
                  <TriangleAlertIcon size={16} class="ui:text-amber-500" />
                </Tooltip.Trigger>
                <Tooltip.Content side="top" sideOffset={4}>{t.get(`${KEYS}.zero_points_warning`)}</Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          {/if}
        </div>
        {#if questionErrors.points}
          <p class="ui:text-xs ui:text-red-500">{questionErrors.points}</p>
        {/if}
        <IconButton onclick={() => requestDelete('question', question.id)}>
          <TrashIcon size={16} />
        </IconButton>
      </div>
    </div>
  </div>
{/snippet}

{#snippet compactRow(question: Q, index: number)}
  <div class="ui:border-border ui:flex ui:items-center ui:gap-3 ui:rounded-md ui:border ui:bg-white ui:px-4 ui:py-3">
    <span class="ui:text-muted-foreground ui:w-6 ui:text-sm ui:font-medium ui:tabular-nums">{index + 1}</span>
    <div class="ui:min-w-0 ui:flex-1">
      <p class="ui:truncate ui:text-sm ui:font-semibold">{question.title || typeLabel(typeOf(question))}</p>
      <p class="ui:text-muted-foreground ui:text-xs">{typeLabel(typeOf(question))}</p>
    </div>
  </div>
{/snippet}

<div class="ui:mx-auto ui:w-full ui:max-w-3xl ui:px-2 ui:pt-2 ui:pb-[360px]">
  <div class="ui:mb-5 {currentMode === 'edit' ? 'ui:px-6' : 'ui:px-2'}">
    <div class="ui:border-border ui:relative ui:mb-6 ui:rounded-md ui:border ui:bg-white">
      <div class="ui:bg-primary ui:absolute" style="height:10px;left:-1px;top:-1px;width:calc(100% + 2px);border-top-left-radius:8px;border-top-right-radius:8px"></div>
      <div class="ui:px-4 ui:pt-4 ui:pb-3">
        {#if currentMode === 'preview'}
          <h2 class="ui:my-1 ui:text-2xl ui:font-semibold">{state.title}</h2>
          <div class="ui:flex ui:flex-wrap ui:items-center ui:text-sm">
            <p class="ui:mx-2"><strong>{state.questions.length}</strong> {t.get(`${KEYS}.view_mode.questions`)}</p>
            |
            {#if sectioned}
              <p class="ui:mx-2"><strong>{activeSections.length}</strong> {t.get(`${KEYS}.view_mode.sections`)}</p>
              |
            {/if}
            <p class="ui:mx-2"><strong>{totalPoints}</strong> {t.get(`${KEYS}.view_mode.points`)}.</p>
            |
            <p class="ui:mx-2">{t.get(`${KEYS}.view_mode.all`)}</p>
            {#if state.dueBy}
              |
              <p class="ui:mx-2"><strong>{t.get(`${KEYS}.view_mode.due`)}:</strong> {formatDue(state.dueBy)}</p>
            {/if}
          </div>
          <article class="cio-prose ui:mt-3 ui:p-2">
            <SafeHtmlContent content={state.description || t.get(`${KEYS}.description.no`)} />
          </article>
        {:else}
          <Input
            class="ui:mb-2"
            placeholder={t.get(`${KEYS}.description.title`)}
            value={state.title ?? ''}
            aria-invalid={errors.title?.title ? true : undefined}
            oninput={(event) => (state.title = event.currentTarget.value)}
          />
          <div class="ui:mb-2 ui:w-fit">
            <p class="ui:mb-1 ui:text-sm ui:font-medium">{t.get(`${KEYS}.view_mode.due`)}</p>
            <Input
              type="datetime-local"
              value={state.dueBy ?? ''}
              oninput={(event) => (state.dueBy = event.currentTarget.value)}
            />
          </div>
          <div class="ui:mt-3">
            <div class="ui:mb-1 ui:flex ui:items-center ui:justify-between ui:gap-2">
              <p>{t.get(`${KEYS}.description.heading`)}</p>
              <HoverableItem>
                {#snippet children(isHovered)}
                  <Button type="button" variant="outline" size="sm" onclick={() => (descriptionExpanded = true)}>
                    <MaximizeIcon {isHovered} size={16} ariaHidden />
                    {t.get(`${KEYS}.description.expand`)}
                  </Button>
                {/snippet}
              </HoverableItem>
            </div>
            <Editor
              content={state.description || ''}
              onContentChange={(html: string) => (state.description = html)}
              editorClass="ui:max-h-[100px]"
              placeholder={t.get(`${KEYS}.description.describe`)}
              expandable
              bind:expanded={descriptionExpanded}
              expandedTitle={state.title}
              expandedDescription={t.get(`${KEYS}.description.heading`)}
            />
          </div>
        {/if}
      </div>
    </div>
  </div>

  {#if currentMode === 'preview'}
    {#if !state.questions.length}
      <div class="ui:flex ui:flex-col ui:items-center ui:gap-2 ui:py-16 ui:text-center">
        <h3 class="ui:text-lg ui:font-medium">{t.get(`${KEYS}.view_mode.no_question`)}</h3>
        <p class="ui:text-primary ui:text-sm">
          {t.get(`${KEYS}.view_mode.empty_edit_hint_prefix`)}<span class="ui:font-semibold">{t.get(`${KEYS}.view_mode.edit`)}</span>{t.get(`${KEYS}.view_mode.empty_edit_hint_suffix`)}
        </p>
      </div>
    {:else if sectioned}
      <div class="ui:space-y-6 ui:px-2">
        {#each activeSections as section, sectionIndex (section.id)}
          {@const sectionQuestions = questionsFor(section.id)}
          <section class="ui:space-y-4 ui:pt-4">
            <ExerciseQuestion.SectionHeader
              title={sectionTitleFallback(section, sectionIndex)}
              description={section.description}
              sectionNumber={sectionIndex + 1}
              totalSections={activeSections.length}
              colorTheme={section.colorTheme}
              questionCount={sectionQuestions.length}
              totalPoints={sectionQuestions.reduce((total, question) => total + Number(question.points ?? 0), 0)}
              labels={{
                section: t.get(`${KEYS}.section.fallback_title`),
                questions: t.get(`${KEYS}.view_mode.questions`),
                points: t.get(`${KEYS}.view_mode.points`)
              }}
            />
            <ExerciseQuestion.QuestionList
              contract={{ mode: 'review', questions: sectionQuestions, labels, disabled: true }}
              itemClass="ui:mb-4"
            />
          </section>
        {/each}
      </div>
    {:else}
      <div class="ui:px-2">
        <ExerciseQuestion.QuestionList
          contract={{ mode: 'review', questions: state.questions, labels, disabled: true }}
          itemClass="ui:mb-4"
        />
      </div>
    {/if}
  {:else}
    {#if Object.keys(errors).length}
      <div class="ui:mb-4 ui:flex ui:w-full ui:justify-center">
        <p class="ui:text-sm ui:text-red-500">{t.get(`${KEYS}.edit_mode.error`)}</p>
      </div>
    {/if}
    <div class="ui:px-6 ui:pt-6">
      {#if sectioned}
        <div class="ui:space-y-5">
          {#each activeSections as section, sectionIndex (section.id)}
            {@const sectionQuestions = questionsFor(section.id)}
            {@const listed = reorderQuestions ? (reorderBySection[section.id] ?? sectionQuestions) : sectionQuestions}
            <section
              id={elementId('section', section.id)}
              class="{BORDER_CLASSES[section.colorTheme]} ui:overflow-hidden ui:rounded-lg ui:border ui:bg-white ui:shadow-xs"
            >
              <div class="ui:group/sectionhead ui:flex ui:items-center ui:gap-3 ui:border-b ui:bg-zinc-50 ui:px-4 ui:py-3">
                {#if reorderQuestions}
                  <GripVerticalIcon class="ui:text-muted-foreground ui:h-4 ui:w-4 ui:shrink-0" aria-hidden="true" />
                {/if}
                <div class="ui:relative ui:h-7 ui:w-7 ui:shrink-0">
                  {#if !collapsedSections[section.id]}
                    <span
                      class="{COLOR_CLASSES[section.colorTheme]} ui:pointer-events-none ui:absolute ui:top-1/2 ui:left-1/2 ui:h-2.5 ui:w-2.5 ui:-translate-x-1/2 ui:-translate-y-1/2 ui:rounded-full ui:opacity-100 ui:transition-opacity ui:group-hover/sectionhead:opacity-0"
                      aria-hidden="true"
                    ></span>
                    <div class="ui:absolute ui:inset-0 ui:flex ui:items-center ui:justify-center ui:opacity-0 ui:transition-opacity ui:group-hover/sectionhead:opacity-100">
                      <IconButton
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onclick={() => (collapsedSections[section.id] = true)}
                        tooltip={t.get(`${KEYS}.section.collapse_section`)}
                        tooltipSide="bottom"
                      >
                        <ChevronUpIcon class="ui:h-4 ui:w-4" aria-hidden="true" />
                      </IconButton>
                    </div>
                  {:else}
                    <div class="ui:flex ui:h-full ui:w-full ui:items-center ui:justify-center">
                      <IconButton
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onclick={() => (collapsedSections[section.id] = false)}
                        tooltip={t.get(`${KEYS}.section.expand_section`)}
                        tooltipSide="bottom"
                      >
                        <ChevronDownIcon class="ui:h-4 ui:w-4" aria-hidden="true" />
                      </IconButton>
                    </div>
                  {/if}
                </div>
                <Input
                  value={section.title}
                  oninput={(event) => patchSection(section.id, { title: event.currentTarget.value })}
                  aria-invalid={errors[section.id]?.title ? 'true' : undefined}
                  class="ui:min-w-0 ui:flex-1 ui:border-transparent ui:bg-transparent ui:px-1 ui:font-semibold ui:shadow-none ui:focus-visible:ring-1 {errors[section.id]?.title ? 'ui:border-destructive' : ''}"
                />
                <div class="ui:flex ui:shrink-0 ui:items-center ui:gap-2">
                  {#each COLOR_THEMES as theme (theme)}
                    <button
                      type="button"
                      class="{COLOR_CLASSES[theme]} ui:h-3 ui:w-3 ui:cursor-pointer ui:rounded-full ui:border {theme === section.colorTheme ? 'ui:ring-2 ui:ring-offset-2' : ''}"
                      title={`${t.get(`${KEYS}.section.color`)}: ${theme}`}
                      aria-label={`${t.get(`${KEYS}.section.color`)}: ${theme}`}
                      onclick={() => patchSection(section.id, { colorTheme: theme })}
                    ></button>
                  {/each}
                </div>
                <span class="ui:text-muted-foreground ui:shrink-0 ui:text-sm ui:font-semibold">
                  {sectionQuestions.length}
                  {t.get(`${KEYS}.section.short_questions`)}
                </span>
                <IconButton
                  onclick={() => requestDelete('section', section.id)}
                  tooltip={t.get(`${KEYS}.section.delete`)}
                  tooltipSide="bottom"
                  variant="outline"
                  size="icon-sm"
                >
                  <XIcon size={16} />
                </IconButton>
              </div>

              {#if errors[section.id]?.title}
                <div class="ui:bg-white ui:px-4 ui:pt-2">
                  <p class="ui:text-destructive ui:text-sm">{errors[section.id].title}</p>
                </div>
              {/if}

              {#if !collapsedSections[section.id]}
                <div class="ui:border-b ui:bg-white ui:px-4 ui:py-3">
                  <textarea
                    rows="2"
                    class="ui:border-input ui:placeholder:text-muted-foreground ui:w-full ui:resize-none ui:rounded-md ui:border ui:border-dashed ui:bg-transparent ui:px-3 ui:py-2 ui:text-sm ui:outline-none"
                    placeholder={t.get(`${KEYS}.section.description_placeholder`)}
                    value={section.description ?? ''}
                    oninput={(event) => patchSection(section.id, { description: event.currentTarget.value || null })}
                  ></textarea>
                </div>

                <div class="ui:space-y-4 ui:bg-white ui:px-4 ui:py-4">
                  <div
                    class="ui:space-y-2"
                    use:dndzone={{
                      items: listed,
                      flipDurationMs,
                      dropTargetStyle: { border: '2px #1d4ed8 solid', 'border-style': 'dashed', 'border-radius': '0.5rem' },
                      dragDisabled: !reorderQuestions,
                      type: `exercise-section-question-${section.id}`
                    }}
                    onconsider={(event) => onQuestionDndConsider(section.id, event)}
                    onfinalize={(event) => onQuestionDndFinalize(section.id, event)}
                  >
                    {#each listed as question, index (question.id)}
                      <div animate:flip={{ duration: flipDurationMs }} class="ui:flex ui:items-start ui:gap-3 {reorderQuestions ? 'ui:cursor-grab' : ''}">
                        <div class="ui:text-muted-foreground ui:flex ui:w-5 ui:shrink-0 ui:flex-col ui:items-center ui:gap-2 ui:pt-3">
                          {#if reorderQuestions}
                            <GripVerticalIcon class="ui:h-4 ui:w-4" aria-hidden="true" />
                          {/if}
                          <span class="ui:text-xs ui:font-medium ui:tabular-nums">{index + 1}</span>
                        </div>
                        <div class="ui:min-w-0 ui:flex-1">
                          {#if reorderQuestions}
                            {@render compactRow(question, index)}
                          {:else}
                            {@render questionEditor(question, index)}
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                  <div class="ui:flex ui:justify-center">
                    <Button variant="outline" onclick={() => addQuestion(section.id)}>+ {t.get(`${KEYS}.section.add_question`)}</Button>
                  </div>
                </div>

                <div class="ui:flex ui:items-center ui:justify-between ui:border-t ui:bg-zinc-50 ui:px-4 ui:py-3">
                  <p class="ui:text-muted-foreground ui:text-sm">{requiredCount(sectionQuestions)} {t.get(`${KEYS}.section.required`)}</p>
                  <div class="ui:flex ui:items-center ui:gap-1">
                    <IconButton
                      onclick={() => moveSection(section.id, -1)}
                      disabled={sectionIndex === 0}
                      tooltip={t.get(`${KEYS}.section.move_up`)}
                      tooltipSide="bottom"
                    >
                      <ArrowUpIcon size={16} />
                    </IconButton>
                    <IconButton
                      onclick={() => moveSection(section.id, 1)}
                      disabled={sectionIndex === activeSections.length - 1}
                      tooltip={t.get(`${KEYS}.section.move_down`)}
                      tooltipSide="bottom"
                    >
                      <ArrowDownIcon size={16} />
                    </IconButton>
                  </div>
                </div>
              {/if}
            </section>

            <ExerciseQuestion.SectionAfterBehavior
              {sectionIndex}
              currentSectionId={section.id}
              allSections={activeSections}
              afterBehavior={section.afterBehavior}
              labels={{
                afterSectionPrefix: t.get(`${KEYS}.section.after_section`),
                continue: t.get(`${KEYS}.section.continue`),
                goToSection: t.get(`${KEYS}.section.go_to_section`),
                submit: t.get(`${KEYS}.section.submit`)
              }}
              onChange={(behavior: any) => patchSection(section.id, { afterBehavior: behavior })}
            />
          {/each}
        </div>
      {:else}
        {#each state.questions as question, index (question.id)}
          {@render questionEditor(question, index)}
        {/each}
      {/if}
    </div>
  {/if}
</div>

<Dialog.Root
  open={deleteDialog.open}
  onOpenChange={(open: boolean) => {
    if (!open) deleteDialog = { ...deleteDialog, open: false };
  }}
>
  <Dialog.Content class="ui:w-96">
    <Dialog.Header>
      <Dialog.Title>
        {deleteDialog.kind === 'section'
          ? t.get(`${KEYS}.delete_confirmation.section_title`)
          : t.get(`${KEYS}.delete_confirmation.title`)}
      </Dialog.Title>
    </Dialog.Header>
    <div>
      <p class="ui:mt-0 ui:text-base">
        {deleteDialog.kind === 'section'
          ? t.get(`${KEYS}.delete_confirmation.section_sure`)
          : t.get(`${KEYS}.delete_confirmation.sure`)}
      </p>
      <div class="ui:mt-5 ui:flex ui:items-center ui:justify-between">
        <Button variant="outline" onclick={() => (deleteDialog = { ...deleteDialog, open: false })}>
          {t.get(`${KEYS}.delete_confirmation.no`)}
        </Button>
        <Button onclick={confirmDelete}>{t.get(`${KEYS}.delete_confirmation.yes`)}</Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root open={orderOpen} onOpenChange={closeOrder}>
  <Dialog.Content class="ui:w-96">
    <Dialog.Header>
      <Dialog.Title>{t.get(`${KEYS}.order_questions`)}</Dialog.Title>
    </Dialog.Header>
    <section
      use:dndzone={{
        items: orderItems,
        flipDurationMs: 300,
        dropTargetStyle: { border: '2px #1d4ed8 solid', 'border-style': 'dashed' }
      }}
      onconsider={(event) => (orderItems = event.detail.items)}
      onfinalize={(event) => {
        orderItems = event.detail.items;
        applyOrder(event.detail.items);
      }}
      class="ui:max-h-[300px] ui:w-full ui:overflow-auto ui:p-1"
    >
      {#each orderItems as item (item.id)}
        <div
          animate:flip={{ duration: 300 }}
          class="ui:border-primary ui:my-2 ui:flex ui:items-center ui:gap-2 ui:rounded-md ui:border ui:p-4"
        >
          <GripVerticalIcon size={16} class="ui:text-muted-foreground ui:shrink-0" />
          {` ${item.name || t.get(`${KEYS}.edit_mode.select_type`)}`}
        </div>
      {/each}
    </section>
  </Dialog.Content>
</Dialog.Root>
