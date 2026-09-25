<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import * as Field from '@cio/ui/base/field';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import SaveIcon from '@lucide/svelte/icons/save';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    templateName: string;
    isSaving?: boolean;
    onBack: () => void;
    onPreview: () => void;
    onSave: () => void;
  }

  let { templateName = $bindable(''), isSaving = false, onBack, onPreview, onSave }: Props = $props();
</script>

<header
  class="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-900"
>
  <div class="flex items-center gap-3">
    <Button
      variant="ghost"
      size="sm"
      onclick={onBack}
      class="gap-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
    >
      <ArrowLeftIcon class="size-4" />
      <span>{$t('certificate_studio.back_to_studio')}</span>
    </Button>

    <div class="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>

    <Field.Field orientation="horizontal" class="items-center gap-2">
      <Field.Label class="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {$t('certificate_studio.template_name')}
      </Field.Label>
      <div class="relative w-64 sm:w-80">
        <Input
          bind:value={templateName}
          class="h-8 border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          placeholder="e.g. Acme Honors Gold 2026"
        />
      </div>
    </Field.Field>
  </div>

  <div class="flex items-center gap-2.5">
    <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs" onclick={onPreview}>
      <EyeIcon class="size-3.5 text-slate-500" />
      <span>{$t('certificate_studio.preview')}</span>
    </Button>

    <Button size="sm" class="h-8 gap-1.5 text-xs font-semibold" disabled={isSaving} onclick={onSave}>
      {#if isSaving}
        <Loader2Icon class="size-3.5 animate-spin" />
        <span>{$t('certificate_studio.saving')}</span>
      {:else}
        <SaveIcon class="size-3.5" />
        <span>{$t('certificate_studio.save')}</span>
      {/if}
    </Button>
  </div>
</header>
