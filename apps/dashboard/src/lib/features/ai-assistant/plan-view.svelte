<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import FileQuestionIcon from '@lucide/svelte/icons/file-question';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import { Button } from '@cio/ui/base/button';
  import { Textarea } from '@cio/ui/base/textarea';
  import { SvelteSet } from 'svelte/reactivity';
  import { t } from '$lib/utils/functions/translations';
  import type { CoursePlan } from './utils/course-plan';

  /** Token cost estimation heuristics (tokens per item) */
  const TOKEN_COST_ESTIMATES = {
    SECTION_CREATE: 500,
    LESSON_CREATE_AND_CONTENT: 3000,
    EXERCISE_CREATE: 1500
  } as const;

  interface Props {
    plan: CoursePlan;
    onImplement: (editedPlan: CoursePlan) => void;
    onAskChanges: (message: string) => void;
    /** When true, disables the inline change-request composer (agent is already working). */
    isBusy?: boolean;
    remainingTokens?: number;
    /**
     * When true on mount, the card starts collapsed (header-only). When the
     * prop flips from false → true and the user hasn't manually toggled the
     * card, it collapses automatically. Manual user toggles are sticky.
     */
    defaultCollapsed?: boolean;
  }

  let { plan, onImplement, onAskChanges, isBusy = false, remainingTokens, defaultCollapsed = false }: Props = $props();

  let isExpanded = $state(!defaultCollapsed);
  /** Sticky once the user clicks the top-level chevron; defeats the auto-collapse signal. */
  let userToggled = $state(false);

  function toggleCard() {
    userToggled = true;
    isExpanded = !isExpanded;
  }

  /**
   * When the parent flips defaultCollapsed (e.g. implementation just began),
   * collapse — unless the user has explicitly opened the card already.
   */
  $effect(() => {
    if (userToggled) return;
    isExpanded = !defaultCollapsed;
  });

  let changeRequest = $state('');
  const canSendChange = $derived(!isBusy && changeRequest.trim().length > 0);

  function submitChangeRequest() {
    if (!canSendChange) return;

    const message = changeRequest.trim();
    changeRequest = '';
    onAskChanges(message);
  }

  function handleChangeKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitChangeRequest();
    }
  }

  // CoursePlan is plain JSON; structuredClone fails when the AI SDK part carries
  // non-cloneable internals, so JSON round-trip is both safer and sufficient.
  function clonePlan(input: CoursePlan): CoursePlan {
    return JSON.parse(JSON.stringify(input)) as CoursePlan;
  }

  // Local editable copy of the plan
  let editablePlan: CoursePlan = $state(clonePlan(plan));

  // Reset editable plan when the prop changes (e.g., agent revises the plan)
  $effect(() => {
    editablePlan = clonePlan(plan);
  });

  let expandedSections = new SvelteSet<number>();

  $effect(() => {
    expandedSections.clear();

    for (let i = 0; i < editablePlan.sections.length; i++) {
      expandedSections.add(i);
    }
  });

  // Track which field is being edited: "section-0-title", "lesson-1-2-title", "lesson-1-2-desc"
  let editingField: string | null = $state(null);

  function toggleSection(index: number) {
    if (expandedSections.has(index)) {
      expandedSections.delete(index);
    } else {
      expandedSections.add(index);
    }
  }

  function startEditing(fieldKey: string) {
    editingField = fieldKey;
  }

  function stopEditing() {
    editingField = null;
  }

  function handleEditKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      stopEditing();
    }

    if (event.key === 'Escape') {
      stopEditing();
    }
  }

  const totalLessons = $derived(
    editablePlan.sections.reduce((sum, s) => sum + s.items.filter((i) => i.type === 'lesson').length, 0)
  );
  const totalExercises = $derived(
    editablePlan.sections.reduce(
      (sum, s) => sum + s.items.filter((i) => i.type === 'exercise' || i.hasExercise).length,
      0
    )
  );

  const estimatedTokens = $derived(
    editablePlan.sections.length * TOKEN_COST_ESTIMATES.SECTION_CREATE +
      totalLessons * TOKEN_COST_ESTIMATES.LESSON_CREATE_AND_CONTENT +
      totalExercises * TOKEN_COST_ESTIMATES.EXERCISE_CREATE
  );

  const costPercentage = $derived(remainingTokens ? Math.round((estimatedTokens / remainingTokens) * 100) : null);
  const isHighCost = $derived(costPercentage !== null && costPercentage > 50);
</script>

