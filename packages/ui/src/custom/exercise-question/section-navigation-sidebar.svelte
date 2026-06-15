<script lang="ts">
  interface SectionNavQuestion {
    key: string;
    label: string;
    isAnswered: boolean;
    isCurrent: boolean;
  }

  interface SectionNavGroup {
    id: string;
    title: string;
    questions: SectionNavQuestion[];
    isCurrent: boolean;
  }

  interface Props {
    sections: SectionNavGroup[];
  }

  let { sections }: Props = $props();
</script>

<aside class="ui:rounded-md ui:border ui:bg-background ui:p-3">
  <div class="ui:flex ui:flex-col ui:gap-3">
    {#each sections as section (section.id)}
      <div class="ui:space-y-2">
        <p class={`ui:text-xs ui:font-semibold ${section.isCurrent ? 'ui:text-primary' : 'ui:text-muted-foreground'}`}>
          {section.title}
        </p>
        <div class="ui:flex ui:flex-wrap ui:gap-1.5">
          {#each section.questions as question (question.key)}
            <span
              class={`ui:inline-flex ui:h-7 ui:min-w-7 ui:items-center ui:justify-center ui:rounded ui:border ui:px-1.5 ui:text-xs ui:font-medium ${question.isCurrent ? 'ui:border-primary ui:bg-primary ui:text-primary-foreground' : question.isAnswered ? 'ui:border-primary/40 ui:bg-primary/10 ui:text-primary' : 'ui:border-border ui:text-muted-foreground'}`}
            >
              {question.label}
            </span>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</aside>
