<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import PackageIcon from '@lucide/svelte/icons/package';

  import { packageApi } from '$features/course/api/package.svelte';
  import type { CreatedPackageCourses } from '$features/course/utils/types';
  import { t } from '$lib/utils/functions/translations';

  export interface DialogPackage {
    assetId: string;
    title: string;
    moduleCount: number | null;
  }

  interface Props {
    open?: boolean;
    packages?: DialogPackage[];
    onCreated?: (courses: CreatedPackageCourses) => void;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = $bindable(false), packages = [], onCreated = () => {}, onOpenChange = () => {} }: Props = $props();

  let titles = $state<Record<string, string>>({});
  let isCreating = $state(false);

  const courseType = 'SELF_PACED' as const;

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;

    if (isOpen) {
      titles = Object.fromEntries(packages.map((entry) => [entry.assetId, entry.title]));
      isCreating = false;
    }

    onOpenChange(isOpen);
  }

  $effect(() => {
    for (const entry of packages) {
      if (!(entry.assetId in titles)) {
        titles[entry.assetId] = entry.title;
      }
    }
  });

  async function handleCreate() {
    if (packages.length === 0 || isCreating) return;

    isCreating = true;
    try {
      const assetIds = packages.map((entry) => entry.assetId);
      const titlesToCreate: Record<string, string> = {};

      for (const entry of packages) {
        const title = (titles[entry.assetId] ?? '').trim();
        if (title) titlesToCreate[entry.assetId] = title;
      }

      const fields =
        Object.keys(titlesToCreate).length > 0
          ? { assetIds, courseType, titles: titlesToCreate }
          : { assetIds, courseType };
      const created = await packageApi.createCourses(fields);

      if (created) {
        handleOpenChange(false);
        onCreated(created);
      }
    } finally {
      isCreating = false;
    }
  }
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Content class="w-[95%] max-w-2xl" data-testid="courses-from-packages-dialog">
    <Dialog.Header>
      <Dialog.Title>
        {packages.length === 1
          ? $t('media_manager.scorm.create_course_title_single')
          : $t('media_manager.scorm.create_course_title_many', { count: packages.length })}
      </Dialog.Title>
      <Dialog.Description>{$t('media_manager.scorm.create_course_description')}</Dialog.Description>
    </Dialog.Header>

    <div class="ui:bg-muted/40 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <PackageIcon size={16} class="shrink-0" />
      <span class="font-medium">{$t('media_manager.scorm.course_nav_preview')}</span>
    </div>

    <div class="space-y-3">
      {#each packages as entry (entry.assetId)}
        <InputField
          label={packages.length === 1
            ? $t('media_manager.scorm.course_title_label')
            : $t('media_manager.scorm.course_title_label_for', { title: entry.title })}
          bind:value={titles[entry.assetId]}
          placeholder={entry.title}
          className="w-full"
          isRequired={true}
          testId={`course-from-package-title-${entry.assetId}`}
        />
      {/each}
      <Dialog.Footer>
        <Button variant="outline" size="sm" disabled={isCreating} onclick={() => handleOpenChange(false)}>
          {$t('media_manager.scorm.cancel')}
        </Button>
        <Button
          size="sm"
          disabled={isCreating || packages.length === 0}
          loading={isCreating}
          onclick={handleCreate}
          testId="courses-from-packages-submit"
        >
          {packages.length === 1
            ? $t('media_manager.scorm.create_course_confirm_single')
            : $t('media_manager.scorm.create_course_confirm_many', { count: packages.length })}
        </Button>
      </Dialog.Footer>
    </div>
  </Dialog.Content>
</Dialog.Root>
