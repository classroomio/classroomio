<script>
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { ArrowUpRight } from 'carbon-icons-svelte';
</script>

{#if $isFreePlan}
  <a
    href={`https://classroomio.com?utm_source=${$currentOrg.siteName}.classroomio.com`}
    target="_blank"
    class="group fixed bottom-6 right-9 z-[1000px] hover:no-underline"
  >
    <span
      class="overflow-hidden transition shadow-md duration-500 group-hover:bg-blue-600 group-hover:text-white flex items-center gap-2 dark:text-black bg-white border border-gray-50 group-hover:border-blue-600 rounded-md p-3 text-sm font-normal"
    >
      <ArrowUpRight
        class="
            absolute group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0
            opacity-0 translate-y-full -translate-x-full transition duration-500 text-white"
        size={24}
      />
      <img src="/logo-192.svg" alt="logo" class="group-hover:opacity-0 opacity-100 h-[16px]" />
      Powered by ClassroomIO
    </span>
  </a>
{/if}
