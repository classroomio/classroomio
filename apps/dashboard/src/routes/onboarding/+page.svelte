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
    { id: 'en', text: 'English' },
    { id: 'hi', text: 'Hindi' },
    { id: 'fr', text: 'French' },
    { id: 'pt', text: 'Portuguese' },
    { id: 'de', text: 'German' },
    { id: 'vi', text: 'Vietnamese' },
    { id: 'ru', text: 'Russian' },
    { id: 'es', text: 'Spanish' }
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
      label: $t('onboarding.expanding'),
      value: 'expanding-platform'
    },
    {
      label: $t('onboarding.explore'),
      value: 'explore'
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

  async function setMetaData() {
    if (!env.PUBLIC_IP_REGISTRY_KEY) return;

    const response = await fetch(`https://api.ipregistry.co/?key=${env.PUBLIC_IP_REGISTRY_KEY}`);
    const payload = await response.json();
    fields.metadata = payload;
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
      await setMetaData();

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
  <div class="w-full min-h-screen flex justify-center">
    <div class="flex justify-center items-center flex-col w-9/12 max-w-md">
      <!-- Header With Logo -->
      <div class="flex flex-col items-center">
        <div class="flex items-center w-full justify-center mb-4">
          <img src="/logo-192.png" alt="ClassroomIO logo" height="50" width="50" data-atf="1" />
          <h4 class="dark:text-white text-xl">ClassroomIO</h4>
        </div>

        <!-- Loggedin Email -->
        <div
          class="w-64 flex items-center justify-center mb-6 py-6 bg-gray-100 dark:bg-neutral-800 rounded-2xl border border-gray-300"
        >
          <UserProfileIcon />
          <p class="dark:text-white text-sm ml-2">{$profile.email}</p>
        </div>
      </div>

      <div class="form-container overflow-y-auto w-full px-2">
        {#if step === 1}
          <!-- Name/Organization Question -->
          <div id="role-question" class="flex items-start flex-col mb-6">
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
          <div id="goal-question" class="flex items-center flex-col mb-6">
            <div class="w-10/12">
              <!-- Goal Question -->
              <div class="w-full flex items-start flex-col justify-between mb-10">
                <label for="text-field" class="dark:text-white m-0 text-lg font-normal mb-3">
                  {$t('onboarding.what_brings')}
                </label>

                <!-- Loop through Goals -->
                {#each educatorGoals as goal}
                  <label class="dark:text-white w-full inline-flex items-center mb-1 font-light">
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
              <div class="w-full flex items-start flex-col justify-between">
                <label for="text-field" class="dark:text-white m-0 text-lg font-normal mb-3">
                  {$t('onboarding.how')}
                </label>

                <!-- Loop through Goals -->
                {#each sources as source}
                  <label class="dark:text-white w-full inline-flex items-center mb-1 font-light">
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
      <div class="flex justify-between items-center mt-8 w-full">
        <div class="w-24 h-2 bg-gray-300 relative">
          <span
            class="progress absolute top-0 left-0 bg-primary-700 h-full"
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
