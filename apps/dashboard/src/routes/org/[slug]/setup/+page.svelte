<script>
  import Chip from '$lib/components/Chip/Text.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import StepDoneIcon from '$lib/components/Icons/StepDoneIcon.svelte';

  import { courses } from '$lib/components/Courses/store';
  import { currentOrg } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';
  import { snackbar } from '$lib/components/Snackbar/store.js';
  import { profile } from '$lib/utils/store/user';
  import { lessons } from '$lib/components/Course/components/Lesson/store/lessons';

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
          const courseId = $courses[0].id;
          goto(`/courses/${courseId}/lessons`);
        } else {
          snackbar.info('You need to create a course');
        }
        break;

      case StepsEnum.CREATE_EXERCISE:
        if (isCompleted('lesson')) {
          const courseId = $courses[0].id;
          const lessonId = $lessons[0].id;
          goto(`/courses/${courseId}/lessons/${lessonId}`);
        } else {
          snackbar.info('You Need to Create a lesson');
        }
        break;

      case StepsEnum.PUBLISH_COURSE:
        if (isCompleted('course')) {
          const courseId = $courses[0].id;
          goto(`/courses/${courseId}/settings`);
        } else {
          snackbar.info('You need to create a course');
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

<section>
  <div class="py-2 md:py-10 px-2 md:px-5">
    <div class="flex items-center gap-2">
      <h1 class="dark:text-white text-2xl md:text-3xl font-bold">Get Started</h1>
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
          <div class={`${list.is_completed ? 'text-[#656565]' : ''} space-y-2 flex-1`}>
            <div class="flex items-center gap-2">
              <Chip
                value={i + 1}
                className={`${
                  list.is_completed ? 'bg-gray-400' : ''
                } text-[10px] font-semibold !py-1 `}
                shape="rounded-full"
              />
              <p class="font-semibold text-xl">{list.title}</p>
            </div>
            <p class={`text-sm`}>{list.desc}</p>
          </div>
          <div class="w-fit ml-auto lg:w-[15vw]">
            {#if list.is_completed}
              <div class="w-full flex justify-center">
                <StepDoneIcon />
              </div>
            {:else}
              <PrimaryButton
                label={list.button_label}
                className="!w-full font-normal text-sm"
                onClick={() => handleClick(list.title)}
              />
            {/if}
          </div>
        </div>
      {/each}
    </section>
  </div>
</section>