<div class="ui:bg-background rounded-lg border">
  <!-- Plan header: chevron + title + counts. Chevron toggles the whole card. -->
  <div class="flex items-start gap-2 {isExpanded ? 'border-b' : ''} px-3 py-2">
    <button
      type="button"
      onclick={toggleCard}
      class="ui:text-muted-foreground hover:ui:text-foreground mt-0.5 shrink-0"
      aria-label={isExpanded ? $t('ai_assistant.plan_view.collapse') : $t('ai_assistant.plan_view.expand')}
    >
      {#if isExpanded}
        <ChevronDownIcon size={14} />
      {:else}
        <ChevronRightIcon size={14} />
      {/if}
    </button>

    <div class="min-w-0 flex-1">
      {#if editingField === 'plan-title'}
        <input
          type="text"
          bind:value={editablePlan.title}
          onblur={stopEditing}
          onkeydown={handleEditKeydown}
          class="ui:bg-muted/50 focus:ui:ring-primary w-full rounded border px-1 py-0.5 text-sm font-semibold focus:ring-1 focus:outline-none"
          autofocus
        />
      {:else}
        <button
          onclick={() => startEditing('plan-title')}
          class="group hover:ui:text-primary flex items-center gap-1 text-left text-sm font-semibold"
        >
          {editablePlan.title}
          <PencilIcon size={10} class="opacity-0 group-hover:opacity-50" />
        </button>
      {/if}
      <p class="ui:text-muted-foreground text-xs">
        {editablePlan.sections.length} sections, {totalLessons} lessons{totalExercises > 0
          ? `, ${totalExercises} exercises`
          : ''}
      </p>
    </div>
  </div>

  {#if isExpanded}
    <!-- Sections tree -->
    <div class="max-h-[300px] overflow-y-auto p-2">
      {#each editablePlan.sections as section, sectionIndex (sectionIndex)}
        <div class="mb-1">
          <div class="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium">
            <button onclick={() => toggleSection(sectionIndex)} class="flex-shrink-0">
              {#if expandedSections.has(sectionIndex)}
                <ChevronDownIcon size={12} />
              {:else}
                <ChevronRightIcon size={12} />
              {/if}
            </button>

            {#if editingField === `section-${sectionIndex}-title`}
              <input
                type="text"
                bind:value={editablePlan.sections[sectionIndex].title}
                onblur={stopEditing}
                onkeydown={handleEditKeydown}
                class="ui:bg-muted/50 focus:ui:ring-primary flex-1 rounded border px-1 py-0.5 text-xs focus:ring-1 focus:outline-none"
                autofocus
              />
            {:else}
              <button
                onclick={() => startEditing(`section-${sectionIndex}-title`)}
                class="group hover:ui:text-primary flex items-center gap-1 text-left"
              >
                Section {section.order}: {section.title}
                <PencilIcon size={9} class="opacity-0 group-hover:opacity-50" />
              </button>
            {/if}
          </div>

          {#if expandedSections.has(sectionIndex)}
            <div class="ml-5 space-y-1">
              {#each section.items as item, itemIndex (item.order)}
                <div class="flex items-start gap-1.5 rounded px-2 py-1 text-xs">
                  {#if item.type === 'exercise'}
                    <FileQuestionIcon size={11} class="ui:text-primary mt-0.5 flex-shrink-0" />
                  {:else}
                    <BookOpenIcon size={11} class="ui:text-muted-foreground mt-0.5 flex-shrink-0" />
                  {/if}
                  <div class="min-w-0 flex-1">
                    {#if editingField === `item-${sectionIndex}-${itemIndex}-title`}
                      <input
                        type="text"
                        bind:value={editablePlan.sections[sectionIndex].items[itemIndex].title}
                        onblur={stopEditing}
                        onkeydown={handleEditKeydown}
                        class="ui:bg-muted/50 focus:ui:ring-primary w-full rounded border px-1 py-0.5 text-xs font-medium focus:ring-1 focus:outline-none"
                        autofocus
                      />
                    {:else}
                      <button
                        onclick={() => startEditing(`item-${sectionIndex}-${itemIndex}-title`)}
                        class="group hover:ui:text-primary flex items-center gap-1 text-left font-medium"
                      >
                        {#if item.type === 'exercise'}
                          <span class="ui:text-primary">{item.title}</span>
                        {:else}
                          {item.title}
                        {/if}
                        <PencilIcon size={9} class="opacity-0 group-hover:opacity-50" />
                      </button>
                    {/if}

                    {#if editingField === `item-${sectionIndex}-${itemIndex}-desc`}
                      <textarea
                        bind:value={editablePlan.sections[sectionIndex].items[itemIndex].description}
                        onblur={stopEditing}
                        onkeydown={handleEditKeydown}
                        rows={2}
                        class="ui:bg-muted/50 ui:text-muted-foreground focus:ui:ring-primary mt-0.5 w-full rounded border px-1 py-0.5 text-xs focus:ring-1 focus:outline-none"
                        autofocus
                      ></textarea>
                    {:else}
                      <button
                        onclick={() => startEditing(`item-${sectionIndex}-${itemIndex}-desc`)}
                        class="group ui:text-muted-foreground hover:ui:text-foreground mt-0.5 flex items-start gap-1 text-left"
                      >
                        <span class="line-clamp-2">{item.description}</span>
                        <PencilIcon size={9} class="mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-50" />
                      </button>
                    {/if}

                    {#if item.type === 'lesson' && item.hasExercise}
                      <div class="ui:text-muted-foreground mt-0.5 flex items-center gap-1">
                        <FileQuestionIcon size={10} />
                        <span>Exercise included</span>
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Cost estimate + actions -->
    <div class="space-y-2 border-t px-3 py-2">
      {#if estimatedTokens > 0}
        <p class="text-xs {isHighCost ? 'text-amber-600 dark:text-amber-400' : 'ui:text-muted-foreground'}">
          Estimated cost: ~{estimatedTokens.toLocaleString()} tokens
          {#if costPercentage !== null}
            ({costPercentage}% of remaining)
          {/if}
        </p>
      {/if}

      <div class="flex flex-col gap-2">
        <Button size="sm" onclick={() => onImplement(editablePlan)} class="w-full">
          {$t('ai_assistant.plan_implement')}
        </Button>
        <div class="flex items-end gap-2">
          <Textarea
            bind:value={changeRequest}
            placeholder={$t('ai_assistant.plan_ask_changes_placeholder')}
            rows={1}
            disabled={isBusy}
            onkeydown={handleChangeKeydown}
            class="ui:min-h-9! ui:resize-none ui:py-2 ui:text-sm"
          />
          <Button
            size="icon-sm"
            variant="default"
            disabled={!canSendChange}
            onclick={submitChangeRequest}
            aria-label={$t('ai_assistant.plan_ask_changes_send_aria')}
          >
            <ArrowUpIcon class="ui:size-4" />
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>
