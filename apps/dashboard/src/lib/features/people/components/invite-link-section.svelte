<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Switch } from '@cio/ui/base/switch';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import CheckIcon from '@lucide/svelte/icons/check';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';

  interface Props {
    /** Empty until a link has been generated. */
    link: string;
    isRevoked: boolean;
    isLoading: boolean;
    /** How many people have joined with the link. */
    joinCount?: number;
    /** Overridden per resource so the copy names what the link joins. */
    titleKey?: string;
    descriptionKey?: string;
    onGenerate: () => void | Promise<void>;
    onToggle: (isRevoked: boolean) => void | Promise<void>;
  }

  let {
    link,
    isRevoked,
    isLoading,
    joinCount,
    titleKey = 'invite_link.title',
    descriptionKey = 'invite_link.description',
    onGenerate,
    onToggle
  }: Props = $props();

  let hasCopied = $state(false);
  let copiedTimeout: ReturnType<typeof setTimeout> | undefined;

  async function copyLink() {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      snackbar.success('invite_link.copied');

      hasCopied = true;
      clearTimeout(copiedTimeout);
      copiedTimeout = setTimeout(() => {
        hasCopied = false;
      }, 2000);
    } catch (error) {
      console.error('Failed to copy invite link', error);
      snackbar.error('invite_link.copy_failed');
    }
  }
</script>

<Field.Set>
  <Field.Legend>{$t(titleKey)}</Field.Legend>
  <Field.Description>{$t(descriptionKey)}</Field.Description>

  {#if link}
    <Field.Group>
      <Field.Field>
        <div class="flex items-center gap-2">
          <Input value={link} readonly class="w-full" aria-label={$t(titleKey)} />
          <IconButton
            variant="secondary"
            onclick={copyLink}
            tooltip={$t('invite_link.copy')}
            aria-label={$t('invite_link.copy')}
          >
            {#if hasCopied}
              <CheckIcon size={16} />
            {:else}
              <CopyIcon size={16} />
            {/if}
          </IconButton>
        </div>
      </Field.Field>

      <Field.Field orientation="horizontal">
        <Switch
          checked={!isRevoked}
          disabled={isLoading}
          onCheckedChange={(checked) => onToggle(!checked)}
          aria-label={$t('invite_link.toggle_label')}
        />
        <Field.Label>{$t('invite_link.toggle_label')}</Field.Label>
      </Field.Field>

      {#if isRevoked}
        <Field.Description class="ui:text-destructive">
          {$t('invite_link.disabled_notice')}
        </Field.Description>
      {:else if joinCount !== undefined}
        <Field.Description>
          {$t('invite_link.join_count', { count: joinCount })}
        </Field.Description>
      {/if}
    </Field.Group>
  {:else}
    <Button variant="secondary" onclick={onGenerate} loading={isLoading} disabled={isLoading}>
      {$t('invite_link.generate')}
    </Button>
  {/if}
</Field.Set>
