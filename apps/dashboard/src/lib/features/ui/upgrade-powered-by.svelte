<script>
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';

  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
</script>

{#if $isFreePlan}
  <a
    href={`https://classroomio.com?utm_source=${$currentOrg.siteName}.classroomio.com`}
    target="_blank"
    class="group fixed bottom-14 right-9 z-50 hover:no-underline"
  >
    <span
      class="flex items-center gap-1 overflow-hidden rounded-md border border-gray-50 bg-white px-2 py-1 text-sm font-medium text-black shadow-md transition duration-500 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white dark:text-black"
    >
      <ArrowUpRightIcon
        size={16}
        class="
            custom absolute left-3 -translate-x-full translate-y-full text-white
            opacity-0 transition duration-500 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
      />
      <img src="/logo-192.png" alt="logo" class="h-[24px] opacity-100 group-hover:opacity-0" />
      {$t('course.navItem.landing_page.powered_by')} ClassroomIO
    </span>
  </a>
{/if}
