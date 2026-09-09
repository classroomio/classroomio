<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VideoCheckpoint } from '@cio/ui';
  import {
    CHECKBOX_FIXTURE,
    FILL_BLANK_FIXTURE,
    NUMERIC_FIXTURE,
    ORDERING_FIXTURE,
    RADIO_FIXTURE,
    STAR_FIXTURE,
    TRUE_FALSE_FIXTURE,
    WORD_BANK_FIXTURE
  } from '../exercise-question/question-fixtures';
  import { FIELDS } from './fields';
  import { cloneJson } from './checkpoint-types';
  import VideoCheckpointPlayerFrame from './video-checkpoint-player-frame.svelte';
  import VideoCheckpointTakeDemo from './video-checkpoint-take-demo.svelte';
  import VideoCheckpointTypePlayground from './video-checkpoint-type-playground.svelte';
  import VideoCheckpointEditDemo from './video-checkpoint-edit-demo.svelte';
  import VideoCheckpointEditPlayground from './video-checkpoint-edit-playground.svelte';

  const { Story } = defineMeta({
    title: 'Molecules/VideoCheckpoint',
    component: VideoCheckpoint.Overlay,
    parameters: {
      layout: 'padded',
      controls: { include: FIELDS },
      docs: {
        description: {
          component:
            'In-player checkpoint overlay chrome. The question body is ExerciseQuestion.QuestionRenderer (take in the player, edit in the teacher dialog). Overlay copy is host-supplied.'
        }
      }
    },
    argTypes: {
      onContinue: { control: false },
      questionBody: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Idle">
  {#snippet template()}
    <div class="mx-auto w-full max-w-3xl">
      <VideoCheckpointPlayerFrame />
    </div>
  {/snippet}
</Story>

<Story name="Take Unanswered">
  {#snippet template()}
    <VideoCheckpointTakeDemo question={cloneJson(RADIO_FIXTURE.question)} kicker="Question · 0:45 · Single answer" />
  {/snippet}
</Story>

<Story name="Take Answered">
  {#snippet template()}
    <VideoCheckpointTakeDemo
      question={cloneJson(RADIO_FIXTURE.question)}
      kicker="Question · 0:45 · Single answer"
      initialAnswer={cloneJson(RADIO_FIXTURE.answer)}
    />
  {/snippet}
</Story>

<Story name="Take Require Correct">
  {#snippet template()}
    <VideoCheckpointTakeDemo
      question={cloneJson(RADIO_FIXTURE.question)}
      kicker="Question · 0:45 · Single answer"
      initialAnswer={cloneJson(RADIO_FIXTURE.wrongAnswer)}
      resumePolicy="correct"
      correctAnswer={cloneJson(RADIO_FIXTURE.answer)}
      initialErrorMessage="Try again — that is not the correct answer."
    />
  {/snippet}
</Story>

<Story name="Reduced Motion">
  {#snippet template()}
    <VideoCheckpointTakeDemo question={cloneJson(RADIO_FIXTURE.question)} kicker="Question · 0:45 · Single answer" />
  {/snippet}
</Story>

<Story name="Take Radio">
  {#snippet template()}
    <VideoCheckpointTakeDemo question={cloneJson(RADIO_FIXTURE.question)} kicker="Question · 0:45 · Single answer" />
  {/snippet}
</Story>

<Story name="Take Checkbox">
  {#snippet template()}
    <VideoCheckpointTakeDemo
      question={cloneJson(CHECKBOX_FIXTURE.question)}
      kicker="Question · 1:20 · Multiple answers"
    />
  {/snippet}
</Story>

<Story name="Take True False">
  {#snippet template()}
    <VideoCheckpointTakeDemo
      question={cloneJson(TRUE_FALSE_FIXTURE.question)}
      kicker="Question · 2:14 · True / false"
    />
  {/snippet}
</Story>

<Story name="Take Numeric">
  {#snippet template()}
    <VideoCheckpointTakeDemo question={cloneJson(NUMERIC_FIXTURE.question)} kicker="Question · 3:02 · Numeric" />
  {/snippet}
</Story>

<Story name="Take Fill Blank">
  {#snippet template()}
    <VideoCheckpointTakeDemo
      question={cloneJson(FILL_BLANK_FIXTURE.question)}
      kicker="Question · 3:40 · Fill in the blank"
    />
  {/snippet}
</Story>

<Story name="Take Word Bank">
  {#snippet template()}
    <VideoCheckpointTakeDemo question={cloneJson(WORD_BANK_FIXTURE.question)} kicker="Question · 4:10 · Word bank" />
  {/snippet}
</Story>

<Story name="Take Ordering">
  {#snippet template()}
    <VideoCheckpointTakeDemo question={cloneJson(ORDERING_FIXTURE.question)} kicker="Question · 4:48 · Ordering" />
  {/snippet}
</Story>

<Story name="Take Star">
  {#snippet template()}
    <VideoCheckpointTakeDemo question={cloneJson(STAR_FIXTURE.question)} kicker="Question · 5:20 · Star rating" />
  {/snippet}
</Story>

<Story name="Take Type Playground">
  {#snippet template()}
    <VideoCheckpointTypePlayground />
  {/snippet}
</Story>

<Story name="Edit Radio">
  {#snippet template()}
    <VideoCheckpointEditDemo sourceQuestion={cloneJson(RADIO_FIXTURE.question)} />
  {/snippet}
</Story>

<Story name="Edit Type Playground">
  {#snippet template()}
    <VideoCheckpointEditPlayground />
  {/snippet}
</Story>
