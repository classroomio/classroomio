<script lang="ts">
  import { page } from '$app/state';
  import { replaceState } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { learningPathApi } from '$features/learning-path/api';
  import { RefreshPageData, UnsavedChanges } from '$features/ui';
  import { PathCertificateEdit } from '$features/learning-path/components/certificate';
  import { snackbar } from '$features/ui/snackbar/store';
  import { isFreePlan } from '$lib/utils/store/org';
  import { openUpgradeModal } from '$lib/utils/store/upgrade-modal';

  let errors = $state<Record<string, string>>({});

  function normalizeCertificateTab(tab: string | null) {
    return tab === 'settings' ? 'settings' : 'design';
  }

  // eslint-disable-next-line svelte/prefer-writable-derived -- local state handles tab clicks since replaceState does not update page.url
  let certificateActiveTab = $state(normalizeCertificateTab(page.url.searchParams.get('tab')));

  $effect.pre(() => {
    certificateActiveTab = normalizeCertificateTab(page.url.searchParams.get('tab'));
  });

  let hasUnsavedChanges = $state(false);
  let savedSnapshot = $state<string | null>(null);
  let savedSnapshotPathId = $state<string | null>(null);

  function getCertificateFormState() {
    const path = learningPathApi.currentPath;
    if (!path) return null;
    return {
      description: path.description,
      certificate: {
        isDownloadable: path.certificate?.isDownloadable ?? false,
        theme: path.certificate?.theme,
        design: path.certificate?.design ?? null,
        emailMessage: path.certificate?.emailMessage ?? null
      }
    };
  }

  function getSnapshot() {
    const state = getCertificateFormState();
    return state ? JSON.stringify(state) : null;
  }

  $effect(() => {
    const path = learningPathApi.currentPath;
    const currentSnapshot = getSnapshot();
    if (!path?.id || !currentSnapshot) {
      savedSnapshot = null;
      savedSnapshotPathId = null;
      hasUnsavedChanges = false;
      return;
    }
    if (savedSnapshotPathId !== path.id || savedSnapshot === null) {
      savedSnapshotPathId = path.id;
      savedSnapshot = currentSnapshot;
    }
    hasUnsavedChanges = currentSnapshot !== savedSnapshot;
  });

  async function saveCertificate() {
    const path = learningPathApi.currentPath;
    if (!path) return;

    if ($isFreePlan) {
      errors = {};
      openUpgradeModal();
      return;
    }

    const payload = {
      description: path.description,
      certificate: {
        isDownloadable: path.certificate?.isDownloadable ?? false,
        theme: path.certificate?.design?.templateId || path.certificate?.theme,
        design: path.certificate?.design,
        emailMessage: path.certificate?.emailMessage ?? undefined
      }
    };

    errors = {};
    const updated = await learningPathApi.update(path.publicId, payload, { showSuccessToast: false });
    if (updated) {
      savedSnapshot = getSnapshot();
      hasUnsavedChanges = false;
      snackbar.success('learningPath.snackbar.certificate_saved');
    }
  }

  function handleDiscard() {
    if (!savedSnapshot || !learningPathApi.currentPath) return;
    const snapshot = JSON.parse(savedSnapshot);
    if (!snapshot) return;
    learningPathApi.currentPath.description = snapshot.description;
    learningPathApi.currentPath.certificate = snapshot.certificate;
    hasUnsavedChanges = false;
    errors = {};
  }

  function handleActiveTabChange(tab: string) {
    const nextTab = normalizeCertificateTab(tab);
    if (nextTab === certificateActiveTab) return;
    certificateActiveTab = nextTab;
    const url = new URL(page.url);
    url.searchParams.set('tab', nextTab);
    replaceState(resolve(`${url.pathname}${url.search}`, {}), page.state);
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Qwitcher+Grypen&family=Roboto:wght@300;400;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<UnsavedChanges bind:hasUnsavedChanges />

<Page.Root class="mx-auto flex w-[calc(95vw-var(--sidebar-width))]!">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('learningPath.certificate.title')}</Page.Title>
      {#if typeof learningPathApi.currentPath?.certificatesIssued === 'number'}
        <span class="ui:text-muted-foreground text-xs">
          {$t('learningPath.certificate.awarded_count', {
            count: learningPathApi.currentPath.certificatesIssued
          })}
        </span>
      {/if}
    </Page.HeaderContent>
    <Page.Action>
      <RefreshPageData />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      {#if learningPathApi.currentPath}
        <PathCertificateEdit {errors} activeTab={certificateActiveTab} onActiveTabChange={handleActiveTabChange} />
      {/if}
    {/snippet}
  </Page.Body>
  {#if certificateActiveTab === 'settings'}
    <Page.SettingsActions
      hasChanges={hasUnsavedChanges}
      loading={learningPathApi.isLoading}
      disabled={learningPathApi.isLoading}
      statusLabel={$t('common.unsaved_changes.label')}
      discardLabel={$t('common.discard')}
      saveLabel={$t('common.save_changes')}
      onSave={saveCertificate}
      onDiscard={handleDiscard}
    />
  {/if}
</Page.Root>
