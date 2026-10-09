<script lang="ts">
  import { Switch } from '@cio/ui/base/switch';

  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { orgApi } from '$features/org/api/org.svelte';
  import { handleOpenWidget } from '$features/ui/course-landing-page/store';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import * as Select from '@cio/ui/base/select';
  import type { TLocale } from '@cio/db/types';
  import { LANGUAGES } from '$lib/utils/constants/translation';

  import { AttentionHighlight, UploadWidget, UnsavedChanges } from '$features/ui';
  import { StudentHomeField } from '$features/settings/components';
  import * as Field from '@cio/ui/base/field';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
  import { toLmsAvailabilityContext } from '$features/ui/navigation/lms-navigation';
  import { studentHomeApi } from '$features/org/api/student-home.svelte';
  import {
    buildStudentHomePageOptions,
    getStudentHomeWarning,
    toStudentHomeDestination
  } from '$features/org/utils/student-home-utils';
  import type { TStudentHomeDestination } from '@cio/utils/validation/organization';

  interface Props {
    hasUnsavedChanges?: boolean;
  }

  let { hasUnsavedChanges = $bindable(false) }: Props = $props();

  let widgetKey = $state('');
  let customization = $state($state.snapshot($currentOrg.customization));
  let savedCustomizationSnapshot = $state('');
  let capturedOrgId = $state('');
  let coursesListedOrgId = $state('');
  let languageLocale = $state<TLocale>('en');
  let languageEnforced = $state(false);
  let studentHome = $state<TStudentHomeDestination | null>(null);

  function widgetControl(key: string) {
    widgetKey = key;
    $handleOpenWidget.open = true;
  }

  function authBackgroundWidgetControl() {
    if ($isFreePlan) {
      return;
    }

    widgetKey = 'auth-background';
    $handleOpenWidget.open = true;
  }

  function deleteAuthBackgroundImage() {
    customization.auth.backgroundImage = '';
  }

  function captureCustomizationSnapshot() {
    savedCustomizationSnapshot = JSON.stringify({
      customization,
      language: { locale: languageLocale, enforced: languageEnforced },
      studentHome
    });
  }

  const availabilityContext = $derived({
    ...toLmsAvailabilityContext($currentOrg),
    customization
  });
  const studentHomePageOptions = $derived(buildStudentHomePageOptions((key) => t.get(key), availabilityContext));
  const studentHomeWarning = $derived(
    getStudentHomeWarning(studentHome, studentHomePageOptions, studentHomeApi.courses)
  );

  $effect(() => {
    const organizationId = $currentOrg?.id;
    if (!organizationId || organizationId === capturedOrgId) return;

    capturedOrgId = organizationId;
    customization = $state.snapshot($currentOrg.customization);
    languageLocale = $currentOrg.settings?.language?.locale ?? 'en';
    languageEnforced = $currentOrg.settings?.language?.enforced ?? false;
    studentHome = toStudentHomeDestination($currentOrg);
    savedCustomizationSnapshot = '';
    captureCustomizationSnapshot();
  });

  $effect(() => {
    const organizationId = $currentOrg?.id;
    if (!organizationId || organizationId === coursesListedOrgId) return;

    coursesListedOrgId = organizationId;
    const savedHome = toStudentHomeDestination($currentOrg);
    void studentHomeApi.listCourses({
      includeCourseId: savedHome?.type === 'course' ? savedHome.courseId : undefined
    });
  });

  $effect(() => {
    if (!$currentOrg?.id || !savedCustomizationSnapshot) return;

    hasUnsavedChanges =
      JSON.stringify({
        customization,
        language: { locale: languageLocale, enforced: languageEnforced },
        studentHome
      }) !== savedCustomizationSnapshot;
  });

  export async function handleSave() {
    const savedSettings = savedCustomizationSnapshot ? JSON.parse(savedCustomizationSnapshot) : null;
    const studentHomeChanged = JSON.stringify(studentHome) !== JSON.stringify(savedSettings?.studentHome ?? null);

    await orgApi.update($currentOrg.id, {
      customization,
      settings: {
        language: { locale: languageLocale, enforced: languageEnforced }
      },
      ...(studentHomeChanged ? { studentHome } : {})
    });

    if (orgApi.success) {
      captureCustomizationSnapshot();
      hasUnsavedChanges = false;
    }
  }

  export function handleDiscard() {
    if (!savedCustomizationSnapshot) return;

    const savedSettings = JSON.parse(savedCustomizationSnapshot);
    customization = savedSettings.customization;
    languageLocale = savedSettings.language.locale;
    languageEnforced = savedSettings.language.enforced;
    studentHome = savedSettings.studentHome ?? null;
    hasUnsavedChanges = false;
  }
</script>

<UnsavedChanges bind:hasUnsavedChanges />

