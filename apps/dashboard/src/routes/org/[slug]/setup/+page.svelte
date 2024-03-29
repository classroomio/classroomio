<script>
  import Chip from '$lib/components/Chip/Text.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import StepDoneIcon from '$lib/components/Icons/StepDoneIcon.svelte';
  import { supabase } from '$lib/utils/functions/supabase';
  import { courses, courseMetaDeta } from '$lib/components/Courses/store';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { snackbar } from '$lib/components/Snackbar/store.js';

  export let data;
  let setupList = data.setup || [];
  let coursesList = $courses;
  let completed = 0;

  const StepsEnum = {
    CREATE_COURSE: 'Create Course',
    UPDATE_PROFILE: 'Upload a profile picture and update username',
    UPDATE_ORG_PROFILE: 'Update organisation profile picture',
    CREATE_LESSON: 'Create a lesson',
    CREATE_EXERCISE: 'Create an exercise',
    PUBLISH_COURSE: 'Publish a course'
  };

  // setting the database is_completed to true or false on mount

  // check if the user has any course
  // if true set create course to true;
  // loop through the array of course and check if they have any lesson
  // if true set the create lesson to true
  // also loop through the array of lessons and check if the lessons has any exercise,if true set the create exercise to true

  //UTILITY FUNCTIONS
  function hasCourse() {
    return coursesList.length > 0;
  }

  function hasLesson(course) {
    return course.total_lessons > 0;
  }

  function isPublished(course) {
    return course.is_published;
  }

  function hasExercise(course) {
    //TODO
    //check if any lesson in a course has an exercise
    //probably loop through the lessons in the course
    return false;
  }

  function checkUserProfile() {
    //TODO
    //get the user profile details and check if there is an avatar_url different from the default avatar_url
    // update supabase accordingly
    return false;
  }

  function checkOrgProfile() {
    //TODO
    //get current org details and check if there is an avatar url different from the default avatar_url
    // update supabase accordingly
    return false;
  }

  async function updateCompletion() {
    let hasAnyCourse = false;
    let anyCourseHasLessons = false;
    let anyCourseIsPublished = false;

    for (const step of setupList) {
      switch (step.title) {
        case StepsEnum.CREATE_COURSE:
          if (!hasAnyCourse) {
            hasAnyCourse = hasCourse();
          }
          await updateIsCompleted(step.id, hasAnyCourse);
          break;

        case StepsEnum.CREATE_LESSON:
          if (!anyCourseHasLessons) {
            anyCourseHasLessons = coursesList.some((course) => hasLesson(course));
          }
          await updateIsCompleted(step.id, anyCourseHasLessons);
          break;

        case StepsEnum.CREATE_EXERCISE:
          const createLessonStep = setupList.find((item) => item.title === StepsEnum.CREATE_LESSON);
          if (createLessonStep && createLessonStep.is_completed) {
            const anyCourseHasExercises = coursesList.some((course) => hasExercise(course));
            await updateIsCompleted(step.id, anyCourseHasExercises);
          }
          break;

        case StepsEnum.PUBLISH_COURSE:
          if (!anyCourseIsPublished) {
            anyCourseIsPublished = coursesList.some((course) => isPublished(course));
          }
          await updateIsCompleted(step.id, anyCourseIsPublished);
          break;

        case StepsEnum.UPDATE_PROFILE:
          const userHasProfile = checkUserProfile();
          await updateIsCompleted(step.id, userHasProfile);
          break;

        case StepsEnum.UPDATE_ORG_PROFILE:
          const orgHasProfile = checkOrgProfile();
          await updateIsCompleted(step.id, orgHasProfile);
          break;
      }
    }
  }

  async function updateIsCompleted(itemId, value) {
    const { data, error } = await supabase
      .from('onboarding_setup')
      .update({ is_completed: value })
      .eq('id', itemId);
    const updated = setupList?.find((list) => list.id === itemId);
    if (updated && setupList) {
      updated.is_completed = value;
      setupList = [...setupList];
    }
    console.log('itemId', itemId, updated);
    if (error) {
      console.error('Error updating is_completed:', error.message);
    }
  }

  const handleClick = (title) => {
    switch (title) {
      case StepsEnum.CREATE_COURSE:
        goto(`/org/${$currentOrg.siteName}/courses?create=true`);

        break;

      case StepsEnum.CREATE_LESSON:
        if (hasCourse()) {
          const courseId = coursesList[0].id;
          goto(`/courses/${courseId}`);
        } else {
          snackbar.error('No course has been created');
        }
        break;

      case StepsEnum.CREATE_EXERCISE:
        for (const course of coursesList) {
          //TODO
          // we need to navigate to the first lesson,but what if the lesson is locked?
          // then we navigate to the next availale unlocked lesson and if there is none, throw an error
          if (hasLesson(course)) {
            const id = course.lessons?.[0].id;
            goto(`/courses/${id}`);
          } else {
            snackbar.error('You Need to Create a lesson');
          }
        }
        break;

      case StepsEnum.PUBLISH_COURSE:
        if (hasCourse()) {
          const courseId = coursesList[0].id;
          goto(`/courses/${courseId}/settings`);
        } else {
          snackbar.error('You need to creat a course');
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

  $: completed = setupList.filter((list) => list.is_completed).length;

  onMount(async () => {
    await updateCompletion();
  });
  $: console.log('data', data);
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
