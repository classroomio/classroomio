<script lang="ts">
  import { CertificateEditView } from '$features/ui/certificate';
  import PathCertificateDesign from './path-certificate-design.svelte';
  import PathCertificateSettings from './path-certificate-settings.svelte';

  interface Props {
    errors?: Record<string, string>;
    activeTab?: string;
    onActiveTabChange?: (tab: string) => void;
  }

  let { errors = {}, activeTab = 'design', onActiveTabChange }: Props = $props();
</script>

<CertificateEditView {activeTab} {onActiveTabChange}>
  {#snippet designSnippet()}
    <PathCertificateDesign />
  {/snippet}
  {#snippet settingsSnippet()}
    <PathCertificateSettings {errors} />
  {/snippet}
</CertificateEditView>
