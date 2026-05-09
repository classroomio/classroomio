<script lang="ts">
  import * as Select from '../../base/select';
  import type { ExerciseSectionAfterBehavior } from '@cio/question-types';

  interface SectionOption {
    id: string;
    title: string;
    order: number;
  }

  interface Props {
    sectionIndex: number;
    currentSectionId: string;
    allSections: SectionOption[];
    afterBehavior: ExerciseSectionAfterBehavior;
    onChange: (behavior: ExerciseSectionAfterBehavior) => void;
    labels: {
      afterSectionPrefix: string;
      continue: string;
      goToSection: string;
      submit: string;
    };
  }

  let { sectionIndex, currentSectionId, allSections, afterBehavior, onChange, labels }: Props = $props();

  const currentValue = $derived(
    afterBehavior.action === 'go_to_section' ? `go_to_section:${afterBehavior.exerciseSectionId}` : afterBehavior.action
  );

  function getOptionLabel(value: string) {
    if (value === 'continue') return labels.continue;
    if (value === 'submit') return labels.submit;

    const targetSectionId = value.replace('go_to_section:', '');
    const targetSection = allSections.find((section) => section.id === targetSectionId);
    return targetSection ? `${labels.goToSection}: ${targetSection.title}` : labels.goToSection;
  }

  function handleValueChange(value: string) {
    if (!value) return;

    if (value === 'continue' || value === 'submit') {
      onChange({ action: value });
      return;
    }

    const exerciseSectionId = value.replace('go_to_section:', '');
    onChange({ action: 'go_to_section', exerciseSectionId });
  }
</script>

<div
  class="ui:flex ui:items-center ui:justify-between ui:gap-3 ui:border ui:border-border ui:bg-muted/30 ui:px-3 ui:py-2"
>
  <p class="ui:text-sm ui:font-medium ui:text-muted-foreground">{labels.afterSectionPrefix} {sectionIndex + 1}</p>
  <Select.Root type="single" value={currentValue} onValueChange={handleValueChange}>
    <Select.Trigger class="ui:w-[260px]">{getOptionLabel(currentValue)}</Select.Trigger>
    <Select.Content>
      <Select.Item value="continue" label={labels.continue}>{labels.continue}</Select.Item>
      {#each allSections as section (section.id)}
        {#if section.id !== currentSectionId}
          <Select.Item value={`go_to_section:${section.id}`} label={`${labels.goToSection}: ${section.title}`}>
            {labels.goToSection}: {section.title}
          </Select.Item>
        {/if}
      {/each}
      <Select.Item value="submit" label={labels.submit}>{labels.submit}</Select.Item>
    </Select.Content>
  </Select.Root>
</div>
