<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { AttentionHighlight } from '@cio/ui/custom/attention-highlight';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/AttentionHighlight',
    component: AttentionHighlight,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import CheckIcon from '@lucide/svelte/icons/check';

  let singleHighlighted = $state(false);
  let targetedQuestionId = $state<string | null>(null);
  let customDurationHighlighted = $state(false);
  let counterTrigger = $state(0);
</script>

<Story name="Interactive Question Highlight">
  {#snippet template(args)}
    <div class="flex w-full max-w-md flex-col gap-4">
      <div class="flex items-center justify-between">
        <span class="ui:text-muted-foreground text-xs font-medium">Exercise Editor</span>
        <Button
          size="sm"
          variant="outline"
          disabled={singleHighlighted}
          onclick={() => {
            singleHighlighted = true;
          }}
        >
          <CheckIcon class="me-1.5 size-3.5" />
          {singleHighlighted ? 'Pulsing...' : 'Highlight Question'}
        </Button>
      </div>

      <AttentionHighlight
        {...args}
        highlight={singleHighlighted}
        duration={args.duration ?? 3}
        onComplete={() => {
          singleHighlighted = false;
        }}
      >
        <div class="ui:bg-card rounded-lg border p-4 shadow-sm">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <FileTextIcon class="ui:text-primary size-4" />
              <h4 class="text-sm font-semibold">Question 1: Multiple Choice</h4>
            </div>
            <Badge variant="secondary" class="text-[11px]">Auto-graded</Badge>
          </div>
          <p class="ui:text-muted-foreground mt-2 text-xs">
            What is the correct syntax for declaring a reactive state rune in Svelte 5?
          </p>
          <div class="mt-3 space-y-1.5">
            <div class="ui:bg-muted/40 rounded border px-3 py-1.5 font-mono text-xs">let count = $state(0);</div>
            <div class="ui:bg-muted/40 rounded border px-3 py-1.5 font-mono text-xs">let count = reactive(0);</div>
          </div>
        </div>
      </AttentionHighlight>
    </div>
  {/snippet}
</Story>

<Story name="Multiple Items Targeting">
  {#snippet template()}
    <div class="flex w-full max-w-lg flex-col gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <span class="ui:text-muted-foreground text-xs font-medium">Jump to question:</span>
        <Button
          size="sm"
          variant={targetedQuestionId === 'q1' ? 'default' : 'outline'}
          onclick={() => {
            targetedQuestionId = 'q1';
          }}
        >
          Question 1
        </Button>
        <Button
          size="sm"
          variant={targetedQuestionId === 'q2' ? 'default' : 'outline'}
          onclick={() => {
            targetedQuestionId = 'q2';
          }}
        >
          Question 2 (Free Text)
        </Button>
        <Button
          size="sm"
          variant={targetedQuestionId === 'q3' ? 'default' : 'outline'}
          onclick={() => {
            targetedQuestionId = 'q3';
          }}
        >
          Question 3
        </Button>
      </div>

      <div class="space-y-3">
        <AttentionHighlight
          id="q1"
          highlight={targetedQuestionId === 'q1'}
          onComplete={() => {
            targetedQuestionId = null;
          }}
        >
          <div class="ui:bg-card rounded-lg border p-3.5">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">1. Introduction to Web Development</span>
              <Badge variant="outline">Single Choice</Badge>
            </div>
          </div>
        </AttentionHighlight>

        <AttentionHighlight
          id="q2"
          highlight={targetedQuestionId === 'q2'}
          onComplete={() => {
            targetedQuestionId = null;
          }}
        >
          <div class="ui:border-destructive/30 ui:bg-card rounded-lg border p-3.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <TriangleAlertIcon class="ui:text-destructive size-4" />
                <span class="text-sm font-medium">2. Explain the Event Loop</span>
              </div>
              <Badge variant="destructive">Manual Review</Badge>
            </div>
            <p class="ui:text-muted-foreground mt-1 text-xs">
              Requires tutor grading — not supported in Public courses.
            </p>
          </div>
        </AttentionHighlight>

        <AttentionHighlight
          id="q3"
          highlight={targetedQuestionId === 'q3'}
          onComplete={() => {
            targetedQuestionId = null;
          }}
        >
          <div class="ui:bg-card rounded-lg border p-3.5">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">3. Code Output Prediction</span>
              <Badge variant="outline">Coding</Badge>
            </div>
          </div>
        </AttentionHighlight>
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Custom Duration">
  {#snippet template()}
    <div class="flex w-full max-w-md flex-col gap-4">
      <Button
        size="sm"
        variant="outline"
        disabled={customDurationHighlighted}
        onclick={() => {
          customDurationHighlighted = true;
        }}
      >
        <CheckIcon class="me-1.5 size-3.5" />
        {customDurationHighlighted ? 'Pulsing (5s)...' : 'Trigger 5s Pulse'}
      </Button>

      <AttentionHighlight
        highlight={customDurationHighlighted}
        duration={5}
        onComplete={() => {
          customDurationHighlighted = false;
        }}
      >
        <div class="ui:bg-muted/20 rounded-lg border p-4 text-center">
          <p class="text-sm font-medium">Extended 5-Second Attention Pulse</p>
          <p class="ui:text-muted-foreground mt-1 text-xs">
            Useful for longer instructional guides or critical settings warnings.
          </p>
        </div>
      </AttentionHighlight>
    </div>
  {/snippet}
</Story>

<Story name="Imperative Counter Trigger">
  {#snippet template()}
    <div class="flex w-full max-w-md flex-col gap-4">
      <div class="flex items-center justify-between">
        <span class="ui:text-muted-foreground text-xs font-medium">Trigger count: {counterTrigger}</span>
        <Button
          size="sm"
          variant="outline"
          onclick={() => {
            counterTrigger += 1;
          }}
        >
          <CheckIcon class="me-1.5 size-3.5" />
          Pulse Again (+1)
        </Button>
      </div>

      <AttentionHighlight trigger={counterTrigger}>
        <div class="ui:bg-card rounded-lg border p-4 shadow-sm">
          <h4 class="text-sm font-semibold">Imperatively Triggered Element</h4>
          <p class="ui:text-muted-foreground mt-1 text-xs">
            Incrementing the trigger counter triggers a new attention pulse each time without toggling a boolean flag.
          </p>
        </div>
      </AttentionHighlight>
    </div>
  {/snippet}
</Story>
