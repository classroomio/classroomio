<script>
  import Box from '$lib/components/Box/index.svelte';
  import { t } from '$lib/utils/functions/translations';
</script>

<Box>
  <div class="flex flex-col items-center justify-center w-max h-full gap-2">
    <img src="/professional.png" alt="Certificate" />
    <p class="text-xl font-normal text-center">
      {$t('course.navItem.certificates.locked_certificate')}
    </p>
    <p class="text-sm font-normal text-center">
      {$t('course.navItem.certificates.instructor_unlock')} <br />
      {$t('course.navItem.certificates.contact_instructor')}
    </p>
  </div>
</Box>
