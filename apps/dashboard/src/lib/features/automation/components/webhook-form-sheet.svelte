<script lang="ts">
  import { untrack } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import * as Field from '@cio/ui/base/field';
  import { Label } from '@cio/ui/base/label';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import * as Sheet from '@cio/ui/base/sheet';
  import { Switch } from '@cio/ui/base/switch';
  import { InputField } from '@cio/ui/custom/input-field';
  import { WEBHOOK_EVENT_TYPES } from '@cio/utils/constants/webhook';

  import { webhookApi } from '$features/automation/api/webhook.svelte';
  import type { Webhook, WebhookFormFields } from '$features/automation/utils/types';
  import {
    getDefaultWebhookFormFields,
    getEventGroupSelection,
    toWebhookEventTranslationKey,
    toWebhookFormFields,
    WEBHOOK_EVENT_GROUPS
  } from '$features/automation/utils/webhook-utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    webhook: Webhook | null;
    onClose: () => void;
  }

  let { webhook, onClose }: Props = $props();

  const T = 'automation.webhooks';

  let fields = $state<WebhookFormFields>(
    untrack(() => (webhook ? toWebhookFormFields(webhook) : getDefaultWebhookFormFields()))
  );

  const isEditing = untrack(() => webhook !== null);

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) return;

    webhookApi.resetErrors();
    onClose();
  }

  function toggleEvent(eventType: string, isChecked: boolean) {
    fields.eventTypes = isChecked
      ? [...fields.eventTypes, eventType]
      : fields.eventTypes.filter((selected) => selected !== eventType);
    webhookApi.clearError('eventTypes');
  }

  function toggleEventGroup(groupEventTypes: readonly string[], isChecked: boolean) {
    const withoutGroup = fields.eventTypes.filter((selected) => !groupEventTypes.includes(selected));
    fields.eventTypes = isChecked ? [...withoutGroup, ...groupEventTypes] : withoutGroup;
    webhookApi.clearError('eventTypes');
  }

  function toggleAllEvents(isChecked: boolean) {
    fields.eventTypes = isChecked ? [...WEBHOOK_EVENT_TYPES] : [];
    webhookApi.clearError('eventTypes');
  }

  const allEventsSelection = $derived(getEventGroupSelection(fields.eventTypes, WEBHOOK_EVENT_TYPES));

  async function handleSave() {
    const result = webhook ? await webhookApi.update(webhook.id, fields) : await webhookApi.create(fields);

    if (!result) return;

    onClose();
  }
</script>

