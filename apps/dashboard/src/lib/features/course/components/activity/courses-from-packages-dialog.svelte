<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { RadioOptionCardGroup } from '@cio/ui/custom/radio-option-card';
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

  type CourseTypeOption = 'SELF_PACED' | 'COMPLIANCE';

  let courseType = $state<CourseTypeOption>('SELF_PACED');
  let titles = $state<Record<string, string>>({});
  let isCreating = $state(false);

  const typeOptions = $derived([
    {
      id: 'self-paced',
      title: $t('media_manager.scorm.course_type_self_paced'),
      description: $t('media_manager.scorm.course_type_self_paced_description'),
      value: 'SELF_PACED' as CourseTypeOption
    },
    {
      id: 'compliance',
      title: $t('media_manager.scorm.course_type_compliance'),
      description: $t('media_manager.scorm.course_type_compliance_description'),
      value: 'COMPLIANCE' as CourseTypeOption
    }
  ]);

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;

    if (isOpen) {
      courseType = 'SELF_PACED';
      titles = Object.fromEntries(packages.map((entry) => [entry.assetId, entry.title]));
      isCreating = false;
    }

    onOpenChange(isOpen);
  }

  async function handleCreate() {
    if (packages.length === 0 || isCreating) return;

    isCreating = true;
    try {
      const created = await packageApi.createCourses({
        assetIds: packages.map((entry) => entry.assetId),
        courseType,
        titles
      });

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

    <RadioOptionCardGroup options={typeOptions} bind:value={courseType} class="grid-cols-1 md:grid-cols-2" />

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
    </div>

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
  </Dialog.Content>
</Dialog.Root>
