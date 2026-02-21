<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import * as Field from '@cio/ui/base/field';
  import { InputField } from '@cio/ui/custom/input-field';
  import { t } from '$lib/utils/functions/translations';
  import { inviteSettingsStore } from './store';
  import { INVITE_PRESET_OPTIONS, getPresetLabelKey } from './invite-utils';
</script>

<div class="rounded-md border p-4">
  <p class="mb-2 text-base font-semibold">{$t('course.navItem.people.invite_modal.student_invite_settings')}</p>
  <p class="text-muted-foreground mb-4 text-sm">
    {$t('course.navItem.people.invite_modal.student_invite_settings_description')}
  </p>
  <div class="grid gap-3 md:grid-cols-2">
    <Field.Field>
      <Field.Label for="student-invite-preset">{$t('course.navItem.people.invite_modal.preset')}</Field.Label>
      <Select.Root type="single" bind:value={$inviteSettingsStore.preset}>
        <Select.Trigger id="student-invite-preset" class="w-full">
          {$t(getPresetLabelKey($inviteSettingsStore.preset))}
        </Select.Trigger>
        <Select.Content>
          {#each INVITE_PRESET_OPTIONS as option}
            <Select.Item value={option.value}>{$t(option.labelKey)}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </Field.Field>

    {#if $inviteSettingsStore.preset === 'CUSTOM'}
      <div class="grid gap-3 md:col-span-2 md:grid-cols-2">
        <InputField
          label={$t('course.navItem.people.invite_modal.expires_at')}
          name="invite-expires-at"
          className="w-full"
          inputClassName="w-full"
          bind:value={$inviteSettingsStore.customExpiresAt}
          type="datetime-local"
        />
        <InputField
          label={$t('course.navItem.people.invite_modal.max_uses')}
          name="invite-max-uses"
          className="w-full"
          inputClassName="w-full"
          bind:value={$inviteSettingsStore.customMaxUses}
          type="number"
          min={1}
          max={1000}
        />
      </div>
    {/if}
  </div>
</div>
