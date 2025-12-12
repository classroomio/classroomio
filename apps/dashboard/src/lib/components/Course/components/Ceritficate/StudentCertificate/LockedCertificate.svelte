<script>
  import Empty from '@cio/ui/custom/empty/empty.svelte';
  import { t } from '$lib/utils/functions/translations';
</script>

<Empty
  title={$t('course.navItem.certificates.locked_certificate')}
  description={`${$t('course.navItem.certificates.instructor_unlock')} ${$t('course.navItem.certificates.contact_instructor')}`}
>
  <img slot="children" src="/images/student-certificate-preview.png" alt="Certificate" class="max-w-[218px]" />
</Empty>
