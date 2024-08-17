<script>
  import { t } from '$lib/utils/functions/translations';
  import Box from '$lib/components/Box/index.svelte';
</script>

<Box className="h-full">
  <div class="flex items-center justify-between h-full w-max gap-5 py-10">
    <img
      src="/images/student-certificate-preview.png"
      alt="Certificate"
      class="max-w-[218px] p-3 bg-[#F1F6FF]"
    />
    <div class="w-[50%]">
      <p class="text-xl font-medium">
        {$t('pathway.pages.lms_certificate.locked.title')}
      </p>
      <p class="text-sm my-2 font-normal max-w-md">
        {$t('pathway.pages.lms_certificate.locked.subtitle')}
      </p>
    </div>
  </div>
</Box>
