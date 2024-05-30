<script>
  import { RadioButtonGroup, RadioButton, Toggle } from 'carbon-components-svelte';
  import { goto } from '$app/navigation';
  import { updateCourse } from '$lib/utils/services/courses';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import UpgradeBanner from '$lib/components/Upgrade/Banner.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import Professional from './templates/Professional.svelte';
  import Plain from './templates/Plain.svelte';
  import { course } from '$lib/components/Course/store';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import FlashFilled from 'carbon-icons-svelte/lib/FlashFilled.svelte';
  import PurpleProfessionalBadge from './templates/PurpleProfessionalBadge.svelte';
  import BlueProfessionalBadge from './templates/BlueProfessionalBadge.svelte';
  import PurpleBadgePattern from './templates/PurpleBadgePattern.svelte';
  import BlueBadgePattern from './templates/BlueBadgePattern.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { z } from 'zod';

  const studentNamePlaceholder = 'Name of student';
  const themes = [
    'professional',
    'plain',
    'purpleProfessionalBadge',
    'blueProfessionalBadge',
    'purpleBadgePattern',
    'blueBadgePattern'
  ];

  let isSaving = false;
  let errors = {
    description: ''
  };
  let helperText = '';

  const courseSchema = z.object({
    description: z.string().max(200, 'Description cannot exceed 200 characters'),
    is_certificate_downloadable: z.boolean(),
    certificate_theme: z.string()
  });

  const saveCertificate = async () => {
    isSaving = true;

    try {
      courseSchema.parse({
        description: $course.description || '',
        is_certificate_downloadable: $course.is_certificate_downloadable || false,
        certificate_theme: $course.certificate_theme || ''
      });
      errors.description = '';

      await updateCourse($course.id, undefined, {
        description: $course.description || '',
        is_certificate_downloadable: $course.is_certificate_downloadable || false,
        certificate_theme: $course.certificate_theme || ''
      });
      snackbar.success('snackbar.course_settings.success.saved');
    } catch (error) {
      if (error.errors && error.errors[0].message) {
        errors.description = error.errors[0].message;
      } else {
        errors.description = 'An unexpected error occurred';
      }
    } finally {
      isSaving = false;
    }
  };

  $: helperText = `${$course.description?.length || 0}/200 characters`;
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="true" />
  <link
    href="https://fonts.googleapis.com/css2?family=Qwitcher+Grypen&family=Roboto:wght@300;400;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<UpgradeBanner>{$t('upgrade.certificate')}</UpgradeBanner>

<main class="md:-ml-3 md:-mr-3 px-2 mt-2">
  <div class="flex-1 flex flex-col lg:flex-row justify-between gap-3 w-full mb-3 h-4/5">
    <section class="w-full lg:w-2/5 h-full">
      <strong class="my-2 text-base font-semibold text-black dark:text-gray-100"
        >{$t('course.navItem.certificates.certificate_settings')}</strong
      >
      <p class="text-xs font-normal my-4 dark:text-gray-100">
        {$t('course.navItem.certificates.theme')}
      </p>
      <RadioButtonGroup
        bind:selected={$course.certificate_theme}
        class="mb-10"
        disabled={$isFreePlan}
      >
        <div class="flex flex-wrap justify-between gap-y-5">
          {#each themes as theme}
            <div class="flex mr-3">
              <RadioButton value={theme} />
              <img
                src={`/images/certificate_theme_${theme}.png`}
                alt="themes"
                class="w-[110px] h-[82px]"
              />
            </div>
          {/each}
        </div>
      </RadioButtonGroup>
      <div>
        <p class="text-xs font-normal text-black my-2 dark:text-gray-100">
          {$t('course.navItem.certificates.logo')}
        </p>
        <div>
          <p class="text-base mt-1 dark:text-gray-100">
            {$t('course.navItem.certificates.to_update')}
            <strong class="font-semibold">{$t('course.navItem.certificates.settings')}</strong>
            {$t('course.navItem.certificates.and_upload')}
          </p>

          <PrimaryButton
            label={$t('course.navItem.certificates.goto_settings')}
            variant={VARIANTS.OUTLINED}
            className="rounded-md mt-3"
            onClick={() => goto(`/org/${$currentOrg.siteName}/settings`)}
          />
        </div>
        <span class="my-4">
          <p class="dark:text-gray-100 text-xs font-normal mt-4 mb-2">
            {$t('course.navItem.certificates.description')}
          </p>
          <TextArea
            rows={6}
            placeholder={$t('course.navItem.certificates.placeholder')}
            bind:value={$course.description}
            errorMessage={errors.description}
            disabled={$isFreePlan}
          />
          <p class="text-sm">{helperText}</p>
        </span>
        <Toggle
          labelText={$t('course.navItem.certificates.allow')}
          bind:toggled={$course.is_certificate_downloadable}
          class="my-4"
          size="sm"
          disabled={$isFreePlan}
        >
          <span slot="labelA" style={$globalStore.isDark ? 'color: white' : 'color: #161616'}
            >{$t('generic.locked')}</span
          >
          <span slot="labelB" style="color: green">{$t('generic.unlocked')}</span>
        </Toggle>
      </div>
    </section>
    <section
      class="bg-gray-100 dark:bg-neutral-800 flex justify-center items-center rounded-md w-full lg:w-3/5"
    >
      <div class="certificate-container flex justify-center items-center">
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
    <PrimaryButton
      className="rounded-md flex gap-2 items-center"
      variant={VARIANTS.CONTAINED_DARK}
      onClick={saveCertificate}
      isLoading={isSaving}
      isDisabled={$isFreePlan}
    >
      {#if $isFreePlan}
        <FlashFilled size={16} class="text-blue-700" />
      {/if}
      {$t('course.navItem.certificates.save')}
    </PrimaryButton>
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
