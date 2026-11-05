<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { NumberField } from '@cio/ui/custom/number-field';
  import { CheckboxField } from '@cio/ui/custom/checkbox-field';
  import { pluginsApi } from '../api/plugins.svelte';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import type { TPluginJsonSchema } from '@cio/utils/validation/plugin';

  interface Props {
    installationId: string;
    organizationId: string;
    schema: TPluginJsonSchema;
    settings: Record<string, unknown>;
  }

  let { installationId, organizationId, schema, settings }: Props = $props();

  function createDraft() {
    return structuredClone(settings);
  }

  let draft = $state<Record<string, unknown>>(createDraft());
  let isSaving = $state(false);
  const properties = $derived(Object.entries(schema.properties ?? {}));
  const hasChanges = $derived(JSON.stringify(draft) !== JSON.stringify(settings));

  function reset() {
    draft = structuredClone(settings);
  }

  async function save() {
    if (!hasChanges || isSaving) return;

    isSaving = true;
    try {
      await pluginsApi.updateSettings(installationId, draft, organizationId);
      settings = structuredClone(draft);
      snackbar.success('snackbar.settings.updated');
    } catch {
      snackbar.error('plugins.failed_update');
    } finally {
      isSaving = false;
    }
  }
</script>

{#if schema.type === 'object' && properties.length > 0}
  <div class="ui:border-border mt-6 space-y-4 border-t pt-5">
    {#each properties as [key, property] (key)}
      {@const label = property.title ?? key}
      {@const helperMessage = property.description ?? ''}
      {#if property.type === 'boolean'}
        <CheckboxField {label} checked={draft[key] === true} onclick={() => (draft[key] = draft[key] !== true)} />
      {:else if property.type === 'number' || property.type === 'integer'}
        <NumberField
          {label}
          {helperMessage}
          integer={property.type === 'integer'}
          min={property.minimum}
          max={property.maximum}
          value={typeof draft[key] === 'number' ? draft[key] : null}
          onValueChange={(value) => (draft[key] = value)}
        />
      {:else if property.type === 'string'}
        <InputField
          {label}
          {helperMessage}
          isRequired={schema.required?.includes(key)}
          maxLength={property.maxLength}
          value={typeof draft[key] === 'string' ? draft[key] : ''}
          onInput={(event) => (draft[key] = event.currentTarget.value)}
        />
      {/if}
    {/each}

    {#if hasChanges}
      <div class="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onclick={reset}>{$t('common.discard')}</Button>
        <Button size="sm" disabled={isSaving} onclick={save}>{$t('common.save_changes')}</Button>
      </div>
    {/if}
  </div>
{/if}
