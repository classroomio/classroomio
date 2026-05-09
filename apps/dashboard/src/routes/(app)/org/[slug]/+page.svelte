<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
  import CircleIcon from '@lucide/svelte/icons/circle';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

  import { t } from '$lib/utils/functions/translations';
  import { CourseCreator } from '@cio/ui/custom/course-creator';
  import { aiAssistantApi } from '$features/ai-assistant/api/ai-assistant.svelte';
  import { courseApi } from '$features/course/api';
  import { setInitialChatModel, setInitialChatPrompt } from '$features/ai-assistant/utils/store';
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import { isFreePlan } from '$lib/utils/store/org';
  import { AI_CHAT_MODEL_STORAGE_KEY } from '$features/ai-assistant/utils/constants';
  import type { TCourseType } from '@cio/db/types';
  import {
    AGENT_MODELS,
    DEFAULT_PICKER_MODEL_ID,
    UI_PICKER_MODEL_IDS,
    type AgentModelId
  } from '@cio/utils/agent-models';

  type CreatingStep = 'reading' | 'naming' | 'building';

  const steps: { key: CreatingStep; label: string }[] = [
    { key: 'reading', label: t.get('course.creator.drafting.step_reading') },
    { key: 'naming', label: t.get('course.creator.drafting.step_naming') },
    { key: 'building', label: t.get('course.creator.drafting.step_building') }
  ];

  let creatingState: 'idle' | 'creating' = $state('idle');
  let creatingStep: CreatingStep = $state('reading');
  let draftingPrompt = $state('');
  let selectedModel: AgentModelId = $state(DEFAULT_PICKER_MODEL_ID);
  const paidModelIds = UI_PICKER_MODEL_IDS.filter((id) => !AGENT_MODELS[id].isFree);

  function isAgentModelId(value: unknown): value is AgentModelId {
    return typeof value === 'string' && (UI_PICKER_MODEL_IDS as readonly string[]).includes(value);
  }

  function stepStatus(key: CreatingStep): 'done' | 'active' | 'pending' {
    const order: CreatingStep[] = ['reading', 'naming', 'building'];
    const current = order.indexOf(creatingStep);
    const target = order.indexOf(key);

    if (target < current) return 'done';
    if (target === current) return 'active';

    return 'pending';
  }

  function handleModelChange(model: string) {
    if (!isAgentModelId(model)) return;

    if ($isFreePlan && paidModelIds.includes(model)) {
      openUpgradeModal();
      return;
    }

    selectedModel = model;

    try {
      localStorage.setItem(AI_CHAT_MODEL_STORAGE_KEY, model);
    } catch {
      // localStorage unavailable
    }
  }

  function handleLockedModelSelect() {
    openUpgradeModal();
  }

  $effect(() => {
    if (!$isFreePlan || !paidModelIds.includes(selectedModel)) {
      return;
    }

    selectedModel = DEFAULT_PICKER_MODEL_ID;

    try {
      localStorage.setItem(AI_CHAT_MODEL_STORAGE_KEY, DEFAULT_PICKER_MODEL_ID);
    } catch {
      // localStorage unavailable
    }
  });

  async function handleCreate({ prompt, level, model }: { prompt: string; level: string; model?: string }) {
    if (isAgentModelId(model)) {
      if ($isFreePlan && paidModelIds.includes(model)) {
        openUpgradeModal();
        return;
      }

      handleModelChange(model);
    }

    draftingPrompt = prompt;
    creatingState = 'creating';
    creatingStep = 'reading';

    await new Promise((r) => setTimeout(r, 700));

    creatingStep = 'naming';
    const meta = await aiAssistantApi.generateCourseMeta(prompt);
    const title = meta?.title ?? prompt.slice(0, 80);
    const description = meta?.description ?? prompt.slice(0, 150);

    creatingStep = 'building';
    setInitialChatPrompt(`${prompt}\n\nCourse type: Self-paced. Level: ${level}.`);
    setInitialChatModel(selectedModel);

    await courseApi.create({ title, description, type: 'SELF_PACED' as TCourseType }, (courseId) => {
      goto(resolve(`/courses/${courseId}`, {}));
    });
  }

  onMount(() => {
    try {
      const storedModel = localStorage.getItem(AI_CHAT_MODEL_STORAGE_KEY);

      if (isAgentModelId(storedModel)) {
        if ($isFreePlan && paidModelIds.includes(storedModel)) {
          selectedModel = DEFAULT_PICKER_MODEL_ID;
          localStorage.setItem(AI_CHAT_MODEL_STORAGE_KEY, DEFAULT_PICKER_MODEL_ID);
          return;
        }

        selectedModel = storedModel;
      }
    } catch {
      // localStorage unavailable
    }
  });
</script>

<svelte:head>
  <title>Home - ClassroomIO</title>
</svelte:head>

{#if creatingState === 'creating'}
  <div class="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-4">
    <div class="flex flex-col items-center gap-2 text-center">
      <h1 class="text-2xl font-semibold">{$t('course.creator.drafting.heading')}</h1>
      <p class="ui:text-muted-foreground text-sm">
        {$t('course.creator.drafting.subtext')}
      </p>
    </div>

    <div class="ui:border w-full max-w-lg rounded-2xl p-5">
      <p class="mb-5 text-sm text-neutral-300 italic">"{draftingPrompt}"</p>

      <div class="flex flex-col gap-3">
        {#each steps as step (step.key)}
          {@const status = stepStatus(step.key)}
          <div class="flex items-center gap-3">
            {#if status === 'done'}
              <CheckCircleIcon class="h-4 w-4 shrink-0 text-green-500" />
            {:else if status === 'active'}
              <LoaderCircleIcon class="h-4 w-4 shrink-0 animate-spin text-white" />
            {:else}
              <CircleIcon class="h-4 w-4 shrink-0 text-neutral-600" />
            {/if}
            <span
              class="text-sm {status === 'done'
                ? 'text-neutral-400 line-through'
                : status === 'active'
                  ? 'ui:text-foreground'
                  : 'ui:text-muted-foreground'}"
            >
              {step.label}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </div>
{:else}
  <div class="flex min-h-[80vh] items-center justify-center px-4 py-12">
    <div class="w-full max-w-3xl">
      <CourseCreator
        heading={$t('course.creator.heading')}
        placeholder={$t('course.creator.placeholder')}
        model={selectedModel}
        levelOptions={[
          { value: 'beginner', label: $t('course.creator.level.beginner') },
          { value: 'intermediate', label: $t('course.creator.level.intermediate') },
          { value: 'advanced', label: $t('course.creator.level.advanced') }
        ]}
        lockedModelIds={$isFreePlan ? paidModelIds : []}
        onModelChange={handleModelChange}
        onLockedModelSelect={handleLockedModelSelect}
        onsubmit={handleCreate}
      />
    </div>
  </div>
{/if}
