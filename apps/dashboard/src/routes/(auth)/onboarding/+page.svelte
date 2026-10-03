<script lang="ts">
  import { Input } from '@cio/ui/base/input';
  import { DomainInput } from '@cio/ui/custom/domain-input';
  import * as Field from '@cio/ui/base/field';
  import { Button } from '@cio/ui/base/button';
  import { CheckboxOptionCardGroup } from '@cio/ui/custom/checkbox-option-card';
  import { RadioOptionCardGroup } from '@cio/ui/custom/radio-option-card';
  import { SimpleLogoNav } from '@cio/ui/custom/simple-logo-nav';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';

  import Stepper from '$features/onboarding/components/stepper.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { onboardingApi } from '$features/onboarding/api/onboarding.svelte';
  import { resolveResumeStep } from '$features/onboarding/utils/completeness';
  import { generateSitename } from '$lib/utils/functions/org';
  import { t } from '$lib/utils/functions/translations';
  import {
    AI_PROVIDERS,
    AI_SOURCE_VALUE,
    COMPANY_SIZES,
    getQuestionIndex,
    JOB_ROLES,
    LEARNING_METHODS,
    ONBOARDING_STEPS,
    OTHER_VALUE,
    QUESTION_STEP_CONTENT,
    QUESTION_STEP_LABELS,
    QUESTION_STEPS,
    SOURCES,
    USE_CASES
  } from '$features/onboarding/utils/constants';
  import type { OnboardingField } from '$features/onboarding/utils/types';
  import { untrack } from 'svelte';

  type QuestionStep = (typeof QUESTION_STEPS)[number];

  let fields: OnboardingField = $state({
    fullname: '',
    orgName: '',
    siteName: '',
    useCases: [],
    useCaseOther: '',
    learningMethod: '',
    learningMethodOther: '',
    companySize: '',
    jobRole: '',
    jobRoleOther: '',
    source: '',
    sourceOther: '',
    aiProvider: '',
    aiProviderOther: '',
    locale: 'en'
  });
  let isSiteNameTouched = $state(false);

  const isQuestionStep = $derived(onboardingApi.step !== ONBOARDING_STEPS.ORG_SETUP);
  const questionIndex = $derived(getQuestionIndex(onboardingApi.step));
  const questionContent = $derived(isQuestionStep ? QUESTION_STEP_CONTENT[onboardingApi.step as QuestionStep] : null);
  const questionLabel = $derived(isQuestionStep ? $t(QUESTION_STEP_LABELS[onboardingApi.step as QuestionStep]) : '');

  const useCaseOptions = $derived(
    USE_CASES.map((option) => ({ id: option.value, title: $t(option.label), description: '', value: option.value }))
  );
  const learningMethodOptions = $derived(
    LEARNING_METHODS.map((option) => ({
      id: option.value,
      title: $t(option.label),
      description: '',
      value: option.value
    }))
  );
  const companySizeOptions = $derived(
    COMPANY_SIZES.map((option) => ({
      id: option.value,
      title: $t(option.label),
      description: $t(option.description),
      value: option.value
    }))
  );
  const jobRoleOptions = $derived(
    JOB_ROLES.map((option) => ({ id: option.value, title: $t(option.label), description: '', value: option.value }))
  );
  const sourceOptions = $derived(
    SOURCES.map((option) => ({ id: option.value, title: $t(option.label), description: '', value: option.value }))
  );

  function updateSiteName(sname?: string) {
    if (!sname) return;

    untrack(() => {
      fields.siteName = generateSitename(sname);
    });
  }

  $effect(() => {
    updateSiteName(fields.siteName);
  });

  function setOrgSiteName(orgName: string | undefined, isTouched: boolean) {
    if (!orgName || isTouched) return;

    untrack(() => {
      fields.siteName = orgName
        ?.toLowerCase()
        ?.replace(/\s+/g, '-')
        ?.replace(/[^a-zA-Z0-9-]/g, '');
    });
  }

  $effect(() => {
    setOrgSiteName(fields.orgName, isSiteNameTouched);
  });

  function hydrateFieldsFromProfile() {
    fields.fullname = $profile.fullname ?? '';
    fields.useCases = $profile.useCases ?? [];
    fields.useCaseOther = $profile.useCaseOther ?? '';
    fields.learningMethod = $profile.learningMethod ?? '';
    fields.learningMethodOther = $profile.learningMethodOther ?? '';
    fields.companySize = $profile.companySize ?? '';
    fields.jobRole = $profile.jobRole ?? '';
    fields.jobRoleOther = $profile.jobRoleOther ?? '';
    fields.source = $profile.source ?? '';
    fields.sourceOther = $profile.sourceOther ?? '';
    fields.aiProvider = $profile.aiProvider ?? '';
    fields.aiProviderOther = $profile.aiProviderOther ?? '';
    fields.locale = $profile.locale ?? 'en';
  }

  let hasInitializedFromProfile = false;

  $effect(() => {
    if (hasInitializedFromProfile || !$profile.id) return;

    hasInitializedFromProfile = true;
    hydrateFieldsFromProfile();

    if ($currentOrg.id) {
      onboardingApi.step = resolveResumeStep($profile);
    }
  });

  function normalizedFields(): OnboardingField {
    const useCaseOther = fields.useCases.includes(OTHER_VALUE) ? fields.useCaseOther : '';
    const learningMethodOther = fields.learningMethod === OTHER_VALUE ? fields.learningMethodOther : '';
    const jobRoleOther = fields.jobRole === OTHER_VALUE ? fields.jobRoleOther : '';
    const sourceOther = fields.source === OTHER_VALUE ? fields.sourceOther : '';
    const aiProvider = fields.source === AI_SOURCE_VALUE ? fields.aiProvider : '';
    const aiProviderOther = fields.source === AI_SOURCE_VALUE ? fields.aiProviderOther : '';

    return {
      ...fields,
      useCaseOther,
      learningMethodOther,
      jobRoleOther,
      sourceOther,
      aiProvider,
      aiProviderOther
    };
  }

  function handleNext() {
    onboardingApi.next(normalizedFields());
  }

  function handleSkip() {
    onboardingApi.skip(normalizedFields());
  }
