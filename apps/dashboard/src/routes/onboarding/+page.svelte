<script lang="ts">
  import { env } from '$env/dynamic/public';
  import { goto } from '$app/navigation';
  import { Dropdown } from 'carbon-components-svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import UserProfileIcon from '$lib/components/Icons/UserProfileIcon.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { profile } from '$lib/utils/store/user';
  import { onboardingValidation } from '$lib/utils/functions/validator';
  import { supabase } from '$lib/utils/functions/supabase';
  import { blockedSubdomain } from '$lib/utils/constants/app';
  import { getOrganizations } from '$lib/utils/services/org';
  import { generateSitename } from '$lib/utils/functions/org';
  import {
    triggerSendEmail,
    NOTIFICATION_NAME
  } from '$lib/utils/services/notification/notification';
  import { handleLocaleChange, t } from '$lib/utils/functions/translations';
  import { LOCALE } from '$lib/utils/types';

  interface OnboardingField {
    fullname?: string;
    orgName?: string;
    siteName?: string;
    goal?: string;
    source?: string;
    locale?: LOCALE;
    metadata?: {};
  }

  interface Goal {
    label: string;
    value: string;
  }

  const maxSteps = 2;
  let fields: OnboardingField = {
    fullname: '',
    orgName: '',
    siteName: '',
    locale: LOCALE.EN
  };
  let errors: OnboardingField = {};
  let progress = 50;
  let step = 1;
  let loading = false;
  let isSiteNameTouched = false;
  let selectedId = 'en';

  let dropdownItems = [
    { id: 'de', text: 'German' },
    { id: 'en', text: 'English' },
    { id: 'es', text: 'Spanish' },
    { id: 'fr', text: 'French' },
    { id: 'hi', text: 'Hindi' },
    { id: 'pl', text: 'Polish' },
    { id: 'pt', text: 'Portuguese' },
    { id: 'ru', text: 'Russian' },
    { id: 'vi', text: 'Vietnamese' },
    { id: 'da', text: 'Danish' }
  ];

  const educatorGoals: Goal[] = [
    {
      label: $t('onboarding.sell'),
      value: 'sell-online'
    },
    {
      label: $t('onboarding.teach'),
      value: 'teach-online'
    },
    {
      label: $t('onboarding.employees'),
      value: 'employees'
    },
    {
      label: $t('onboarding.customers'),
      value: 'customers'
    },
    {
      label: $t('onboarding.expanding'),
      value: 'expanding-platform'
    }
  ];

  const sources = [
    {
      label: $t('onboarding.articles'),
      value: 'articles'
    },
    {
      label: $t('onboarding.search'),
      value: 'search-engine'
    },
    {
      label: $t('onboarding.social'),
      value: 'social-media'
    },
    {
      label: $t('onboarding.friends'),
      value: 'friends-family'
    }
  ];

  function handleSelect(event) {
    const newSelectedId = event.detail.selectedId;
    fields.locale = newSelectedId;
  }

  function setOrgSiteName(orgName: string | undefined, isTouched: boolean) {
    if (!orgName || isTouched) return;

    fields.siteName = orgName
      ?.toLowerCase()
      ?.replace(/\s+/g, '-')
      ?.replace(/[^a-zA-Z0-9-]/g, '');
  }

  const handleSubmit = async () => {
    loading = true;
    // Run validation
    console.log(fields);
    errors = onboardingValidation(fields, step);
    console.log('errors', errors);

    if (Object.keys(errors).length || !$profile.id) {
      loading = false;
      return;
    }

    if (step === 1) {
      // Validate if domain is among our seculeded subdomains
      if (blockedSubdomain.includes(fields.siteName || '')) {
        errors.siteName = 'Sitename already exists.';
        loading = false;
        return;
      }

      const { data: org, error } = await supabase
        .from('organization')
        .insert({
          name: fields.orgName,
          siteName: fields.siteName
        })
        .select();
      console.log('Create organisation', org);
      if (error) {
        console.log('Error: create organisation', error);
        errors.siteName = 'Sitename already exists.';
        loading = false;
        return;
      }

      if (Array.isArray(org) && org.length) {
        const orgData = org[0];
        const { data, error } = await supabase
          .from('organizationmember')
          .insert({
            organization_id: orgData.id,
            profile_id: $profile.id,
            role_id: 1,
            verified: true
          })
          .select();
        console.log('Create organisation member', data);

        if (error) {
          console.log('Error: create organisation member', error);
          errors.siteName = $t('add_org.error_organization');

          // Delete organization so it can be recreated.
          await supabase.from('organization').delete().match({ siteName: fields.siteName });
          loading = false;
          return;
        }

        await getOrganizations($profile.id);
      }

      // client
    }

    if (step === maxSteps) {
      // Submit filled

      // Set extra metadata based off location
      await supabase
        .from('profile')
        .update({
          ...fields,
          orgName: undefined,
          siteName: undefined
        })
        .match({ id: $profile.id });

      loading = false;

      if (fields.fullname) {
        $profile.fullname = fields.fullname;
      }
      if (fields.locale) {
        $profile.locale = fields.locale;

        if (fields.locale !== LOCALE.EN) {
          handleLocaleChange(fields.locale);
        }
      }
      triggerSendEmail(NOTIFICATION_NAME.VERIFY_EMAIL, {
        to: $profile.email,
        profileId: $profile.id,
        fullname: $profile.fullname,
        orgSiteName: fields.siteName
      });

      const welcomePopup = `${$profile.is_email_verified}`;

      return goto(`/org/${fields.siteName}?welcomePopup=${welcomePopup}`);
    }

    // Move to next step
    step = step + 1;
    loading = false;
  };

  $: progress = Math.round((step / maxSteps) * 100);
  $: fields.siteName = generateSitename(fields.siteName || '');
  $: setOrgSiteName(fields.orgName, isSiteNameTouched);
