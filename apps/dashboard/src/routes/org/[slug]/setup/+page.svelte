<script>
  import Chip from '$lib/components/Chip/Text.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import StepDoneIcon from '$lib/components/Icons/StepDoneIcon.svelte';
  import CheckmarkOutline from 'carbon-icons-svelte/lib/CheckmarkOutline.svelte';

  import { currentOrg } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';
  import { snackbar } from '$lib/components/Snackbar/store.js';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';

  export let data;
  let setupList = data.setup || [];
  let completed = 0;

  const StepsEnum = {
    UPDATE_PROFILE: 'Upload a profile picture and update username',
    UPDATE_ORG_PROFILE: 'Update organisation profile picture',
    CREATE_COURSE: 'Create Course',
    CREATE_LESSON: 'Create a lesson',
    CREATE_EXERCISE: 'Create an exercise',
    PUBLISH_COURSE: 'Publish a course'
  };

  const isCompleted = (id) => {
    return setupList?.find((c) => c.id === id).is_completed == true;
  };

  const handleClick = (title) => {
    switch (title) {
      case StepsEnum.CREATE_COURSE:
        goto(`/org/${$currentOrg.siteName}/courses?create=true`);
        break;

      case StepsEnum.CREATE_LESSON:
        if (isCompleted('course')) {
          const courseId = data?.courses[0].id;
          goto(`/courses/${courseId}/lessons`);
        } else {
          snackbar.info('setup.info_course');
        }
        break;

      case StepsEnum.CREATE_EXERCISE:
        if (isCompleted('lesson')) {
          const courseId = data?.courses[0].id;
          const lessonId = data?.lessons[0].id;
          goto(`/courses/${courseId}/lessons/${lessonId}`);
        } else {
          snackbar.info('setup.info_lesson');
        }
        break;

      case StepsEnum.PUBLISH_COURSE:
        if (isCompleted('course')) {
          const courseId = data?.courses[0].id;
          goto(`/courses/${courseId}/settings`);
        } else {
          snackbar.info('setup.info_course');
        }
        break;

      case StepsEnum.UPDATE_PROFILE:
        goto(`/org/${$currentOrg.siteName}/settings`);
        break;

      case StepsEnum.UPDATE_ORG_PROFILE:
        goto(`/org/${$currentOrg.siteName}/settings?tab=org`);
        break;
    }
  };

  $: setupList = setupList.map((item) => {
    if (item.id === 'profile') {
      item.is_completed = !$profile.avatar_url.includes('avatars/avatar.png');
    }
    return item;
  });

  $: completed = setupList.filter((list) => list.is_completed).length;
</script>

<section class="w-full md:max-w-4xl mx-auto">
  <div class="py-2 md:py-10 px-2 md:px-5">
    <div class="flex items-center gap-2">
      <h1 class="dark:text-white text-2xl md:text-3xl font-bold">{$t('setup.get_started')}</h1>
      <Chip
        value={`${completed}/${setupList.length}`}
        className="text-[10px] font-semibold px-3 !py-1"
        shape="rounded-full"
      />
    </div>

    <section class="px-4">
      {#each setupList as list, i}
        <div
          class="flex flex-col lg:flex-row lg:items-center justify-between gap-2 w-full py-8 border-b border-gray-300"
        >
          <div class={`space-y-2 flex-1 ${list.is_completed ? 'opacity-50' : ''}  max-w-[50%]`}>
            <div class="flex items-center gap-2">
              <Chip
                value={i + 1}
                className={`text-[10px] font-semibold !py-1 `}
                shape="rounded-full"
              />
              <p class="font-medium text-lg">{$t(list.title)}</p>
            </div>
            <p class={`text-sm`}></p>
          </div>
          <div class="w-[30%]">
            <PrimaryButton
              variant={list.is_completed ? VARIANTS.CONTAINED_DARK : VARIANTS.OUTLINED}
              className="!w-full font-normal text-sm flex items-center gap-2"
              onClick={() => handleClick(list.title)}
              isDisabled={list.is_completed}
            >
              {#if list.is_completed}
                <CheckmarkOutline />
              {/if}
              {$t(list.button_label)}
            </PrimaryButton>
          </div>
        </div>
      {/each}
    </section>
  </div>
</section>
