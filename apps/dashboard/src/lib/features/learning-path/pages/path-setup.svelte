<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '@cio/ui/base/button';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import BookIcon from '@lucide/svelte/icons/book';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import DollarSignIcon from '@lucide/svelte/icons/dollar-sign';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import { t } from '$lib/utils/functions/translations';
  import { getSetupSteps, getSetupProgress } from '../utils/setup-steps';
  import type { LearningPathDetail } from '../utils/types';
  import * as Page from '@cio/ui/base/page';
  import PercentRingProgress from '@cio/ui/custom/percent-ring-progress';

  interface Props {
    path: LearningPathDetail;
    basePath: string;
  }

  let { path, basePath }: Props = $props();

  const steps = $derived(getSetupSteps(path, basePath));
  const progress = $derived(getSetupProgress(steps));
  const stepsLeft = $derived(progress.total - progress.completed);

  function getStepIcon(stepId: string) {
    switch (stepId) {
      case 'name':
        return FileTextIcon;
      case 'courses':
        return BookIcon;
      case 'order':
        return GripVerticalIcon;
      case 'price':
        return DollarSignIcon;
      case 'landing':
        return GlobeIcon;
      case 'activate':
        return CheckCircleIcon;
      default:
        return FileTextIcon;
    }
  }
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 pb-12 md:max-w-2xl lg:max-w-3xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('learningPath.setup.title')}</Page.Title>
      <Page.Subtitle>
        Finish these steps to launch <strong class="ui:text-foreground font-medium">{path.name}</strong> to your learners.
      </Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <PercentRingProgress value={progress.percent} size="default" />
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <div class="ui:border-border ui:bg-card mb-4 rounded-lg border p-4">
        <p class="ui:text-muted-foreground text-[13px]">
          {$t('learningPath.setup.summary')}
        </p>
        <div class="mt-2.5 flex items-center gap-3">
          <span class="ui:text-foreground text-xs tabular-nums">
            {progress.completed} of {progress.total} completed
          </span>
          <div class="flex items-center gap-1">
            {#each Array(progress.total) as _, index (index)}
              <span class="size-2 rounded-full {index < progress.completed ? 'bg-emerald-600' : 'ui:bg-border'}"></span>
            {/each}
          </div>
        </div>
      </div>

      <div class="space-y-2">
        {#each steps as step (step.id)}
          {@const IconComponent = getStepIcon(step.id)}
          <div
            class="flex items-center gap-3.5 rounded-lg p-3.5 transition-all {step.isCurrent
              ? 'ui:border-primary ui:bg-card border'
              : step.isCompleted
                ? 'ui:bg-muted/40 opacity-60'
                : 'ui:bg-card/40'}"
          >
            {#if step.isCompleted}
              <div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white">
                <CheckIcon class="custom size-4" />
              </div>
            {:else if step.isCurrent}
              <div
                class="ui:border-primary/30 ui:bg-primary/10 ui:text-primary flex size-8 shrink-0 items-center justify-center rounded-md border"
              >
                <IconComponent class="custom size-4" />
              </div>
            {:else}
              <div
                class="ui:border-border ui:bg-muted ui:text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md border"
              >
                <IconComponent class="custom size-4" />
              </div>
            {/if}

            <div class="min-w-0 flex-1">
              <p
                class="ui:text-foreground text-[14px] leading-[1.4] font-medium {step.isCompleted
                  ? 'ui:text-muted-foreground line-through'
                  : ''}"
              >
                {step.title}
              </p>
              <p class="ui:text-muted-foreground line-clamp-1 text-[13px] {step.isCompleted ? 'line-through' : ''}">
                {step.description}
              </p>
            </div>

            <div class="ml-2 shrink-0">
              {#if step.isCompleted}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled
                  class="h-8 cursor-default text-xs font-medium opacity-80"
                >
                  {$t('learningPath.setup.done')}
                </Button>
              {:else if step.isCurrent}
                <Button variant="default" size="sm" class="h-8 text-xs" onclick={() => goto(step.href)}>
                  {step.actionText}
                  <ChevronRightIcon class="ml-1 size-3.5" />
                </Button>
              {:else}
                <Button variant="outline" size="sm" class="h-8 text-xs" onclick={() => goto(step.href)}>
                  {step.actionText}
                  <ChevronRightIcon class="ml-1 size-3.5" />
                </Button>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      {#if stepsLeft > 0}
        <div
          class="ui:border-border ui:bg-card mt-6 flex flex-col items-start justify-between gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
        >
          <div class="flex items-center gap-3.5">
            <PercentRingProgress value={progress.percent} size="small" />
            <div>
              <p class="ui:text-foreground text-sm font-semibold">
                {stepsLeft}
                {stepsLeft === 1 ? 'step' : 'steps'} left to launch
              </p>
              <p class="ui:text-muted-foreground mt-0.5 text-xs">
                {$t('learningPath.setup.launch_desc')}
              </p>
            </div>
          </div>

          <Button variant="default" class="w-full shrink-0 sm:w-auto" onclick={() => goto(`${basePath}/courses`)}>
            {$t('learningPath.setup.activate_now')}
          </Button>
        </div>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