</script>

{#if $profile.id}
  <div class="flex min-h-screen w-full justify-center">
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
        {#if step === 1}
          <!-- Name/Organization Question -->
          <div id="role-question" class="mb-6 flex flex-col items-start">
            <!-- Full name -->
            <TextField
              label={$t('onboarding.fullname')}
              bind:value={fields.fullname}
              name="fullname"
              type="text"
              placeholder="e.g Joke Silva"
              className="mb-5 w-full"
              labelClassName="text-lg font-normal"
              errorMessage={errors.fullname}
              isRequired
            />

            <!-- Org name -->
            <TextField
              label={$t('onboarding.name')}
              bind:value={fields.orgName}
              name="orgname"
              type="text"
              placeholder="e.g Education For All"
              className="mb-5 w-full"
              labelClassName="text-lg font-normal"
              errorMessage={errors.orgName}
              isRequired
            />

            <!-- Org Site Name -->
            <TextField
              label={$t('onboarding.organisation_sitename')}
              helperMessage={`https://${fields.siteName || ''}.classroomio.com`}
              bind:value={fields.siteName}
              name="sitename"
              type="text"
              placeholder="e.g edforall"
              className="mb-5 w-full"
              labelClassName="text-lg font-normal"
              errorMessage={errors.siteName}
              onChange={() => {
                isSiteNameTouched = true;
              }}
              isRequired
            />
          </div>
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
                {#each educatorGoals as goal}
                  <label class="mb-1 inline-flex w-full items-center font-light dark:text-white">
                    <input
                      type="radio"
                      bind:group={fields.goal}
                      name="goal"
                      value={goal.value}
                      class="mr-2"
                    />
                    {goal.label}
                  </label>
                {/each}
                <!-- Goal: Error message -->
                {#if errors.goal}
                  <p class="text-sm text-red-500">
                    {errors.goal}
                  </p>
                {/if}
              </div>

              <!-- Source Question -->
              <div class="flex w-full flex-col items-start justify-between">
                <label for="text-field" class="m-0 mb-3 text-lg font-normal dark:text-white">
                  {$t('onboarding.how')}
                </label>

                <!-- Loop through Goals -->
                {#each sources as source}
                  <label class="mb-1 inline-flex w-full items-center font-light dark:text-white">
                    <input
                      type="radio"
                      bind:group={fields.source}
                      name="source"
                      value={source.value}
                      class="mr-2"
                    />
                    {source.label}
                  </label>
                {/each}
                <!-- Goal: Error message -->
                {#if errors.source}
                  <p class="text-sm text-red-500">
                    {errors.source}
                  </p>
                {/if}
              </div>

              <!-- Language Picker -->
              <div class="mt-10">
                <span>{$t('content.toggle_label')}: </span>
                <Dropdown
                  items={dropdownItems}
                  {selectedId}
                  on:select={handleSelect}
                  class="w-full"
                />
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="mt-8 flex w-full items-center justify-between">
        <div class="relative h-2 w-24 bg-gray-300">
          <span
            class="progress bg-primary-700 absolute left-0 top-0 h-full"
            style="width: {progress}%;"
          />
        </div>

        <div class="flex">
          {#if step > 1}
            <PrimaryButton
              label={$t('onboarding.back')}
              variant={VARIANTS.NONE}
              className="py-3 px-6 mr-2 text-primary-700"
              onClick={() => (step = step - 1)}
            />
          {/if}
          <PrimaryButton
            label={$t('onboarding.continue')}
            variant={VARIANTS.CONTAINED}
            type="button"
            className="px-5 py-3"
            isLoading={loading}
            onClick={handleSubmit}
          />
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
