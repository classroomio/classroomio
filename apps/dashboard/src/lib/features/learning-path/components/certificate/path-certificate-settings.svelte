<script lang="ts">
  import { CertificateSettingsView } from '$features/ui/certificate';
  import { learningPathApi } from '$features/learning-path/api';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    errors?: Record<string, string>;
  }

  let { errors = {} }: Props = $props();

  const path = $derived(learningPathApi.currentPath);

  function handleUpdate(patch: { isDownloadable?: boolean; emailMessage?: string | null }) {
    if (!learningPathApi.currentPath) return;

    learningPathApi.currentPath.certificate = {
      ...(learningPathApi.currentPath.certificate ?? {}),
      ...patch
    };
  }
</script>

<CertificateSettingsView
  isDownloadable={Boolean(path?.certificate?.isDownloadable)}
  emailMessage={path?.certificate?.emailMessage ?? null}
  emailMessagePlaceholder={$t('learningPath.certificate.email_message_placeholder')}
  onUpdate={handleUpdate}
  {errors}
/>
