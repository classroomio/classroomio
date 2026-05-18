<script lang="ts">
  import { CertificatesPage } from '$features/course/pages';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi } from '$features/course/api';
  import type { Course } from '$features/course/utils/types';
  import { parseCertificateThemeId } from '$features/course/utils/certificate-utils';
  import { isFreePlan, isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { Button } from '@cio/ui/base/button';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import { RefreshPageData, UnsavedChanges } from '$features/ui';
  import { ZCourseUpdate } from '@cio/utils/validation/course/course';
  import { validateWithTranslation } from '$lib/utils/validation';
  import { snackbar } from '$features/ui/snackbar/store';
  import { openUpgradeModal } from '$lib/utils/functions/org';

  let errors = $state<Record<string, string>>({});
  let hasUnsavedChanges = $state(false);
  let savedCertificateState = $state<string | null>(null);
  let savedCertificateStateCourseId = $state<string | null>(null);

  const certificateTheme = $derived(courseApi.course?.certificate?.theme ?? '');

  const userRole = $derived.by(() => {
    const user = courseApi.group.people.find((person) => person.profileId === $profile.id);
    return user ? Number(user.roleId) : null;
  });

  const canEditCertificates = $derived(!!$isOrgAdmin || (userRole !== null && [1, 2].includes(userRole)));

  function getCertificateFormState(course: Course | null) {
    if (!course) {
      return null;
    }

    return {
      description: course.description ?? '',
      certificate: {
        isDownloadable: course.certificate?.isDownloadable ?? false,
        theme: parseCertificateThemeId(course.certificate?.theme),
        design: course.certificate?.design ?? null,
        deadline: course.certificate?.deadline ?? null,
        threshold: typeof course.certificate?.threshold === 'number' ? course.certificate.threshold : 100,
        requiredExerciseId: course.certificate?.requiredExerciseId ?? null,
        exerciseMinScorePercent:
          typeof course.certificate?.exerciseMinScorePercent === 'number'
            ? course.certificate.exerciseMinScorePercent
            : course.certificate?.requiredExerciseId
              ? 100
              : null,
        emailMessage: course.certificate?.emailMessage ?? null
      }
    };
  }

  function getCertificateStateSnapshot(course: Course | null) {
    const certificateFormState = getCertificateFormState(course);
    return certificateFormState ? JSON.stringify(certificateFormState) : null;
  }

  $effect(() => {
    const course = courseApi.course;
    const currentSnapshot = getCertificateStateSnapshot(course);

    if (!course?.id || !currentSnapshot) {
      savedCertificateState = null;
      savedCertificateStateCourseId = null;
      hasUnsavedChanges = false;
      return;
    }

    if (savedCertificateStateCourseId !== course.id || savedCertificateState === null) {
      savedCertificateStateCourseId = course.id;
      savedCertificateState = currentSnapshot;
    }

    hasUnsavedChanges = currentSnapshot !== savedCertificateState;
  });

  async function saveCertificate() {
    if (!courseApi.course) return;

    if ($isFreePlan) {
      errors = {};
      openUpgradeModal();
      return;
    }

    const updatePayload = {
      description: courseApi.course.description ?? '',
      certificate: {
        isDownloadable: courseApi.course.certificate?.isDownloadable ?? false,
        theme: certificateTheme || 'classique',
        design: courseApi.course.certificate?.design,
        deadline: courseApi.course.certificate?.deadline ?? null,
        threshold:
          typeof courseApi.course.certificate?.threshold === 'number' ? courseApi.course.certificate.threshold : 100,
        requiredExerciseId: courseApi.course.certificate?.requiredExerciseId ?? null,
        exerciseMinScorePercent:
          typeof courseApi.course.certificate?.exerciseMinScorePercent === 'number'
            ? courseApi.course.certificate.exerciseMinScorePercent
            : courseApi.course.certificate?.requiredExerciseId
              ? 100
              : null,
        emailMessage: courseApi.course.certificate?.emailMessage ?? null
      }
    };

    const validated = validateWithTranslation(ZCourseUpdate, updatePayload, 'course');
    if ('errors' in validated) {
      errors = validated.errors;
      return;
    }

    errors = {};

    const updated = await courseApi.update(courseApi.course.id!, validated.data, { showSuccessToast: false });
    if (updated) {
      savedCertificateState = getCertificateStateSnapshot(courseApi.course);
      hasUnsavedChanges = false;
      snackbar.success('snackbar.course_settings.success.saved');
    }
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
      <Page.Title>
        {$t('course.navItem.certificates.title')}
      </Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <div class="flex w-full justify-end gap-2">
        {#if canEditCertificates}
          <Button
            onclick={saveCertificate}
            loading={courseApi.isLoading}
            disabled={courseApi.isLoading || !hasUnsavedChanges}
          >
            {#if $isFreePlan}
              <ZapIcon size={16} class="filled" />
            {/if}
            {$t('course.navItem.certificates.save')}
          </Button>
        {/if}
        <RefreshPageData />
      </div>
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <CertificatesPage {errors} />
    {/snippet}
  </Page.Body>
</Page.Root>
