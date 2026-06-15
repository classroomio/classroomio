<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { scale } from 'svelte/transition';
  import {
    buildWordBankChips,
    countWordBankBlanks,
    filledBlanksFromPlacements,
    matchFilledBlanksToChipIds,
    parseWordBankTemplate,
    shuffleWordBankChips,
    type WordBankChip
  } from './word-bank-utils';

  let {
    question,
    answer,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const template = $derived(String((question.settings?.template as string | undefined) ?? ''));

  const correctAnswers = $derived.by(() => {
    const raw = question.settings?.correctAnswers;
    return Array.isArray(raw) ? (raw as string[]).map((s) => String(s ?? '')) : [];
  });

  const distractors = $derived.by(() => {
    const raw = question.settings?.distractors;
    return Array.isArray(raw) ? (raw as string[]).map((s) => String(s ?? '')) : [];
  });

  const blankCount = $derived(countWordBankBlanks(template));
  const segments = $derived(parseWordBankTemplate(template));

  const baseChips = $derived(buildWordBankChips(correctAnswers, distractors));
  let shuffledChips = $state<WordBankChip[]>([]);
  let chipsSourceKey = $state('');

  /** chip id placed in each blank, or null */
  let placementByBlank = $state<(string | null)[]>([]);
  let placementSyncedKey = $state('');

  const chipById = $derived.by(() => {
    const map = new Map<string, WordBankChip>();
    for (const c of baseChips) {
      map.set(c.id, c);
    }
    return map;
  });

  function emitFromPlacements(next: (string | null)[]) {
    placementByBlank = next;
    const filled = filledBlanksFromPlacements(next, chipById);
    onAnswerChange({ type: 'WORD_BANK', filledBlanks: filled });
  }

  function syncChipsOrder() {
    const key = JSON.stringify({ template, ca: correctAnswers, d: distractors });
    if (key === chipsSourceKey) return;
    chipsSourceKey = key;
    shuffledChips = shuffleWordBankChips(baseChips);
  }

  function syncPlacementFromAnswer() {
    const key = `${chipsSourceKey}:${answer?.type === 'WORD_BANK' ? answer.filledBlanks.join('\0') : ''}:${blankCount}`;
    if (key === placementSyncedKey) return;
    placementSyncedKey = key;

    const nextPlacement: (string | null)[] = Array.from({ length: blankCount }, () => null);
    if (answer?.type === 'WORD_BANK' && answer.filledBlanks.length > 0) {
      const matched = matchFilledBlanksToChipIds(answer.filledBlanks, baseChips);
      for (let i = 0; i < blankCount; i++) {
        nextPlacement[i] = matched[i] ?? null;
      }
    }
    placementByBlank = nextPlacement;
  }

  $effect(() => {
    syncChipsOrder();
    syncPlacementFromAnswer();
  });

  function isChipPlaced(chipId: string): boolean {
    return placementByBlank.some((id) => id === chipId);
  }

  function firstEmptyBlankIndex(): number {
    const idx = placementByBlank.findIndex((id) => id === null);
    return idx;
  }

  function placeChipInBlank(blankIndex: number, chipId: string) {
    if (disabled || blankIndex < 0 || blankIndex >= blankCount) return;

    const next = [...placementByBlank];
    const prevChip = next[blankIndex];
    if (prevChip === chipId) return;

    for (let i = 0; i < next.length; i++) {
      if (next[i] === chipId) next[i] = null;
    }

    if (prevChip) {
      // returned to bank implicitly
    }

    next[blankIndex] = chipId;
    emitFromPlacements(next);
  }

  function onChipClick(chip: WordBankChip) {
    if (disabled || isChipPlaced(chip.id)) return;
    const blankIndex = firstEmptyBlankIndex();
    if (blankIndex < 0) return;
    placeChipInBlank(blankIndex, chip.id);
  }

  function clearBlank(blankIndex: number) {
    if (disabled) return;
    const next = [...placementByBlank];
    next[blankIndex] = null;
    emitFromPlacements(next);
  }

  function onDragStart(event: DragEvent, chipId: string) {
    if (disabled) return;
    event.dataTransfer?.setData('text/plain', chipId);
    event.dataTransfer!.effectAllowed = 'move';
  }

  function onBlankDragOver(event: DragEvent) {
    if (disabled) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  function onBlankDrop(event: DragEvent, blankIndex: number) {
    if (disabled) return;
    event.preventDefault();
    const chipId = event.dataTransfer?.getData('text/plain');
    if (!chipId) return;
    if (isChipPlaced(chipId)) return;
    placeChipInBlank(blankIndex, chipId);
  }
</script>

<div class="ui:space-y-4">
  <p class="ui:text-muted-foreground ui:text-xs">{label('word_bank.take.helper')}</p>

  <div class="ui:bg-muted/30 ui:rounded-lg ui:border ui:p-4 ui:font-mono ui:text-sm ui:leading-relaxed">
    {#if blankCount === 0}
      <span class="ui:text-muted-foreground">{template || label('common.not_set')}</span>
    {:else}
      {#each segments as segment, segmentIndex (segmentIndex)}
        {#if segment.type === 'text'}
          <span>{segment.value}</span>
        {:else}
          {@const blankIndex = segment.index}
          {@const chipId = placementByBlank[blankIndex] ?? null}
          {@const text = chipId ? (chipById.get(chipId)?.label ?? '') : ''}
          <button
            type="button"
            class="ui:inline-flex ui:align-middle ui:mx-0.5 ui:min-h-8 ui:min-w-[5rem] ui:max-w-[16rem] ui:items-center ui:justify-center ui:rounded ui:border-2 ui:px-2 ui:py-0.5 ui:text-left ui:text-sm ui:transition-all ui:duration-200 ui:border-primary ui:disabled:cursor-not-allowed"
            class:ui:border-dashed={!text}
            class:ui:bg-background={!text}
            class:ui:border-solid={!!text}
            {disabled}
            onclick={() => text && clearBlank(blankIndex)}
            aria-label={label('word_bank.take.clear_blank_sr')}
            ondragover={onBlankDragOver}
            ondrop={(e) => onBlankDrop(e, blankIndex)}
          >
            {#if text}
              <span in:scale={{ duration: 180, start: 0.92 }}>{text}</span>
            {:else}
              <span class="ui:text-muted-foreground ui:select-none">&nbsp;</span>
            {/if}
          </button>
        {/if}
      {/each}
    {/if}
  </div>

  <div class="ui:space-y-2">
    <p class="ui:text-muted-foreground ui:text-xs">{label('word_bank.take.bank_heading')}</p>
    <div class="ui:flex ui:flex-wrap ui:gap-2">
      {#each shuffledChips as chip (chip.id)}
        {@const placed = isChipPlaced(chip.id)}
        <button
          type="button"
          draggable={!disabled && !placed}
          class="ui:rounded ui:border-2 ui:border-primary ui:bg-primary ui:px-3 ui:py-1.5 ui:text-sm ui:text-primary-foreground ui:transition-opacity ui:disabled:cursor-not-allowed"
          class:ui:opacity-40={placed}
          class:ui:pointer-events-none={placed}
          {disabled}
          onclick={() => onChipClick(chip)}
          ondragstart={(e) => onDragStart(e, chip.id)}
        >
          {chip.label || '—'}
        </button>
      {/each}
    </div>
  </div>
</div>