<Field.Group class="w-full max-w-md! px-2">
  <Field.Set>
    <Field.Legend>{$t('components.settings.customize_lms.student_home.heading')}</Field.Legend>
    <Field.Description>{$t('components.settings.customize_lms.student_home.description')}</Field.Description>
    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('components.settings.customize_lms.student_home.label')}</Field.Label>
        <StudentHomeField
          bind:value={studentHome}
          pageOptions={studentHomePageOptions}
          warning={studentHomeWarning}
          error={orgApi.errors.studentHome}
        />
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <AttentionHighlight id="language-settings" scrollBlock="center">
    <Field.Set>
      <Field.Legend>{$t('components.settings.customize_lms.language.title')}</Field.Legend>
      <Field.Description>{$t('components.settings.customize_lms.language.description')}</Field.Description>
      <Field.Group>
        <Field.Field>
          <Field.Label>{$t('components.settings.customize_lms.language.default_language')}</Field.Label>
          <Select.Root type="single" bind:value={languageLocale}>
            <Select.Trigger class="w-full">
              {LANGUAGES.find((language) => language.id === languageLocale)?.text}
            </Select.Trigger>
            <Select.Content>
              {#each LANGUAGES as language (language.id)}
                <Select.Item value={language.id}>{language.text}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </Field.Field>
        <Field.Field orientation="horizontal">
          <Switch bind:checked={languageEnforced} />
          <Field.Label>{$t('components.settings.customize_lms.language.enforce')}</Field.Label>
        </Field.Field>
      </Field.Group>
    </Field.Set>
  </AttentionHighlight>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('components.settings.customize_lms.dashboard.title')}</Field.Legend>
    <Field.Group>
      <Field.Field orientation="horizontal">
        <Field.Label>{$t('components.settings.customize_lms.dashboard.community')}</Field.Label>
        <Switch bind:checked={customization.dashboard.community} />
        <Field.Description class="text-sm">
          {customization.dashboard.community
            ? $t('components.settings.customize_lms.enabled')
            : $t('components.settings.customize_lms.disabled')}
        </Field.Description>
      </Field.Field>

      <Field.Field orientation="horizontal">
        <Field.Label>{$t('components.settings.customize_lms.dashboard.exercises')}</Field.Label>
        <Switch bind:checked={customization.dashboard.exercise} />
        <Field.Description class="text-sm">
          {customization.dashboard.exercise
            ? $t('components.settings.customize_lms.enabled')
            : $t('components.settings.customize_lms.disabled')}
        </Field.Description>
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('components.settings.customize_lms.dashboard.banner_image')}</Field.Label>
        <Button variant="outline" onclick={() => widgetControl('banner-image')}>
          {$t('components.settings.customize_lms.dashboard.banner_image_btn')}
        </Button>
        {#if customization.dashboard.bannerImage}
          <img alt="Banner" src={customization.dashboard.bannerImage} class="mt-2 w-full rounded-md" />
        {/if}
        {#if $handleOpenWidget.open && widgetKey === 'banner-image'}
          <UploadWidget bind:imageURL={customization.dashboard.bannerImage} />
        {/if}
      </Field.Field>

      <Field.Field>
        <Field.Label>{$t('components.settings.customize_lms.dashboard.banner_text')}</Field.Label>
        <Input
          placeholder={$t('components.settings.customize_lms.dashboard.banner_text_placeholder')}
          bind:value={customization.dashboard.bannerText}
        />
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('components.settings.customize_lms.auth_background.title')}</Field.Legend>
    <Field.Description>{$t('components.settings.customize_lms.auth_background.description')}</Field.Description>
    {#if $isFreePlan}
      <Field.Description class="ui:text-muted-foreground">
        {$t('components.settings.customize_lms.auth_background.paid_plan_note')}
      </Field.Description>
    {/if}
    <Field.Group>
      <Field.Field>
        <div class="flex items-center gap-2">
          <Button onclick={authBackgroundWidgetControl} disabled={$isFreePlan}>
            {$t('course.navItem.settings.replace')}
          </Button>
          <Button variant="outline" onclick={deleteAuthBackgroundImage} disabled={$isFreePlan}>
            {$t('ai.reset')}
          </Button>
        </div>
        {#if $handleOpenWidget.open && widgetKey === 'auth-background'}
          <UploadWidget bind:imageURL={customization.auth.backgroundImage} />
        {/if}
      </Field.Field>
      <Field.Field>
        <div class="relative w-fit">
          <img
            style="min-width:280px; min-height:200px"
            alt={$t('components.settings.customize_lms.auth_background.preview_alt')}
            src={customization.auth.backgroundImage
              ? customization.auth.backgroundImage
              : '/images/classroomio-course-img-template.jpg'}
            class="relative mt-2 h-[200px] w-[280px] rounded-md object-cover md:mt-0"
          />
        </div>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('components.settings.customize_lms.course.title')}</Field.Legend>
    <Field.Group>
      <Field.Field orientation="horizontal">
        <Field.Label>{$t('components.settings.customize_lms.course.newsfeed')}</Field.Label>
        <Switch bind:checked={customization.course.newsfeed} />
        <Field.Description class="text-gray-600">
          {customization.course.newsfeed
            ? $t('components.settings.customize_lms.enabled')
            : $t('components.settings.customize_lms.disabled')}
        </Field.Description>
      </Field.Field>

      <Field.Field orientation="horizontal">
        <Field.Label>{$t('components.settings.customize_lms.course.grading')}</Field.Label>
        <Switch bind:checked={customization.course.grading} />
        <Field.Description class="text-gray-600">
          {customization.course.grading
            ? $t('components.settings.customize_lms.enabled')
            : $t('components.settings.customize_lms.disabled')}
        </Field.Description>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('components.settings.customize_lms.apps.title')}</Field.Legend>
    <Field.Group>
      <Field.Field orientation="horizontal">
        <Field.Label>{$t('components.settings.customize_lms.apps.poll')}</Field.Label>
        <Switch bind:checked={customization.apps.poll} />
        <Field.Description class="text-gray-600">
          {customization.apps.poll
            ? $t('components.settings.customize_lms.enabled')
            : $t('components.settings.customize_lms.disabled')}
        </Field.Description>
      </Field.Field>
      <Field.Field orientation="horizontal">
        <Field.Label>{$t('components.settings.customize_lms.apps.live_comment')}</Field.Label>
        <Switch bind:checked={customization.apps.comments} />
        <Field.Description class="text-gray-600">
          {customization.apps.comments
            ? $t('components.settings.customize_lms.enabled')
            : $t('components.settings.customize_lms.disabled')}
        </Field.Description>
      </Field.Field>
    </Field.Group>
  </Field.Set>
</Field.Group>
