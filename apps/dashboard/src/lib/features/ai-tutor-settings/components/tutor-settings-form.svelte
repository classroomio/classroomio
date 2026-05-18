<script lang="ts">
  import type { Writable } from 'svelte/store';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Switch } from '@cio/ui/base/switch';
  import { Label } from '@cio/ui/base/label';
  import * as Select from '@cio/ui/base/select';

  import { t } from '$lib/utils/functions/translations';
  import type { AiTutorSettings } from '@cio/ai-assistant/tutor-config';

  interface Props {
    store: Writable<AiTutorSettings>;
    disabled?: boolean;
  }

  let { store, disabled = false }: Props = $props();

  const personaOptions = [
    { value: 'encouraging', labelKey: 'aiTutor.persona.encouraging' as const },
    { value: 'friendly', labelKey: 'aiTutor.persona.friendly' as const },
    { value: 'formal', labelKey: 'aiTutor.persona.formal' as const },
    { value: 'socratic', labelKey: 'aiTutor.persona.socratic' as const },
    { value: 'custom', labelKey: 'aiTutor.persona.custom' as const }
  ];

  const responseLengthOptions = [
    { value: 'short', labelKey: 'aiTutor.responseLength.short' as const },
    { value: 'medium', labelKey: 'aiTutor.responseLength.medium' as const },
    { value: 'long', labelKey: 'aiTutor.responseLength.long' as const }
  ];

  const assessmentModeOptions = [
    { value: 'hint_only', labelKey: 'aiTutor.assessmentMode.hint_only' as const },
    { value: 'direct_answer', labelKey: 'aiTutor.assessmentMode.direct_answer' as const },
    { value: 'block_during_exercise', labelKey: 'aiTutor.assessmentMode.block_during_exercise' as const }
  ];

  const codePolicyOptions = [
    { value: 'hints_only', labelKey: 'aiTutor.codePolicy.hints_only' as const },
    { value: 'allowed', labelKey: 'aiTutor.codePolicy.allowed' as const },
    { value: 'forbidden', labelKey: 'aiTutor.codePolicy.forbidden' as const }
  ];

  const groundingScopeOptions = [
    { value: 'course', labelKey: 'aiTutor.groundingScope.course' as const },
    { value: 'lesson', labelKey: 'aiTutor.groundingScope.lesson' as const },
    { value: 'workspace', labelKey: 'aiTutor.groundingScope.workspace' as const }
  ];

  let forbiddenTopicsInput = $state($store.forbiddenTopics.join(', '));

  $effect(() => {
    forbiddenTopicsInput = $store.forbiddenTopics.join(', ');
  });

  function syncForbiddenTopics() {
    const list = forbiddenTopicsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 20);
    store.update((value) => ({ ...value, forbiddenTopics: list }));
  }
</script>

