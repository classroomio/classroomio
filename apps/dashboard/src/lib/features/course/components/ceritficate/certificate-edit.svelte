<script lang="ts">
  import { CertificateEditView } from '$features/ui/certificate';
  import CertificateDesign from './certificate-design.svelte';
  import CertificateSettings from './certificate-settings.svelte';

  type Props = {
    errors: Record<string, string>;
    activeTab?: string;
    onActiveTabChange?: (tab: string) => void;
  };

  let { errors, activeTab = 'design', onActiveTabChange }: Props = $props();
</script>

<CertificateEditView {activeTab} {onActiveTabChange}>
  {#snippet designSnippet()}
    <CertificateDesign />
  {/snippet}
  {#snippet settingsSnippet()}
    <CertificateSettings {errors} />
  {/snippet}
</CertificateEditView>
