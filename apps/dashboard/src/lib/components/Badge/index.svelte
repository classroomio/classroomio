<script>
  import { isCourseFree } from '$lib/utils/functions/course';
  import { currentOrg } from '$lib/utils/store/org';
</script>

{#if isCourseFree}
  <a
    href={`https://classroomio.com?utm_source=${$currentOrg.siteName}.classroomio.com`}
    class="fixed bottom-2 right-6 z-50"
  >
    <span
      class="flex items-center gap-2 dark:text-black dark:bg-white border border-gray-100 rounded-md p-3 font-semibold"
    >
      <img src="/logo-192.png" alt="logo" class="h-[24px]" />
      Powered by ClassroomIO
    </span>
  </a>
{/if}
