<script lang="ts">
  import { resolve } from '$app/paths';
  import { currentOrgPath } from '$lib/utils/store/org';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import { InputField } from '@cio/ui/custom/input-field';
  import { t } from '$lib/utils/functions/translations';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import PencilIcon from '@lucide/svelte/icons/pencil';

  interface Props {
    draftName: string;
    status: string;
    isPaidPlan: boolean;
    isDirty: boolean;
    layoutValidationError: string | null;
    editingName: boolean;
    onSave: () => void;
    onPublish: () => void;
    onDiscard: () => void;
    onRenameStart: () => void;
    onRenameFinish: () => void;
  }

  let {
    draftName = $bindable(),
    status,
    isPaidPlan,
    isDirty,
    layoutValidationError,
    editingName,
    onSave,
    onPublish,
    onDiscard,
    onRenameStart,
    onRenameFinish
  }: Props = $props();
</script>

<header
  class="ui:border-border ui:bg-background ui:text-foreground flex shrink-0 items-center justify-between gap-3 border-b px-3 py-3"
>
  <div class="flex min-w-0 flex-1 items-center gap-2">
    <Button
      variant="ghost"
      size="icon"
      href={resolve(`${$currentOrgPath}/widgets`, {})}
      class="ui:size-8 shrink-0"
      aria-label={$t('widgets.actions.back')}
    >
      <ArrowLeftIcon class="size-4" />
    </Button>

    <div class="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      {#if editingName}
        <div class="flex max-w-md items-center gap-2">
          <InputField
            label={$t('widgets.form.name')}
            bind:value={draftName}
            className="min-w-[12rem]"
            labelClassName="sr-only"
            autoFocus
          />
          <Button variant="secondary" size="sm" type="button" onclick={onRenameFinish}>
            {$t('widgets.editor.finish_editing_name')}
          </Button>
        </div>
      {:else}
        <div class="flex min-w-0 items-center gap-1.5">
          <h1 class="truncate text-sm tracking-tight sm:text-base">{draftName}</h1>
          <Button
            variant="ghost"
            size="icon-sm"
            type="button"
            onclick={onRenameStart}
            class="shrink-0"
            aria-label={$t('widgets.editor.rename_widget')}
          >
            <PencilIcon class="size-3.5" />
          </Button>
        </div>
      {/if}

      <div class="flex flex-wrap items-center gap-1">
        <Badge variant="secondary" class="text-[10px] uppercase">
          {$t(`widgets.status.${status.toLowerCase()}`)}
        </Badge>
        <Badge variant="outline" class="text-[10px]">
          {isPaidPlan ? $t('widgets.plan.paid') : $t('widgets.plan.free')}
        </Badge>
      </div>
    </div>
  </div>

  <div class="flex shrink-0 items-center gap-1.5">
    {#if isDirty}
      <Button variant="ghost" size="sm" type="button" onclick={onDiscard} class="hidden sm:inline-flex">
        {$t('widgets.editor.discard_short')}
      </Button>
    {/if}
    <Button
      variant="outline"
      size="sm"
      type="button"
      disabled={!isDirty || Boolean(layoutValidationError)}
      onclick={onSave}
    >
      {$t('widgets.editor.save_changes')}
    </Button>
    <Button size="sm" type="button" disabled={Boolean(layoutValidationError)} onclick={onPublish}>
      {$t('widgets.actions.publish')}
    </Button>
  </div>
</header>
