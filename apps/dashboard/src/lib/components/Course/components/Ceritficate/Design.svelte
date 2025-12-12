<script>
  import { goto } from '$app/navigation';
  import { Label } from '@cio/ui/base/label';
  import { Switch } from '@cio/ui/base/switch';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import * as RadioGroup from '@cio/ui/base/radio-group';

  import { course } from '$lib/components/Course/store';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { updateCourse } from '$lib/utils/services/courses';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { saveCertificateValidation } from '$lib/utils/functions/validator';
  import { Button } from '@cio/ui/base/button';

  import Plain from './templates/Plain.svelte';
  import Professional from './templates/Professional.svelte';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { UpgradeBanner } from '$lib/features/ui';
  import BlueBadgePattern from './templates/BlueBadgePattern.svelte';
  import PurpleBadgePattern from './templates/PurpleBadgePattern.svelte';
  import BlueProfessionalBadge from './templates/BlueProfessionalBadge.svelte';
  import PurpleProfessionalBadge from './templates/PurpleProfessionalBadge.svelte';

  const studentNamePlaceholder = 'Name of student';
  const themes = [
    'professional',
    'plain',
    'purpleProfessionalBadge',
    'blueProfessionalBadge',
    'purpleBadgePattern',
    'blueBadgePattern'
  ];

  let isSaving = $state(false);
  let errors = $state({
    description: ''
  });

  const helperText = $derived(
    `${$course.description?.length || 0}/200 ${$t('course.navItem.certificates.characters')}`
  );

  const saveCertificate = async () => {
    isSaving = true;

    try {
      const result = saveCertificateValidation({
        description: $course.description || '',
        is_certificate_downloadable: $course.is_certificate_downloadable || false,
        certificate_theme: $course.certificate_theme || ''
      });

      if (result && Object.keys(result).length > 0) {
        errors.description = $t(result.description) || $t('course.navItem.certificates.description_error');
        throw new Error(errors.description);
      }

      errors.description = '';

      await updateCourse($course.id, undefined, {
        description: $course.description || '',
        is_certificate_downloadable: $course.is_certificate_downloadable || false,
        certificate_theme: $course.certificate_theme || ''
      });
      snackbar.success('snackbar.course_settings.success.saved');
    } catch (error) {
      if (error instanceof Error) {
        errors.description = error.message;
      } else {
        errors.description = $t('course.navItem.certificates.unexpected_error');
      }
    } finally {
      isSaving = false;
    }
  };
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Qwitcher+Grypen&family=Roboto:wght@300;400;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<UpgradeBanner>{$t('upgrade.certificate')}</UpgradeBanner>

<main class="mt-2 px-2 md:-ml-3 md:-mr-3">
  <div class="mb-3 flex h-4/5 w-full flex-1 flex-col justify-between gap-3 lg:flex-row">
    <section class="h-full w-full lg:w-2/5">
      <strong class="my-2 text-base font-semibold text-black dark:text-gray-100"
        >{$t('course.navItem.certificates.certificate_settings')}</strong
      >
      <p class="my-4 text-xs font-normal dark:text-gray-100">
        {$t('course.navItem.certificates.theme')}
      </p>

      <RadioGroup.Root bind:value={$course.certificate_theme} disabled={$isFreePlan} class="mb-10">
        <div class="flex flex-wrap justify-between gap-y-5">
          {#each themes as theme}
            <div class="mr-3 flex items-start space-x-2">
              <RadioGroup.Item value={theme} id={theme} />
              <Label for={theme} class="cursor-pointer">
                <img src={`/images/certificate_theme_${theme}.png`} alt="themes" class="h-[82px] w-[110px]" />
              </Label>
            </div>
          {/each}
        </div>
      </RadioGroup.Root>

      <div>
        <p class="my-2 text-xs font-normal text-black dark:text-gray-100">
          {$t('course.navItem.certificates.logo')}
        </p>
        <div>
          <p class="mt-1 text-base dark:text-gray-100">
            {$t('course.navItem.certificates.to_update')}
            <strong class="font-semibold">{$t('course.navItem.certificates.settings')}</strong>
            {$t('course.navItem.certificates.and_upload')}
          </p>

          <Button variant="outline" class="mt-3" onclick={() => goto(`/org/${$currentOrg.siteName}/settings`)}>
            {$t('course.navItem.certificates.goto_settings')}
          </Button>
        </div>
        <span class="my-4">
          <p class="mb-2 mt-4 text-xs font-normal dark:text-gray-100">
            {$t('course.navItem.certificates.description')}
          </p>
          <TextareaField
            rows={6}
            placeholder={$t('course.navItem.certificates.placeholder')}
            bind:value={$course.description}
            errorMessage={errors.description}
            disabled={$isFreePlan}
            helperMessage={helperText}
          />
        </span>
        <div class="my-4 flex items-center space-x-2">
          <Switch
            id="certificate-downloadable"
            bind:checked={$course.is_certificate_downloadable}
            disabled={$isFreePlan}
          />
          <Label for="certificate-downloadable" class="text-sm font-medium dark:text-gray-100">
            {$t('course.navItem.certificates.allow')}
          </Label>
        </div>
      </div>
    </section>
    <section class="flex w-full items-center justify-center rounded-md bg-gray-100 lg:w-3/5 dark:bg-neutral-800">
      <div class="certificate-container flex items-center justify-center">
        {#if $course.certificate_theme === 'professional'}
          <Professional studentName={studentNamePlaceholder} />
        {:else if $course.certificate_theme === 'plain'}
          <Plain studentName={studentNamePlaceholder} />
        {:else if $course.certificate_theme === 'purpleProfessionalBadge'}
          <PurpleProfessionalBadge studentName={studentNamePlaceholder} />
        {:else if $course.certificate_theme === 'blueProfessionalBadge'}
          <BlueProfessionalBadge studentName={studentNamePlaceholder} />
        {:else if $course.certificate_theme === 'purpleBadgePattern'}
          <PurpleBadgePattern studentName={studentNamePlaceholder} />
        {:else if $course.certificate_theme === 'blueBadgePattern'}
          <BlueBadgePattern studentName={studentNamePlaceholder} />
        {/if}
      </div>
    </section>
  </div>
  <div class="h-1/5">
    <Button variant="secondary" onclick={saveCertificate} loading={isSaving} disabled={$isFreePlan}>
      {#if $isFreePlan}
        <ZapIcon size={16} class="filled" />
      {/if}
      {$t('course.navItem.certificates.save')}
    </Button>
  </div>
</main>

<style>
  p {
    color: #262626;
  }
  .certificate-container {
    width: 95%;
    max-width: 95%;
  }
</style>
