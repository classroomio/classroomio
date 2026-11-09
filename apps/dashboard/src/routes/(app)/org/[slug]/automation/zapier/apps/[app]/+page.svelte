<script lang="ts">
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import * as Breadcrumb from '@cio/ui/base/breadcrumb';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';

  import { ZapierAppPage } from '$features/automation/pages';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath } from '$lib/utils/store/org';

  let { data } = $props();

  const T = 'automation.zapier';
  const directoryPath = $derived(`${$currentOrgPath}/automation/zapier/apps`);
  const appTitle = $derived($t(`${T}.app_sheet.title`, { app: data.app.name }));

  function goBack(event: MouseEvent) {
    if (history.length <= 1) return;

    event.preventDefault();
    history.back();
  }
</script>

<svelte:head><title>{t.get(`${T}.app_sheet.title`, { app: data.app.name })} - ClassroomIO</title></svelte:head>
<Page.Header>
  <Page.HeaderContent>
    <Button
      variant="link"
      class="ui:h-fit! ui:justify-start! ui:px-0! ui:py-0!"
      href={directoryPath}
      onclick={goBack}
      testId="zapier-app-back"
    >
      <ArrowLeftIcon class="custom" />
      <span class="ui:text-xs">{$t(`${T}.app_page.back`)}</span>
    </Button>
    <Breadcrumb.Root>
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Link href={`${$currentOrgPath}/automation/zapier`}>{$t('automation.tabs.zapier')}</Breadcrumb.Link
          >
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Link href={directoryPath}>{$t(`${T}.app_page.breadcrumb_apps`)}</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Link href="{directoryPath}?category={data.app.category}">
            {$t(`${T}.catalog.categories.${data.app.category}`)}
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Page>{appTitle}</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>
  </Page.HeaderContent>
</Page.Header>
<Page.Body>{#snippet child()}<ZapierAppPage app={data.app} />{/snippet}</Page.Body>
