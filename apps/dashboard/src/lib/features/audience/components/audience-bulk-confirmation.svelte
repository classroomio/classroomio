<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Field from '@cio/ui/base/field';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { t } from '$lib/utils/functions/translations';
  import type { AudienceBulkAction, BulkAudiencePreview } from '$features/org/utils/types';

  interface Props {
    open: boolean;
    action: AudienceBulkAction | null;
    /** How many learners the action will hit. Always exact, never approximate. */
    count: number;
    /** Populated for filter-mode actions; carries the sample and the archive gate. */
    preview?: BulkAudiencePreview | null;
    isApplying?: boolean;
    onConfirm: (reason: string | undefined) => void | Promise<void>;
    onExportFirst?: () => void;
  }

  let {
    open = $bindable(false),
    action,
    count,
    preview = null,
    isApplying = false,
    onConfirm,
    onExportFirst
  }: Props = $props();

  let reason = $state('');
  let typedConfirmation = $state('');

  const isDestructive = $derived(action === 'delete');

  // Type-to-confirm is a client-side addition on top of the server's
  // archived-only gate, never an alternative to it.
  const requiresTypedCount = $derived(isDestructive);
  const typedCountMatches = $derived(typedConfirmation.trim() === String(count));

  const blockedByArchiveGate = $derived(isDestructive && (preview?.notArchivedCount ?? 0) > 0);
  const canConfirm = $derived(
    !isApplying && count > 0 && !blockedByArchiveGate && (!requiresTypedCount || typedCountMatches)
  );

  const titleKey = $derived(action ? `audience.bulk.confirm_title.${action}` : 'audience.bulk.confirm_title.archive');
  const bodyKey = $derived(action ? `audience.bulk.confirm_body.${action}` : 'audience.bulk.confirm_body.archive');

  function resetForm() {
    reason = '';
    typedConfirmation = '';
  }

  // Reset on the close transition rather than in an effect keyed to `!open`,
  // which would rewrite state on every render while the dialog is shut.
  function handleOpenChange(isOpen: boolean) {
    open = isOpen;

    if (!isOpen) {
      resetForm();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="w-full max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{$t(titleKey, { count })}</Dialog.Title>
      <Dialog.Description>{$t(bodyKey, { count })}</Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      {#if blockedByArchiveGate}
        <p class="ui:text-destructive text-sm">
          {$t('audience.bulk.not_archived_blocker', { count: preview?.notArchivedCount ?? 0 })}
        </p>
      {/if}

      {#if preview?.sample?.length}
        <div class="space-y-1 rounded-md border px-3 py-2">
          <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
            {$t('audience.bulk.sample_heading')}
          </p>
          <ul class="ui:text-muted-foreground space-y-0.5 text-sm">
            {#each preview.sample as sampleMember (sampleMember.id)}
              <li>{sampleMember.email}</li>
            {/each}
          </ul>
          {#if count > preview.sample.length}
            <p class="ui:text-muted-foreground text-xs">
              {$t('audience.bulk.sample_more', { count: count - preview.sample.length })}
            </p>
          {/if}
        </div>
      {/if}

      {#if onExportFirst}
        <!-- Exporting before acting is the step that makes the loop safe: the
             admin circulates the list for sign-off, then applies. -->
        <Button variant="outline" size="sm" onclick={onExportFirst} disabled={isApplying}>
          {$t('audience.bulk.export_first')}
        </Button>
      {/if}

      <Field.Field>
        <Field.Label for="audience-bulk-reason">{$t('audience.bulk.reason_label')}</Field.Label>
        <Textarea id="audience-bulk-reason" bind:value={reason} disabled={isApplying} rows={2} />
        <Field.Description>{$t('audience.bulk.reason_hint')}</Field.Description>
      </Field.Field>

      {#if requiresTypedCount}
        <Field.Field>
          <Field.Label for="audience-bulk-typed">{$t('audience.bulk.type_count_label', { count })}</Field.Label>
          <Input id="audience-bulk-typed" bind:value={typedConfirmation} disabled={isApplying} />
          <Field.Description>{$t('audience.bulk.delete_is_permanent')}</Field.Description>
        </Field.Field>
      {/if}

      <div class="flex justify-end gap-2">
        <Button variant="outline" onclick={() => handleOpenChange(false)} disabled={isApplying}>
          {$t('audience.delete.cancel')}
        </Button>
        <Button
          testId="audience-bulk-confirm"
          variant={isDestructive ? 'destructive' : 'default'}
          onclick={() => onConfirm(reason.trim() || undefined)}
          loading={isApplying}
          disabled={!canConfirm}
        >
          {$t(`audience.bulk.confirm_action.${action ?? 'archive'}`)}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
