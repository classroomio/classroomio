<script>
  import Empty from '@cio/ui/custom/empty/empty.svelte';
  import { t } from '$lib/utils/functions/translations';
  import LockIcon from '@lucide/svelte/icons/lock';
</script>

<div class="w-full flex-1">
  <Empty
    title={$t('course.navItem.certificates.locked_certificate')}
    description={`${$t('course.navItem.certificates.instructor_unlock')} ${$t('course.navItem.certificates.contact_instructor')}`}
    icon={LockIcon}
    variant="page"
  />
</div>
