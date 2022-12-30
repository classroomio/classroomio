<script lang="ts">
  import { goto } from '@sapper/app';
  import CheckmarkFilled20 from 'carbon-icons-svelte/lib/CheckmarkFilled20';
  import TextField from '../components/Form/TextField.svelte';
  import UserProfileIcon from '../components/Icons/UserProfileIcon.svelte';
  import PrimaryButton from '../components/PrimaryButton/index.svelte';
  import { VARIANTS } from '../components/PrimaryButton/constants';
  import { profile } from '../utils/store/user';
  import { ROUTE } from '../utils/constants/routes';
  import { onboardingValidation } from '../utils/functions/validator';
  import { supabase } from '../utils/functions/supabase';

  enum OnboardingRoles {
    Educator = 'educator',
    Student = 'student',
  }

  interface OnboardingField {
    fullname?: string;
    role?: OnboardingRoles;
    goal?: string;
    source?: string;
  }

  interface Goal {
    label: string;
    value: string;
  }

  const maxSteps = 2;

  let fields: OnboardingField = {
    fullname: '',
  };
  let errors: OnboardingField = {};
  let progress = 50;
  let step = 1;
  let goals: Goal[] = [];
  let loading = false;

  const roles = [OnboardingRoles.Educator, OnboardingRoles.Student];

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

  const studentGoals: Goal[] = [
    {
      label: 'Find new courses',
      value: 'find-course',
    },
    {
      label: 'Join my class online',
      value: 'join-class',
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

  const onGoalInputChange = (event: KeyboardEvent) => {
    console.log('event', event);
    fields.goal = (event.target as HTMLInputElement).value;
  };

  const onSourceInputChange = (event: KeyboardEvent) => {
    console.log('event', event);
    fields.source = (event.target as HTMLInputElement).value;
  };

  const handleSubmit = async () => {
    // Run validation
    console.log(fields);
    errors = onboardingValidation(fields, step);
    console.log('errors', errors);

    if (Object.keys(errors).length) {
      return;
    }

    if (step === maxSteps) {
      // Submit filed
      loading = true;
      let { data, error } = await supabase
        .from('profile')
        .update(fields)
        .match({ id: $profile.id });
      loading = false;

      console.log('data', data);
      console.log('error', error);
      return goto(ROUTE.DASHBOARD);
    }

    // Move to next step
    step = step + 1;
  };

  $: {
    progress = Math.round((step / maxSteps) * 100);
    goals =
      fields.role === OnboardingRoles.Educator ? educatorGoals : studentGoals;
  }
</script>

<div class="w-full min-h-screen flex justify-center">
  <div class="flex justify-center items-center flex-col w-9/12 lg:w-2/5">
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
        <h4 class="text-xl">ClassroomIO</h4>
      </div>

      <!-- Loggedin Email -->
      <div
        class="w-64 flex items-center justify-center mb-6 py-6 bg-gray-100 rounded-2xl border border-gray-300"
      >
        <UserProfileIcon />
        <p class="text-sm ml-2">{$profile.email}</p>
      </div>
    </div>

    <div class="form-container overflow-y-auto w-full pl-2">
      {#if step === 1}
        <!-- Role Question -->
        <div id="role-question" class="flex items-start flex-col mb-6">
          <!-- Full name questionn -->
          <TextField
            label="Full Name"
            bind:value={fields.fullname}
            type="text"
            placeholder="e.g Joke Silva"
            className="mb-5 w-7/12"
            labelClassName="text-lg font-normal"
            errorMessage={errors.fullname}
          />

          <!-- Roal question -->
          <div>
            <p class="text-lg font-normal mb-2">What's your main goal today?</p>
            <p class="text-sm mb-6">
              This will help us personalize your experience on Classroomio
            </p>

            <!-- Roles -->
            <div class="flex items-center">
              {#each roles as role, index}
                <button
                  class="w-52 h-44 p-4 {index === 0 &&
                    'mr-4'} flex flex-col justify-between bg-gray-200 rounded-md {fields.role ===
                    role &&
                    'border-2 border-blue-700'} hover:shadow-xl hover:border-blue-700 transition delay-150 duration-300 ease-in-out"
                  type="button"
                  on:click={() => (fields.role = role)}
                >
                  <div class="flex flex-col items-end w-full">
                    {#if fields.role === role}
                      <CheckmarkFilled20 class="text-blue-700" />
                    {/if}
                  </div>
                  <div>
                    <h4 class="text-lg text-left capitalize">{role}</h4>
                    <p class="text-sm text-black-200">
                      {role === OnboardingRoles.Educator ? 'Teach' : 'Learn'} on
                      ClassroomIO
                    </p>
                  </div>
                </button>
              {/each}
            </div>
            {#if errors.role}
              <p class="text-sm text-red-500">{errors.role}</p>
            {/if}
          </div>
        </div>
      {:else}
        <!-- Goal/Source Question -->
        <div id="goal-question" class="flex items-center flex-col mb-6">
          <div class="w-10/12">
            <!-- Goal Question -->
            <div class="w-full flex items-start flex-col justify-between mb-10">
              <label for="text-field" class="m-0 text-lg font-normal mb-3">
                What brings you to ClassroomIO?
              </label>

              <!-- Loop through Goals -->
              {#each goals as goal}
                <label class="w-full inline-flex items-center mb-1 font-light">
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
                <p class="text-sm text-red-500">{errors.goal}</p>
              {/if}
            </div>

            <!-- Source Question -->
            <div class="w-full flex items-start flex-col justify-between">
              <label for="text-field" class="m-0 text-lg font-normal mb-3">
                How did you hear about us?
              </label>

              <!-- Loop through Goals -->
              {#each sources as source}
                <label class="w-full inline-flex items-center mb-1 font-light">
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
                <p class="text-sm text-red-500">{errors.source}</p>
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
          type="button"
          className="px-5 py-3"
          isLoading={loading}
          onClick={handleSubmit}
        />
      </div>
    </div>
  </div>
</div>

<style>
  .form-container {
    max-height: 66%;
  }
</style>
