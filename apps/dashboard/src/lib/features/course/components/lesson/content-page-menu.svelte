<script lang="ts">
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { RoleBasedSecurity } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { contentApi, courseApi } from '$features/course/api';
  import { collectLockedContentItems } from '$features/course/utils/content-lock-utils';
  import { isObject } from '$lib/utils/functions/isObject';
  import { snackbar } from '$features/ui/snackbar/store';

  interface Props {
    courseId: string;
    disabled?: boolean;
  }

  let { courseId, disabled = false }: Props = $props();

  let isUnlockingAll = $state(false);
  let isTogglingGrouping = $state(false);

  const contentGroupingEnabled = $derived(courseApi.course?.metadata?.isContentGroupingEnabled ?? true);
  const lockedContentItems = $derived(collectLockedContentItems(courseApi.course));
  const menuDisabled = $derived(disabled || isUnlockingAll || isTogglingGrouping);

  async function handleUnlockAllContent() {
    if (!courseId || lockedContentItems.length === 0 || isUnlockingAll) return;

    isUnlockingAll = true;
    const itemsToUnlock = [...lockedContentItems];
    const didUnlock = await contentApi.updateContent(
      courseId,
      itemsToUnlock.map((item) => ({ id: item.id, type: item.type, isUnlocked: true }))
    );

    if (didUnlock) {
      for (const item of itemsToUnlock) {
        courseApi.updateContentItem(item.id, item.type, { isUnlocked: true });
      }
      snackbar.success('snackbar.course_settings.success.unlocked_all_content');
    }

    isUnlockingAll = false;
  }

  async function handleToggleContentGrouping() {
    const course = courseApi.course;
    if (!course || isTogglingGrouping) return;

    const nextEnabled = !contentGroupingEnabled;
    const metadata = isObject(course.metadata) ? course.metadata : {};

    isTogglingGrouping = true;
    await courseApi.update(
      course.id,
      {
        metadata: {
          ...metadata,
          isContentGroupingEnabled: nextEnabled
        }
      },
      { showSuccessToast: false }
    );

    if (courseApi.success) {
      const snackbarKey = nextEnabled
        ? 'snackbar.course_settings.success.content_grouping_enabled'
        : 'snackbar.course_settings.success.content_grouping_disabled';
      snackbar.success(snackbarKey);
    }

    isTogglingGrouping = false;
  }
</script>

<RoleBasedSecurity allowedRoles={[1, 2]}>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      <IconButton
        disabled={menuDisabled}
        tooltip={t.get('course.navItem.lessons.content_menu.label')}
        tooltipSide="bottom"
        aria-label={t.get('course.navItem.lessons.content_menu.label')}
      >
        <EllipsisVerticalIcon size={16} />
      </IconButton>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      <DropdownMenu.Item onclick={handleUnlockAllContent} disabled={menuDisabled || lockedContentItems.length === 0}>
        {$t('course.navItem.lessons.content_menu.unlock_all')}
      </DropdownMenu.Item>
      <DropdownMenu.Item onclick={handleToggleContentGrouping} disabled={menuDisabled}>
        {contentGroupingEnabled
          ? $t('course.navItem.lessons.content_menu.disable_grouping')
          : $t('course.navItem.lessons.content_menu.enable_grouping')}
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</RoleBasedSecurity>