<Sheet.Root open={true} onOpenChange={handleOpenChange}>
  <Sheet.Content class="w-full sm:max-w-xl" data-testid="webhook-form-sheet">
    <Sheet.Header>
      <Sheet.Title>{isEditing ? $t(`${T}.form.edit_title`) : $t(`${T}.form.create_title`)}</Sheet.Title>
      <Sheet.Description>{$t(`${T}.form.description`)}</Sheet.Description>
    </Sheet.Header>

    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
      <Field.Group>
        <Field.Set>
          <Field.Legend>{$t(`${T}.form.sections.endpoint`)}</Field.Legend>

          <Field.Group>
            <InputField
              name="webhook-name"
              testId="webhook-form-name"
              label={$t(`${T}.form.name`)}
              placeholder={$t(`${T}.form.name_placeholder`)}
              bind:value={fields.name}
              errorMessage={webhookApi.errors.name}
              onInput={() => webhookApi.clearError('name')}
              autoFocus
            />

            <InputField
              name="webhook-payload-url"
              testId="webhook-form-url"
              label={$t(`${T}.form.payload_url`)}
              placeholder="https://example.com/webhooks/classroomio"
              helperMessage={$t(`${T}.form.payload_url_help`)}
              bind:value={fields.payloadUrl}
              errorMessage={webhookApi.errors.payloadUrl}
              onInput={() => webhookApi.clearError('payloadUrl')}
            />

            <InputField
              name="webhook-secret"
              testId="webhook-form-secret"
              type="password"
              label={$t(`${T}.form.secret`)}
              placeholder={isEditing ? $t(`${T}.form.secret_edit_placeholder`) : $t(`${T}.form.secret_placeholder`)}
              helperMessage={isEditing ? $t(`${T}.form.secret_edit_help`) : $t(`${T}.form.secret_help`)}
              bind:value={fields.secret}
              errorMessage={webhookApi.errors.secret}
              onInput={() => webhookApi.clearError('secret')}
            />

            <Field.Field orientation="horizontal">
              <Switch bind:checked={fields.verifySsl} id="webhook-verify-ssl" />
              <Field.Content>
                <Field.Label for="webhook-verify-ssl">{$t(`${T}.form.verify_ssl`)}</Field.Label>
                <Field.Description>{$t(`${T}.form.verify_ssl_help`)}</Field.Description>
              </Field.Content>
            </Field.Field>

            <Field.Field orientation="horizontal">
              <Switch bind:checked={fields.isActive} id="webhook-active" />
              <Field.Content>
                <Field.Label for="webhook-active">{$t(`${T}.form.active`)}</Field.Label>
              </Field.Content>
            </Field.Field>
          </Field.Group>
        </Field.Set>

        <Field.Separator />

        <Field.Set>
          <Field.Legend>{$t(`${T}.form.sections.events`)}</Field.Legend>
          <Field.Description>{$t(`${T}.form.events_help`)}</Field.Description>

          <RadioGroup.Root bind:value={fields.eventMode} class="space-y-2">
            <div class="flex items-center gap-2">
              <RadioGroup.Item value="all" id="webhook-mode-all" />
              <Label for="webhook-mode-all" class="font-normal">{$t(`${T}.form.mode_all`)}</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroup.Item value="selected" id="webhook-mode-selected" />
              <Label for="webhook-mode-selected" class="font-normal">{$t(`${T}.form.mode_selected`)}</Label>
            </div>
          </RadioGroup.Root>

          {#if fields.eventMode === 'selected'}
            <Field.Group>
              <Field.Field orientation="horizontal">
                <Checkbox
                  id="webhook-events-all"
                  checked={allEventsSelection.isAllSelected}
                  indeterminate={allEventsSelection.isPartiallySelected}
                  onCheckedChange={(isChecked) => toggleAllEvents(isChecked === true)}
                  data-testid="webhook-events-select-all"
                />
                <Field.Content>
                  <Field.Label for="webhook-events-all">{$t(`${T}.form.select_all`)}</Field.Label>
                </Field.Content>
                <span class="ui:text-muted-foreground ml-auto text-xs">
                  {$t(`${T}.form.events_selected`, {
                    selected: fields.eventTypes.length,
                    total: WEBHOOK_EVENT_TYPES.length
                  })}
                </span>
              </Field.Field>

              {#each WEBHOOK_EVENT_GROUPS as group (group.key)}
                {@const groupSelection = getEventGroupSelection(fields.eventTypes, group.eventTypes)}
                <Field.Set>
                  <Field.Field orientation="horizontal">
                    <Checkbox
                      id={`webhook-group-${group.key}`}
                      checked={groupSelection.isAllSelected}
                      indeterminate={groupSelection.isPartiallySelected}
                      onCheckedChange={(isChecked) => toggleEventGroup(group.eventTypes, isChecked === true)}
                      data-testid={`webhook-group-${group.key}`}
                    />
                    <Field.Content>
                      <Field.Label for={`webhook-group-${group.key}`} class="font-semibold">
                        {$t(`${T}.event_groups.${group.key}`)}
                      </Field.Label>
                    </Field.Content>
                  </Field.Field>

                  {#each group.eventTypes as eventType (eventType)}
                    <Field.Field orientation="horizontal" class="pl-6">
                      <Checkbox
                        id={`webhook-event-${eventType}`}
                        checked={fields.eventTypes.includes(eventType)}
                        onCheckedChange={(isChecked) => toggleEvent(eventType, isChecked === true)}
                      />
                      <Field.Content>
                        <Field.Label for={`webhook-event-${eventType}`} class="font-mono text-xs">
                          {eventType}
                        </Field.Label>
                        <Field.Description>
                          {$t(`${T}.events.${toWebhookEventTranslationKey(eventType)}`)}
                        </Field.Description>
                      </Field.Content>
                    </Field.Field>
                  {/each}
                </Field.Set>
              {/each}

              {#if webhookApi.errors.eventTypes}
                <Field.Error>{webhookApi.errors.eventTypes}</Field.Error>
              {/if}
            </Field.Group>
          {/if}
        </Field.Set>
      </Field.Group>

      {#if webhookApi.errors.general}
        <Field.Error>{webhookApi.errors.general}</Field.Error>
      {/if}
    </div>

    <Sheet.Footer>
      <div class="flex justify-end gap-2">
        <Button variant="outline" size="sm" onclick={() => handleOpenChange(false)}>{$t(`${T}.form.cancel`)}</Button>
        <Button size="sm" onclick={handleSave} loading={webhookApi.isLoading} testId="webhook-form-save">
          {$t(`${T}.form.save`)}
        </Button>
      </div>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
