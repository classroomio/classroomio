<script lang="ts">
  import { CertificateSettingsView } from '$features/ui/certificate';
  import { courseApi } from '$features/course/api';

  type Props = {
    errors: Record<string, string>;
  };

  let { errors }: Props = $props();

  function handleUpdate(patch: { isDownloadable?: boolean; emailMessage?: string | null }) {
    if (!courseApi.course) return;

    courseApi.course.certificate = {
      ...(courseApi.course.certificate ?? {}),
      ...patch
    };
  }
</script>

<CertificateSettingsView
  isDownloadable={Boolean(courseApi.course?.certificate?.isDownloadable)}
  emailMessage={courseApi.course?.certificate?.emailMessage ?? null}
  onUpdate={handleUpdate}
  {errors}
/>