</script>

{#if $profile.id}
  <div class="relative flex min-h-screen w-full flex-col dark:bg-neutral-900">
    <SimpleLogoNav tagline={$t('onboarding.header.tagline')} class="left-1/2 -translate-x-1/2" />

    <div class="flex flex-1 justify-center px-4 pt-24 pb-10">
      <div class="w-full max-w-xl">
        {#if onboardingApi.step === ONBOARDING_STEPS.ORG_SETUP}
          <h1 class="text-2xl font-semibold dark:text-white">{$t('onboarding.org_setup.title')}</h1>
          <p class="ui:text-muted-foreground mt-2 text-sm">{$t('onboarding.org_setup.subtitle')}</p>

          <Field.Group class="mt-8">
            <Field.Field>
              <Field.Label>{$t('onboarding.fullname')}</Field.Label>
              <Input bind:value={fields.fullname} name="fullname" type="text" placeholder="e.g Joke Silva" />
              {#if onboardingApi.errors.fullname}
                <Field.Error>{onboardingApi.errors.fullname}</Field.Error>
              {/if}
            </Field.Field>

            <Field.Field>
              <Field.Label>{$t('onboarding.name')}</Field.Label>
              <Input bind:value={fields.orgName} name="orgname" type="text" placeholder="e.g My School Name" />
              {#if onboardingApi.errors.orgName}
                <Field.Error>{onboardingApi.errors.orgName}</Field.Error>
              {/if}
            </Field.Field>

            <Field.Field>
              <Field.Label>{$t('onboarding.organisation_sitename')}</Field.Label>
              <DomainInput
                bind:value={fields.siteName}
                placeholder="myschool"
                prefix="https://"
                suffix=".classroomio.com"
                oninput={() => {
                  isSiteNameTouched = true;
                  onboardingApi.errors.siteName = '';
                }}
              />
              {#if onboardingApi.errors.siteName}
                <Field.Error>{onboardingApi.errors.siteName}</Field.Error>
              {/if}
            </Field.Field>
          </Field.Group>
        {:else}
          <Stepper
            current={questionIndex}
            total={QUESTION_STEPS.length}
            stepText={$t('onboarding.step_of', {
              current: String(questionIndex),
              total: String(QUESTION_STEPS.length)
            })}
            label={questionLabel}
          />

          {#if questionContent}
            <h1 class="mt-8 text-2xl font-semibold dark:text-white">{$t(questionContent.title)}</h1>
            <p class="ui:text-muted-foreground mt-2 text-sm">{$t(questionContent.subtitle)}</p>
          {/if}

          <div class="mt-6">
            {#if onboardingApi.step === ONBOARDING_STEPS.USE_CASES}
              <CheckboxOptionCardGroup bind:value={fields.useCases} options={useCaseOptions} />

              {#if fields.useCases.includes(OTHER_VALUE)}
                <Input bind:value={fields.useCaseOther} class="mt-3" placeholder={$t('onboarding.other_placeholder')} />
              {/if}

              {#if onboardingApi.errors.useCases}
                <p class="mt-3 text-sm text-red-500">{onboardingApi.errors.useCases}</p>
              {/if}
              {#if onboardingApi.errors.useCaseOther}
                <p class="mt-3 text-sm text-red-500">{onboardingApi.errors.useCaseOther}</p>
              {/if}
            {:else if onboardingApi.step === ONBOARDING_STEPS.LEARNING_METHODS}
              <RadioOptionCardGroup
                bind:value={fields.learningMethod}
                options={learningMethodOptions}
                class="md:grid-cols-1!"
              />

              {#if fields.learningMethod === OTHER_VALUE}
                <Input
                  bind:value={fields.learningMethodOther}
                  class="mt-3"
                  placeholder={$t('onboarding.other_placeholder')}
                />
              {/if}

              {#if onboardingApi.errors.learningMethod}
                <p class="mt-3 text-sm text-red-500">{onboardingApi.errors.learningMethod}</p>
              {/if}
              {#if onboardingApi.errors.learningMethodOther}
                <p class="mt-3 text-sm text-red-500">{onboardingApi.errors.learningMethodOther}</p>
              {/if}
            {:else if onboardingApi.step === ONBOARDING_STEPS.COMPANY_SIZE}
              <RadioOptionCardGroup
                bind:value={fields.companySize}
                options={companySizeOptions}
                class="md:grid-cols-5!"
              />

              {#if onboardingApi.errors.companySize}
                <p class="mt-3 text-sm text-red-500">{onboardingApi.errors.companySize}</p>
              {/if}
            {:else if onboardingApi.step === ONBOARDING_STEPS.JOB_ROLE}
              <RadioOptionCardGroup bind:value={fields.jobRole} options={jobRoleOptions} />

              {#if fields.jobRole === OTHER_VALUE}
                <Input bind:value={fields.jobRoleOther} class="mt-3" placeholder={$t('onboarding.other_placeholder')} />
              {/if}

              {#if onboardingApi.errors.jobRole}
                <p class="mt-3 text-sm text-red-500">{onboardingApi.errors.jobRole}</p>
              {/if}
              {#if onboardingApi.errors.jobRoleOther}
                <p class="mt-3 text-sm text-red-500">{onboardingApi.errors.jobRoleOther}</p>
              {/if}
            {:else if onboardingApi.step === ONBOARDING_STEPS.SOURCE}
              <RadioOptionCardGroup bind:value={fields.source} options={sourceOptions} />

              {#if fields.source === AI_SOURCE_VALUE}
                <div class="ui:border-border ui:bg-muted/40 mt-4 rounded-lg border p-4">
                  <p class="text-xs font-semibold tracking-[0.14em] uppercase">
                    {$t('onboarding.ai_assistant.label')}
                  </p>
                  <p class="ui:text-muted-foreground mt-1 text-sm">{$t('onboarding.ai_assistant.subtitle')}</p>

                  <div class="mt-3 flex flex-wrap gap-2">
                    {#each AI_PROVIDERS as provider (provider.value)}
                      <Button
                        size="sm"
                        variant={fields.aiProvider === provider.value ? 'default' : 'outline'}
                        onclick={() => (fields.aiProvider = provider.value)}
                      >
                        {$t(provider.label)}
                      </Button>
                    {/each}
                  </div>

                  {#if fields.aiProvider === OTHER_VALUE}
                    <Input
                      bind:value={fields.aiProviderOther}
                      class="mt-3"
                      placeholder={$t('onboarding.other_placeholder')}
                    />
                  {/if}

                  {#if onboardingApi.errors.aiProvider}
                    <p class="mt-3 text-sm text-red-500">{onboardingApi.errors.aiProvider}</p>
                  {/if}
                  {#if onboardingApi.errors.aiProviderOther}
                    <p class="mt-3 text-sm text-red-500">{onboardingApi.errors.aiProviderOther}</p>
                  {/if}
                </div>
              {/if}

              {#if fields.source === OTHER_VALUE}
                <Input bind:value={fields.sourceOther} class="mt-3" placeholder={$t('onboarding.other_placeholder')} />
              {/if}

              {#if onboardingApi.errors.sourceOther}
                <p class="mt-3 text-sm text-red-500">{onboardingApi.errors.sourceOther}</p>
              {/if}
            {/if}
          </div>
        {/if}

        <div class="mt-10 flex items-center justify-between">
          <div>
            {#if isQuestionStep}
              <Button variant="ghost" onclick={() => onboardingApi.back()}>
                <ChevronLeftIcon class="size-4" />
                {$t('onboarding.back')}
              </Button>
            {/if}
          </div>

          <div class="flex items-center gap-2">
            {#if onboardingApi.step === ONBOARDING_STEPS.SOURCE}
              <Button variant="ghost" onclick={handleSkip}>{$t('onboarding.skip')}</Button>
            {/if}

            <Button loading={onboardingApi.isLoading || onboardingApi.isRedirecting} onclick={handleNext}>
              {$t(onboardingApi.step === ONBOARDING_STEPS.SOURCE ? 'onboarding.finish_setup' : 'onboarding.continue')}
              <ArrowRightIcon class="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
