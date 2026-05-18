<script lang="ts">
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';

  import { PublicCoursePoweredBy } from '@cio/ui/custom/public-course';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { cn } from '@cio/ui/tools';

  type Props = {
    /** Floating promo chip (landing / marketing) vs subdued sidebar attribution. */
    variant?: 'floating' | 'sidebar';
    class?: string;
    /** Sidebar: logo only when rail is collapsed. */
    showOnlyLogo?: boolean;
    /** Passed as utm_content for sidebar attribution. */
    courseSlug?: string | null;
    orgSlug?: string | null;
    /** Sidebar: utm_source override (default distinguishes LMS attribution). */
    sidebarUtmSource?: string;
  };

  let {
    variant = 'floating',
    class: className,
    showOnlyLogo = false,
    courseSlug = null,
    orgSlug = null,
    sidebarUtmSource = 'lms-sidebar'
  }: Props = $props();

  const attributionOrgSlug = $derived(orgSlug ?? $currentOrg.siteName ?? null);
</script>

{#if variant === 'sidebar'}
  <PublicCoursePoweredBy
    {courseSlug}
    orgSlug={attributionOrgSlug}
    utmSource={sidebarUtmSource}
    label={$t('public_course.powered_by.label')}
    brand={$t('public_course.powered_by.brand')}
    compact={showOnlyLogo}
    align={showOnlyLogo ? 'center' : 'start'}
    class={className}
  />
{:else if $isFreePlan}
  <a
    href={`https://classroomio.com?utm_source=${$currentOrg.siteName}.classroomio.com`}
    target="_blank"
    class={cn('group fixed right-9 bottom-14 z-50 hover:no-underline', className)}
  >
    <span
      class={cn(
        'relative flex items-center gap-1 overflow-hidden rounded-md border border-gray-100 bg-white text-sm font-medium text-black shadow-sm transition duration-500 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white dark:border-neutral-700 dark:bg-transparent dark:text-white',

        showOnlyLogo ? 'border-none p-0' : 'border px-2 py-1'
      )}
    >
      <ArrowUpRightIcon
        size={16}
        class="custom absolute left-[5%] -translate-x-full translate-y-full text-white
            opacity-0 transition duration-500 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
      />
      <img src="/logo-192.png" alt="logo" class="h-[24px] opacity-100 group-hover:opacity-0" />
      {#if !showOnlyLogo}
        {$t('course.navItem.landing_page.powered_by')} ClassroomIO
      {/if}
    </span>
  </a>
{/if}
