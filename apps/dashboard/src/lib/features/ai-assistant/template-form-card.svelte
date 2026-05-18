<script lang="ts">
  import type { CourseTemplateId, TemplateFormField } from '@cio/ai-assistant';
  import { getCourseTemplate } from '@cio/ai-assistant';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import * as Select from '@cio/ui/base/select';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import { t } from '$lib/utils/functions/translations';
  import { DISPLAY_BY_ID } from '$features/ai-assistant/utils/template-display';
  import type { AiAssistantMessage } from '$features/ai-assistant/utils/types';

  interface Props {
    templateId: CourseTemplateId;
    fields: TemplateFormField[];
    allMessages: AiAssistantMessage[];
    submitted: boolean;
    /** True while the `ask_template_questions` tool is still in progress (not the global chat busy flag). */
    disableFormInputs: boolean;
    onSubmit: (payload: {
      templateId: CourseTemplateId;
      answers: Record<string, string>;
      fields: TemplateFormField[];
    }) => void;
    onSkip: (payload: { templateId: CourseTemplateId }) => void;
  }

  let { templateId, fields, allMessages, submitted, disableFormInputs, onSubmit, onSkip }: Props = $props();

  const display = $derived(DISPLAY_BY_ID[templateId]);

  let answers = $state<Record<string, string>>({});

  $effect.pre(() => {
    void templateId;
    void fields;
    const next: Record<string, string> = {};

    for (const field of fields ?? []) {
      if (!field?.id) {
        continue;
      }

      if (field.type === 'select') {
        next[field.id] = field.options?.[0]?.value ?? '';
      } else {
        next[field.id] = '';
      }
    }

    answers = next;
  });

  const resolutionKind = $derived.by((): 'submitted' | 'skipped' | null => {
    for (let index = allMessages.length - 1; index >= 0; index -= 1) {
      const message = allMessages[index];

      if (message.role !== 'user') {
        continue;
      }

      const tmpl = message.metadata?.template;

      if (!tmpl || !('action' in tmpl)) {
        continue;
      }

      if (tmpl.templateId !== templateId) {
        continue;
      }

      if (tmpl.action === 'submit_template_answers') {
        return 'submitted';
      }

      if (tmpl.action === 'skip_template_form') {
        return 'skipped';
      }
    }

    return null;
  });

  function resolveFieldLabel(field: TemplateFormField): string {
    const key = display?.fieldLabelKeys?.[field.id];

    if (key) {
      const translated = t.get(key);

      if (translated && translated !== key) {
        return translated;
      }
    }

    return field.label;
  }

  function resolveFormTitle(): string {
    const key = display?.formTitleKey;

    if (!key) {
      return getCourseTemplate(templateId)?.formTitle ?? '';
    }

    const translated = t.get(key);

    if (translated && translated !== key) {
      return translated;
    }

    return getCourseTemplate(templateId)?.formTitle ?? '';
  }

  function isValidHttpUrl(value: string): boolean {
    if (!value.trim()) {
      return true;
    }

    try {
      const parsed = new URL(value);

      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  const canSubmit = $derived.by(() => {
    if (submitted || disableFormInputs) {
      return false;
    }

    for (const field of fields ?? []) {
      if (!field?.id) {
        continue;
      }

      const raw = answers[field.id] ?? '';
      const trimmed = raw.trim();

      if (field.type === 'select' && !field.options?.length) {
        return false;
      }

      if (field.required && !trimmed) {
        return false;
      }

      if (field.type === 'url' && trimmed && !isValidHttpUrl(trimmed)) {
        return false;
      }
    }

    return true;
  });

  function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    onSubmit({ templateId, answers: { ...answers }, fields });
  }
</script>

<div class="ui:bg-card max-w-md rounded-xl border p-4">
  <h4 class="ui:text-foreground mb-3 text-sm font-medium">{resolveFormTitle()}</h4>

  {#if submitted}
    <p class="ui:text-muted-foreground text-sm">
      {resolutionKind === 'skipped'
        ? $t('course.creator.template.skipped_summary')
        : $t('course.creator.template.submitted_summary')}
    </p>
  {:else}
    <div class="flex flex-col gap-4">
      {#each fields as field (field.id)}
        {#if field.type === 'text'}
          <InputField
            label={resolveFieldLabel(field)}
            bind:value={answers[field.id]}
            placeholder={field.placeholder ?? ''}
            isRequired={field.required === true}
            isDisabled={disableFormInputs}
          />
        {:else if field.type === 'textarea'}
          <TextareaField
            label={resolveFieldLabel(field)}
            bind:value={answers[field.id]}
            placeholder={field.placeholder ?? ''}
            isRequired={field.required === true}
            disabled={disableFormInputs}
            rows={4}
          />
        {:else if field.type === 'select'}
          <Field.Field>
            <Field.Label>
              {resolveFieldLabel(field)}
              {#if field.required}
                <span class="ui:text-red-700">*</span>
              {/if}
            </Field.Label>
            <Select.Root type="single" bind:value={answers[field.id]} disabled={disableFormInputs}>
              <Select.Trigger class="ui:w-full">
                {(field.options ?? []).find((option) => option.value === answers[field.id])?.label ?? ''}
              </Select.Trigger>
              <Select.Content style="z-index: 251">
                {#each field.options ?? [] as option (option.value)}
                  <Select.Item value={option.value} label={option.label}>
                    {option.label}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </Field.Field>
        {:else if field.type === 'url'}
          <div class="flex flex-col gap-1">
            <div class="flex items-start gap-2">
              <GlobeIcon class="ui:text-muted-foreground mt-2.5 size-4 shrink-0" />
              <div class="min-w-0 flex-1">
                <InputField
                  label={resolveFieldLabel(field)}
                  bind:value={answers[field.id]}
                  placeholder={field.placeholder ?? ''}
                  type="url"
                  isRequired={false}
                  isDisabled={disableFormInputs}
                />
              </div>
            </div>
            <p class="ui:text-muted-foreground pl-7 text-xs">
              {$t('course.creator.template.field.documentation_url.hint')}
            </p>
          </div>
        {/if}
      {/each}

      <div class="flex flex-col gap-2">
        <Button size="sm" disabled={!canSubmit} onclick={handleSubmit}>
          {$t('course.creator.template.submit')}
        </Button>
        <button
          type="button"
          class="ui:text-muted-foreground hover:ui:text-foreground text-xs underline-offset-2 hover:underline"
          disabled={disableFormInputs}
          onclick={() => onSkip({ templateId })}
        >
          {$t('course.creator.template.skip')}
        </button>
      </div>
    </div>
  {/if}
</div>
