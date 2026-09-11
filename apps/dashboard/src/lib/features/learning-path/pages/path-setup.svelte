<script lang="ts">
  import { goto } from '$app/navigation';
  import * as Item from '@cio/ui/base/item';
  import { Button } from '@cio/ui/base/button';
  import { PercentRingProgress } from '@cio/ui/custom/percent-ring-progress';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import DollarSignIcon from '@lucide/svelte/icons/dollar-sign';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import { t } from '$lib/utils/functions/translations';
  import { getSetupSteps, getSetupProgress } from '../utils/setup-steps';
  import type { LearningPathDetail } from '../utils/types';

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
        return BookOpenIcon;
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

<div class="mx-auto w-full max-w-[760px] pb-12">
  <!-- Header -->
  <div class="mb-6 flex items-center justify-between gap-4">
    <div>
      <h1 class="text-foreground text-2xl font-bold tracking-tight">
        {$t('learningPath.setup.title')}
      </h1>
      <p class="text-muted-foreground mt-1 text-sm">
        Finish these steps to launch <strong class="text-foreground font-medium">{path.name}</strong> to your learners.
      </p>
    </div>

    <div class="shrink-0">
      <PercentRingProgress value={progress.percent} size="default" />
    </div>
  </div>

  <!-- Summary Card -->
  <Item.Root variant="outline" class="mb-4 cursor-default p-4">
    <Item.Content>
      <Item.Description class="text-muted-foreground mb-2.5 text-xs">
        {$t('learningPath.setup.summary')}
      </Item.Description>

      <div class="flex items-center gap-3">
        <span class="text-foreground text-xs font-semibold tabular-nums">
          {progress.completed} of {progress.total} completed
        </span>
        <div class="flex items-center gap-1.5">
          {#each Array(progress.total) as _, index (index)}
            <span class="size-2 rounded-full {index < progress.completed ? 'bg-green-600' : 'bg-muted-foreground/30'}"
            ></span>
          {/each}
        </div>
      </div>
    </Item.Content>
  </Item.Root>

  <!-- Step List -->
  <Item.Group class="space-y-2.5">
    {#each steps as step (step.id)}
      {@const IconComponent = getStepIcon(step.id)}
      <Item.Root
        variant="muted"
        class="border-border border p-3.5 transition {step.isCompleted
          ? 'opacity-65'
          : step.isCurrent
            ? 'border-l-primary border-l-4 shadow-xs'
            : ''}"
      >
        <Item.Media variant="icon" class="mr-3 shrink-0">
          {#if step.isCompleted}
            <div class="flex size-7 items-center justify-center rounded-full bg-green-600 text-white">
              <CheckIcon class="size-4 stroke-3" />
            </div>
          {:else}
            <div
              class="flex size-7 items-center justify-center rounded-md {step.isCurrent
                ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground'}"
            >
              <IconComponent class="size-4" />
            </div>
          {/if}
        </Item.Media>

        <Item.Content class="min-w-0 flex-1">
          <Item.Title
            class="text-sm {step.isCompleted
              ? 'text-muted-foreground font-normal line-through'
              : 'text-foreground font-semibold'}"
          >
            {step.title}
          </Item.Title>
          <Item.Description
            class="text-xs {step.isCompleted ? 'text-muted-foreground/70 line-through' : 'text-muted-foreground'}"
          >
            {step.description}
          </Item.Description>
        </Item.Content>

        <Item.Actions class="ml-3 shrink-0">
          {#if step.isCompleted}
            <Button variant="secondary" size="sm" disabled class="h-8 cursor-default text-xs font-medium opacity-80">
              {$t('learningPath.setup.done')}
            </Button>
          {:else}
            <Button
              variant={step.isCurrent ? 'primary' : 'outline'}
              size="sm"
              class="h-8 text-xs font-medium"
              onclick={() => goto(step.href)}
            >
              {step.actionText}
              <ChevronRightIcon class="ml-1 size-3.5" />
            </Button>
          {/if}
        </Item.Actions>
      </Item.Root>
    {/each}
  </Item.Group>

  <!-- Launch Card (when incomplete) -->
  {#if stepsLeft > 0}
    <div
      class="border-border bg-card mt-6 flex flex-col items-start justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
    >
      <div class="flex items-center gap-3.5">
        <PercentRingProgress value={progress.percent} size="small" />
        <div>
          <div class="text-foreground text-sm font-semibold">
            {stepsLeft}
            {stepsLeft === 1 ? 'step' : 'steps'} left to launch
          </div>
          <p class="text-muted-foreground text-xs">
            {$t('learningPath.setup.launch_desc')}
          </p>
        </div>
      </div>

      <Button variant="primary" class="w-full shrink-0 sm:w-auto" onclick={() => goto(`${basePath}/settings`)}>
        {$t('learningPath.setup.activate_now')}
      </Button>
    </div>
  {/if}
</div>
