<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '@cio/ui/base/button';
  interface Props {
    children?: import('svelte').Snippet;
  }

  import * as Page from '@cio/ui/base/page';
  import { OrgSettingsInlineTabs } from '$features/settings/components';
  import { settingsHeaderAction } from '$features/settings/utils/store';
  import { t } from '$lib/utils/functions/translations';

  let { children }: Props = $props();

  const showOrgSettingsTabs = $derived(
    page.url.pathname.endsWith('/settings/org') ||
      page.url.pathname.endsWith('/settings/customize-lms') ||
      page.url.pathname.endsWith('/settings/domains') ||
      page.url.pathname.endsWith('/settings/teams')
  );
</script>

<Page.Root class="w-full pb-10 md:max-w-3xl lg:mx-auto">
  {#if showOrgSettingsTabs}
    <Page.Header>
      <Page.HeaderContent>
        <Page.Title>{$t('settings.organization.organization_profile.heading')}</Page.Title>
        <Page.Subtitle>{$t('settings.organization.page_subtitle')}</Page.Subtitle>
      </Page.HeaderContent>
      <Page.Action>
        <Button
          variant="secondary"
          loading={$settingsHeaderAction.loading}
          disabled={$settingsHeaderAction.disabled || !$settingsHeaderAction.onClick}
          onclick={() => $settingsHeaderAction.onClick?.()}
        >
          {$settingsHeaderAction.label}
        </Button>
      </Page.Action>
    </Page.Header>

    <OrgSettingsInlineTabs />
  {/if}

  {@render children?.()}
</Page.Root>
