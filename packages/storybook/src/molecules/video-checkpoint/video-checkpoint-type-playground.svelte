<script lang="ts">
  import { Button } from '@cio/ui';
  import { cloneJson, CHECKPOINT_TYPES, getCheckpointType, type CheckpointTypeId } from './checkpoint-types';
  import VideoCheckpointTakeDemo from './video-checkpoint-take-demo.svelte';

  interface Props {
    resumePolicy?: 'any' | 'correct';
  }

  let { resumePolicy = 'any' }: Props = $props();

  let selectedId = $state<CheckpointTypeId>('RADIO');

  const selected = $derived(getCheckpointType(selectedId));

  function selectType(id: CheckpointTypeId) {
    selectedId = id;
  }
</script>

<div class="mx-auto w-full max-w-3xl space-y-3">
  <div class="flex flex-wrap gap-1.5" role="tablist" aria-label="Question type preview">
    {#each CHECKPOINT_TYPES as type (type.id)}
      <Button.Root
        type="button"
        size="xs"
        variant={type.id === selectedId ? 'default' : 'outline'}
        aria-pressed={type.id === selectedId}
        onclick={() => selectType(type.id)}
      >
        {type.label}
      </Button.Root>
    {/each}
  </div>

  {#key selectedId}
    <VideoCheckpointTakeDemo
      question={cloneJson(selected.fixture.question)}
      kicker={selected.kicker}
      {resumePolicy}
      correctAnswer={selected.fixture.answer}
    />
  {/key}
</div>
