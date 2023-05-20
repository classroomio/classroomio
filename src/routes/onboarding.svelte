<script context="module">
  //@ts-ignore
  export function preload(page, { config }) {
    return { config };
  }
</script>

<script lang="ts">
  import { goto } from '@sapper/app';
  import TextField from '../components/Form/TextField.svelte';
  import UserProfileIcon from '../components/Icons/UserProfileIcon.svelte';
  import PrimaryButton from '../components/PrimaryButton/index.svelte';
  import { VARIANTS } from '../components/PrimaryButton/constants';
  import { profile } from '../utils/store/user';
  import { orgs, currentOrg } from '../utils/store/org';
  import { onboardingValidation } from '../utils/functions/validator';
  import { supabase } from '../utils/functions/supabase';
  import { blockedSubdomain } from '../utils/constants/app';

  interface OnboardingField {
    fullname?: string;
    orgName?: string;
    siteName?: string;
    goal?: string;
    source?: string;
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
  };
  let errors: OnboardingField = {};
  let progress = 50;
  let step = 1;
  let loading = false;
  let isSiteNameTouched = false;

  const educatorGoals: Goal[] = [
    {
      label: 'Sell courses online',
      value: 'sell-online',
    },
    {
      label: 'Teach my current students online',
      value: 'teach-online',
    },
    {
      label: 'On another platform, expanding here',
      value: 'expanding-platform',
    },
    {
      label: 'Just here to explore',
      value: 'explore',
    },
  ];

  const sources = [
    {
      label: 'Articles',
      value: 'articles',
    },
    {
      label: 'Search engine',
      value: 'search-engine',
    },
    {
      label: 'Social media',
      value: 'social-media',
    },
    {
      label: 'Friends and family',
      value: 'friends-family',
    },
  ];

  async function setMetaData() {
    const response = await fetch('https://api.ipregistry.co/?key=tryout');
    const payload = await response.json();
    fields.metadata = payload;
  }

  function setOrgSiteName(orgName: string | undefined, isTouched: boolean) {
    console.log('set org name', orgName, isTouched);
    if (!orgName || isTouched) return;

    fields.siteName = orgName
      // @ts-ignore
      .replaceAll(' ', '-')
      .toLowerCase();
  }

  const handleSubmit = async () => {
    loading = true;
    // Run validation
    console.log(fields);
    errors = onboardingValidation(fields, step);
    console.log('errors', errors);

    if (Object.keys(errors).length) {
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

      const { data: org, error } = await supabase.from('organization').insert({
        name: fields.orgName,
        siteName: fields.siteName,
      });
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
          });
        console.log('Create organisation member', data);

        const memberId = Array.isArray(data) && data.length ? data[0].id : '';

        orgs.set([orgData as never]);
        currentOrg.set({
          ...orgData,
          memberId: memberId,
        });

        if (error) {
          console.log('Error: create organisation member', error);
          errors.siteName =
            'Something went wrong while creating this organization. Please reload and try again';

          // Delete organization so it can be recreated.
          await supabase
            .from('organization')
            .delete()
            .match({ siteName: fields.siteName });
          loading = false;
          return;
        }
      }

      // client
    }

    if (step === maxSteps) {
      // Submit filled

      // Set extra metadata based off location
      await setMetaData();

      let { data, error } = await supabase
        .from('profile')
        .update(fields)
        .match({ id: $profile.id });
      loading = false;

      console.log('data', data);
      console.log('error', error);
      return goto(`/org/${fields.siteName}`);
    }

    // Move to next step
    step = step + 1;
    loading = false;
  };

  $: progress = Math.round((step / maxSteps) * 100);
  $: setOrgSiteName(fields.orgName, isSiteNameTouched);
</script>

{#if $profile.id}
  <div class="w-full min-h-screen flex justify-center">
    <div class="flex justify-center items-center flex-col w-9/12 max-w-md">
      <!-- Header With Logo -->
      <div class="flex flex-col items-center">
        <div class="flex items-center w-full justify-center mb-4">
          <img
            src="/logo-192.png"
            alt="ClassroomIO logo"
            height="50"
            width="50"
            data-atf="1"
          />
          <h4 class="dark:text-white text-xl">ClassroomIO</h4>
        </div>

        <!-- Loggedin Email -->
        <div
          class="w-64 flex items-center justify-center mb-6 py-6 bg-gray-100 dark:bg-gray-700 rounded-2xl border border-gray-300"
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
              label="Full Name"
              bind:value={fields.fullname}
              type="text"
              placeholder="e.g Joke Silva"
              className="mb-5 w-full"
              labelClassName="text-lg font-normal"
              errorMessage={errors.fullname}
            />

            <!-- Org name -->
            <TextField
              label="Name of Organization"
              bind:value={fields.orgName}
              type="text"
              placeholder="e.g Education For All"
              className="mb-5 w-full"
              labelClassName="text-lg font-normal"
              errorMessage={errors.orgName}
              onChange={() => (isSiteNameTouched = true)}
            />

            <!-- Org Site Name -->
            <TextField
              label="Organisation Site name"
              helperMessage={`https://${fields.siteName || ''}.classroomio.com`}
              bind:value={fields.siteName}
              type="text"
              placeholder="e.g edforall"
              className="mb-5 w-full"
              labelClassName="text-lg font-normal"
              errorMessage={errors.siteName}
            />
          </div>
        {:else}
          <!-- Goal/Source Question -->
          <div id="goal-question" class="flex items-center flex-col mb-6">
            <div class="w-10/12">
              <!-- Goal Question -->
              <div
                class="w-full flex items-start flex-col justify-between mb-10"
              >
                <label
                  for="text-field"
                  class="dark:text-white m-0 text-lg font-normal mb-3"
                >
                  What brings you to ClassroomIO?
                </label>

                <!-- Loop through Goals -->
                {#each educatorGoals as goal}
                  <label
                    class="dark:text-white w-full inline-flex items-center mb-1 font-light"
                  >
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
                <label
                  for="text-field"
                  class="dark:text-white m-0 text-lg font-normal mb-3"
                >
                  How did you hear about us?
                </label>

                <!-- Loop through Goals -->
                {#each sources as source}
                  <label
                    class="dark:text-white w-full inline-flex items-center mb-1 font-light"
                  >
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
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="flex justify-between items-center mt-8 w-full">
        <div class="w-24 h-2 bg-gray-300 relative">
          <span
            class="progress absolute top-0 left-0 bg-blue-700 h-full"
            style="width: {progress}%;"
          />
        </div>

        <div class="flex">
          {#if step > 1}
            <PrimaryButton
              label="Back"
              variant={VARIANTS.NONE}
              className="py-3 px-6 mr-2 text-blue-700"
              onClick={() => (step = step - 1)}
            />
          {/if}
          <PrimaryButton
            label="Continue"
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
