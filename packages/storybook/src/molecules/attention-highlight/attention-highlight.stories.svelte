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
  import TriangleAlertIcon from '@lucide/svelte/icons/alert-triangle';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import CheckIcon from '@lucide/svelte/icons/check';

  let singleHighlighted = $state(false);
  let targetedQuestionId = $state<string | null>(null);
  let customDurationHighlighted = $state(false);
</script>

<Story name="Interactive Question Highlight">
  {#snippet template(args)}
    <div class="ui:flex ui:w-full ui:max-w-md ui:flex-col ui:gap-4">
      <div class="ui:flex ui:items-center ui:justify-between">
        <span class="ui:text-muted-foreground ui:text-xs font-medium">Exercise Editor</span>
        <Button
          size="sm"
          variant="outline"
          disabled={singleHighlighted}
          onclick={() => {
            singleHighlighted = true;
          }}
        >
          <CheckIcon class="ui:me-1.5 ui:size-3.5" />
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
        <div class="ui:rounded-lg ui:border ui:bg-card ui:p-4 ui:shadow-sm">
          <div class="ui:flex ui:items-start ui:justify-between ui:gap-2">
            <div class="ui:flex ui:items-center ui:gap-2">
              <FileTextIcon class="ui:size-4 ui:text-primary" />
              <h4 class="ui:text-sm ui:font-semibold">Question 1: Multiple Choice</h4>
            </div>
            <Badge variant="secondary" class="ui:text-[11px]">Auto-graded</Badge>
          </div>
          <p class="ui:text-muted-foreground ui:mt-2 ui:text-xs">
            What is the correct syntax for declaring a reactive state rune in Svelte 5?
          </p>
          <div class="ui:mt-3 ui:space-y-1.5">
            <div class="ui:rounded ui:border ui:bg-muted/40 ui:px-3 ui:py-1.5 ui:text-xs font-mono">
              let count = $state(0);
            </div>
            <div class="ui:rounded ui:border ui:bg-muted/40 ui:px-3 ui:py-1.5 ui:text-xs font-mono">
              let count = reactive(0);
            </div>
          </div>
        </div>
      </AttentionHighlight>
    </div>
  {/snippet}
</Story>

<Story name="Multiple Items Targeting">
  {#snippet template()}
    <div class="ui:flex ui:w-full ui:max-w-lg ui:flex-col ui:gap-4">
      <div class="ui:flex ui:flex-wrap ui:items-center ui:gap-2">
        <span class="ui:text-muted-foreground ui:text-xs font-medium">Jump to question:</span>
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

      <div class="ui:space-y-3">
        <AttentionHighlight
          id="q1"
          highlight={targetedQuestionId === 'q1'}
          onComplete={() => {
            targetedQuestionId = null;
          }}
        >
          <div class="ui:rounded-lg ui:border ui:bg-card ui:p-3.5">
            <div class="ui:flex ui:items-center ui:justify-between">
              <span class="ui:text-sm ui:font-medium">1. Introduction to Web Development</span>
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
          <div class="ui:rounded-lg ui:border ui:border-destructive/30 ui:bg-card ui:p-3.5">
            <div class="ui:flex ui:items-center ui:justify-between">
              <div class="ui:flex ui:items-center ui:gap-2">
                <TriangleAlertIcon class="ui:size-4 ui:text-destructive" />
                <span class="ui:text-sm ui:font-medium">2. Explain the Event Loop</span>
              </div>
              <Badge variant="destructive">Manual Review</Badge>
            </div>
            <p class="ui:text-muted-foreground ui:mt-1 ui:text-xs">
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
          <div class="ui:rounded-lg ui:border ui:bg-card ui:p-3.5">
            <div class="ui:flex ui:items-center ui:justify-between">
              <span class="ui:text-sm ui:font-medium">3. Code Output Prediction</span>
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
    <div class="ui:flex ui:w-full ui:max-w-md ui:flex-col ui:gap-4">
      <Button
        size="sm"
        variant="outline"
        disabled={customDurationHighlighted}
        onclick={() => {
          customDurationHighlighted = true;
        }}
      >
        <CheckIcon class="ui:me-1.5 ui:size-3.5" />
        {customDurationHighlighted ? 'Pulsing (5s)...' : 'Trigger 5s Pulse'}
      </Button>

      <AttentionHighlight
        highlight={customDurationHighlighted}
        duration={5}
        onComplete={() => {
          customDurationHighlighted = false;
        }}
      >
        <div class="ui:rounded-lg ui:border ui:bg-muted/20 ui:p-4 text-center">
          <p class="ui:text-sm ui:font-medium">Extended 5-Second Attention Pulse</p>
          <p class="ui:text-muted-foreground ui:mt-1 ui:text-xs">
            Useful for longer instructional guides or critical settings warnings.
          </p>
        </div>
      </AttentionHighlight>
    </div>
  {/snippet}
</Story>