<Field.Group>
  <Field.Set>
    <Field.Legend>{$t('aiTutor.section.availability')}</Field.Legend>
    <Field.Description>{$t('aiTutor.section.availability_description')}</Field.Description>

    <Field.Field orientation="horizontal">
      <Switch bind:checked={$store.enabled} {disabled} />
      <Field.Label>{$t('aiTutor.field.enabled')}</Field.Label>
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('aiTutor.section.personality')}</Field.Legend>
    <Field.Description>{$t('aiTutor.section.personality_description')}</Field.Description>

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('aiTutor.field.persona')}</Field.Label>
        <Select.Root type="single" bind:value={$store.persona} {disabled}>
          <Select.Trigger
            >{$t(
              personaOptions.find((o) => o.value === $store.persona)?.labelKey ?? 'aiTutor.persona.encouraging'
            )}</Select.Trigger
          >
          <Select.Content>
            {#each personaOptions as opt (opt.value)}
              <Select.Item value={opt.value}>{$t(opt.labelKey)}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>

      {#if $store.persona === 'custom'}
        <Field.Field>
          <Field.Label>{$t('aiTutor.field.customPersona')}</Field.Label>
          <Textarea rows={3} bind:value={$store.customPersona} {disabled} />
          <Field.Description>{$t('aiTutor.field.customPersona_description')}</Field.Description>
        </Field.Field>
      {/if}

      <Field.Field>
        <Field.Label>{$t('aiTutor.field.responseLength')}</Field.Label>
        <Select.Root type="single" bind:value={$store.responseLength} {disabled}>
          <Select.Trigger
            >{$t(
              responseLengthOptions.find((o) => o.value === $store.responseLength)?.labelKey ??
                'aiTutor.responseLength.medium'
            )}</Select.Trigger
          >
          <Select.Content>
            {#each responseLengthOptions as opt (opt.value)}
              <Select.Item value={opt.value}>{$t(opt.labelKey)}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('aiTutor.field.welcomeMessage')}</Field.Label>
        <Textarea rows={2} maxlength={500} bind:value={$store.welcomeMessage} {disabled} />
        <Field.Description>{$t('aiTutor.field.welcomeMessage_description')}</Field.Description>
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('aiTutor.field.disclaimerFooter')}</Field.Label>
        <Input maxlength={200} bind:value={$store.disclaimerFooter} {disabled} />
        <Field.Description>{$t('aiTutor.field.disclaimerFooter_description')}</Field.Description>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('aiTutor.section.guidance')}</Field.Legend>
    <Field.Description>{$t('aiTutor.section.guidance_description')}</Field.Description>

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('aiTutor.field.thingsToSay')}</Field.Label>
        <Textarea rows={3} maxlength={2000} bind:value={$store.thingsToSay} {disabled} />
        <Field.Description>{$t('aiTutor.field.thingsToSay_description')}</Field.Description>
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('aiTutor.field.thingsNotToSay')}</Field.Label>
        <Textarea rows={3} maxlength={2000} bind:value={$store.thingsNotToSay} {disabled} />
        <Field.Description>{$t('aiTutor.field.thingsNotToSay_description')}</Field.Description>
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('aiTutor.field.forbiddenTopics')}</Field.Label>
        <Input
          bind:value={forbiddenTopicsInput}
          onblur={syncForbiddenTopics}
          placeholder={$t('aiTutor.field.forbiddenTopics_placeholder')}
          {disabled}
        />
        <Field.Description>{$t('aiTutor.field.forbiddenTopics_description')}</Field.Description>
      </Field.Field>

      <Field.Field orientation="horizontal">
        <Switch bind:checked={$store.blockOffTopic} {disabled} />
        <Label>{$t('aiTutor.field.blockOffTopic')}</Label>
      </Field.Field>

      <Field.Field orientation="horizontal">
        <Switch bind:checked={$store.profanityFilter} {disabled} />
        <Label>{$t('aiTutor.field.profanityFilter')}</Label>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('aiTutor.section.assessment')}</Field.Legend>
    <Field.Description>{$t('aiTutor.section.assessment_description')}</Field.Description>

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('aiTutor.field.assessmentMode')}</Field.Label>
        <Select.Root type="single" bind:value={$store.assessmentMode} {disabled}>
          <Select.Trigger
            >{$t(
              assessmentModeOptions.find((o) => o.value === $store.assessmentMode)?.labelKey ??
                'aiTutor.assessmentMode.hint_only'
            )}</Select.Trigger
          >
          <Select.Content>
            {#each assessmentModeOptions as opt (opt.value)}
              <Select.Item value={opt.value}>{$t(opt.labelKey)}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('aiTutor.field.revealSolutionsAfterAttempts')}</Field.Label>
        <Input
          type="number"
          min="0"
          max="20"
          value={$store.revealSolutionsAfterAttempts}
          oninput={(e) => {
            const v = Number((e.target as HTMLInputElement).value);
            if (Number.isFinite(v)) store.update((s) => ({ ...s, revealSolutionsAfterAttempts: v }));
          }}
          {disabled}
        />
        <Field.Description>{$t('aiTutor.field.revealSolutionsAfterAttempts_description')}</Field.Description>
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('aiTutor.field.codePolicy')}</Field.Label>
        <Select.Root type="single" bind:value={$store.codePolicy} {disabled}>
          <Select.Trigger
            >{$t(
              codePolicyOptions.find((o) => o.value === $store.codePolicy)?.labelKey ?? 'aiTutor.codePolicy.hints_only'
            )}</Select.Trigger
          >
          <Select.Content>
            {#each codePolicyOptions as opt (opt.value)}
              <Select.Item value={opt.value}>{$t(opt.labelKey)}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('aiTutor.section.grounding')}</Field.Legend>
    <Field.Description>{$t('aiTutor.section.grounding_description')}</Field.Description>

    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('aiTutor.field.groundingScope')}</Field.Label>
        <Select.Root type="single" bind:value={$store.groundingScope} {disabled}>
          <Select.Trigger
            >{$t(
              groundingScopeOptions.find((o) => o.value === $store.groundingScope)?.labelKey ??
                'aiTutor.groundingScope.course'
            )}</Select.Trigger
          >
          <Select.Content>
            {#each groundingScopeOptions as opt (opt.value)}
              <Select.Item value={opt.value}>{$t(opt.labelKey)}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>

      <Field.Field orientation="horizontal">
        <Switch bind:checked={$store.requireCitations} {disabled} />
        <Label>{$t('aiTutor.field.requireCitations')}</Label>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('aiTutor.section.escalation')}</Field.Legend>
    <Field.Description>{$t('aiTutor.section.escalation_description')}</Field.Description>

    <Field.Group>
      <Field.Field orientation="horizontal">
        <Switch bind:checked={$store.escalation.enabled} {disabled} />
        <Label>{$t('aiTutor.field.escalationEnabled')}</Label>
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('aiTutor.field.escalationEmail')}</Field.Label>
        <Input
          type="email"
          bind:value={$store.escalation.email}
          placeholder="instructor@example.com"
          disabled={disabled || !$store.escalation.enabled}
        />
      </Field.Field>
    </Field.Group>
  </Field.Set>
</Field.Group>
