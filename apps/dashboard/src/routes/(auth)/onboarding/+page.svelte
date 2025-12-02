<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { Input } from '@cio/ui/base/input';
  import { DomainInput } from '@cio/ui/custom/domain-input';
  import * as Field from '@cio/ui/base/field';
  import { Button } from '@cio/ui/base/button';
  import UserProfileIcon from '$lib/components/Icons/UserProfileIcon.svelte';
  import { profile } from '$lib/utils/store/user';
  import { onboardingApi } from '$lib/features/onboarding/api/onboarding.svelte';
  import { generateSitename } from '$lib/utils/functions/org';
  import { t } from '$lib/utils/functions/translations';
  import { GOALS, ONBOARDING_STEPS, SOURCES, DROPDOWN_ITEMS } from '$lib/features/onboarding/utils/constants';
  import type { OnboardingField } from '$lib/features/onboarding/utils/types';
  import { untrack } from 'svelte';

  let fields: OnboardingField = $state({
    fullname: '',
    orgName: '',
    siteName: '',
    locale: 'en'
  });
  let isSiteNameTouched = $state(false);

  const progress = $derived(Math.round((onboardingApi.step / Object.keys(ONBOARDING_STEPS).length) * 100));

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
</script>

{#if $profile.id}
  <div class="flex min-h-screen w-full justify-center dark:bg-neutral-900">
    <div class="flex w-9/12 max-w-md flex-col items-center justify-center">
      <!-- Header With Logo -->
      <div class="flex flex-col items-center">
        <div class="mb-4 flex w-full items-center justify-center">
          <img src="/logo-192.png" alt="ClassroomIO logo" height="50" width="50" data-atf="1" />
          <h4 class="text-xl dark:text-white">ClassroomIO</h4>
        </div>

        <!-- Loggedin Email -->
        <div
          class="mb-6 flex w-64 items-center justify-center rounded-2xl border border-gray-300 bg-gray-100 py-6 dark:bg-neutral-800"
        >
          <UserProfileIcon />
          <p class="ml-2 text-sm dark:text-white">{$profile.email}</p>
        </div>
      </div>

      <div class="form-container w-full overflow-y-auto px-2">
        {#if onboardingApi.step === ONBOARDING_STEPS.ORG_SETUP}
          <!-- Name/Organization Question -->
          <Field.Group class="mb-6">
            <!-- Full name -->
            <Field.Field>
              <Field.Label>{$t('onboarding.fullname')}</Field.Label>
              <Input bind:value={fields.fullname} name="fullname" type="text" placeholder="e.g Joke Silva" />
              {#if onboardingApi.errors.fullname}
                <Field.Error>{onboardingApi.errors.fullname}</Field.Error>
              {/if}
            </Field.Field>

            <!-- Org name -->
            <Field.Field>
              <Field.Label>{$t('onboarding.name')}</Field.Label>
              <Input bind:value={fields.orgName} name="orgname" type="text" placeholder="e.g My School Name" />
              {#if onboardingApi.errors.orgName}
                <Field.Error>{onboardingApi.errors.orgName}</Field.Error>
              {/if}
            </Field.Field>

            <!-- Org Site Name -->
            <Field.Field>
              <Field.Label>{$t('onboarding.organisation_sitename')}</Field.Label>
              <DomainInput
                bind:value={fields.siteName}
                placeholder="myschool"
                prefix="https://"
                suffix=".classroomio.com"
                oninput={() => {
                  isSiteNameTouched = true;
                }}
              />
              {#if onboardingApi.errors.siteName}
                <Field.Error>{onboardingApi.errors.siteName}</Field.Error>
              {/if}
            </Field.Field>
          </Field.Group>
        {:else}
          <!-- Goal/Source Question -->
          <div id="goal-question" class="mb-6 flex flex-col items-center">
            <div class="w-10/12">
              <!-- Goal Question -->
              <div class="mb-10 flex w-full flex-col items-start justify-between">
                <label for="text-field" class="m-0 mb-3 text-lg font-normal dark:text-white">
                  {$t('onboarding.what_brings')}
                </label>

                <!-- Loop through Goals -->
                {#each GOALS as goal}
                  <label class="mb-1 inline-flex w-full items-center font-light dark:text-white">
                    <input type="radio" bind:group={fields.goal} name="goal" value={goal.value} class="mr-2" />
                    {$t(goal.label)}
                  </label>
                {/each}
                <!-- Goal: Error message -->
                {#if onboardingApi.errors.goal}
                  <p class="text-sm text-red-500">
                    {onboardingApi.errors.goal}
                  </p>
                {/if}
              </div>

              <!-- Source Question -->
              <div class="flex w-full flex-col items-start justify-between">
                <label for="text-field" class="m-0 mb-3 text-lg font-normal dark:text-white">
                  {$t('onboarding.how')}
                </label>

                <!-- Loop through Goals -->
                {#each SOURCES as source}
                  <label class="mb-1 inline-flex w-full items-center font-light dark:text-white">
                    <input type="radio" bind:group={fields.source} name="source" value={source.value} class="mr-2" />
                    {$t(source.label)}
                  </label>
                {/each}
                <!-- Goal: Error message -->
                {#if onboardingApi.errors.source}
                  <p class="text-sm text-red-500">
                    {onboardingApi.errors.source}
                  </p>
                {/if}
              </div>

              <!-- Language Picker -->
              <div class="mt-10">
                <span class="dark:text-white">{$t('content.toggle_label')}: </span>
                <Select.Root type="single" bind:value={fields.locale}>
                  <Select.Trigger class="w-full">
                    <p>{DROPDOWN_ITEMS.find((item) => item.id === fields.locale)?.text}</p>
                  </Select.Trigger>
                  <Select.Content>
                    {#each DROPDOWN_ITEMS as item}
                      <Select.Item value={item.id}>{item.text}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="mt-8 flex w-full items-center justify-between">
        <div class="relative h-2 w-24 bg-gray-300">
          <span class="progress bg-primary-700 absolute left-0 top-0 h-full" style="width: {progress}%;"></span>
        </div>

        <div class="flex">
          {#if onboardingApi.step > ONBOARDING_STEPS.ORG_SETUP}
            <Button variant="ghost" onclick={() => (onboardingApi.step = ONBOARDING_STEPS.ORG_SETUP)}>
              {$t('onboarding.back')}
            </Button>
          {/if}
          <Button loading={onboardingApi.isLoading} onclick={() => onboardingApi.submit(fields)}>
            {$t('onboarding.continue')}
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .form-container {
    max-height: 66%;
  }
</style>
