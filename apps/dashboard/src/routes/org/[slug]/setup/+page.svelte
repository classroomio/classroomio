<script lang="ts">
  import Chip from '$lib/components/Chip/Text.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import CircleCheckIcon from '$lib/components/Icons/CircleCheckIcon.svelte';

  import { currentOrg } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';
  import { snackbar } from '$lib/components/Snackbar/store.js';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();
  const setupList = $derived(
    (data.setup || []).map((item) => {
      if (item.id === 'profile') {
        item.is_completed = !$profile.avatar_url.includes('avatars/avatar.png');
      }
      return item;
    })
  );

  const completed = $derived(setupList.filter((list) => list.is_completed).length);

  const StepsEnum = {
    UPDATE_PROFILE: 'profile',
    UPDATE_ORG_PROFILE: 'organization',
    CREATE_COURSE: 'course',
    CREATE_LESSON: 'lesson',
    CREATE_EXERCISE: 'exercise',
    PUBLISH_COURSE: 'publish'
  };

  const isCompleted = (id) => {
    return setupList?.find((c) => c.id === id)?.is_completed == true;
  };

  const handleClick = (id) => {
    switch (id) {
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
</script>

<section class="mx-auto w-full md:max-w-4xl">
  <div class="px-2 py-2 md:px-5 md:py-10">
    <div class="flex items-center gap-2">
      <h1 class="text-2xl font-bold md:text-3xl dark:text-white">{$t('setup.get_started')}</h1>
      <Chip
        value={`${completed}/${setupList.length}`}
        className="text-[10px] font-semibold px-3 !py-1"
        shape="rounded-full"
      />
    </div>

    <section class="px-4">
      {#each setupList as list, i}
        <div
          class="flex w-full flex-col justify-between gap-2 border-b border-gray-300 py-8 lg:flex-row lg:items-center"
        >
          <div class={`flex-1 space-y-1 ${list.is_completed ? 'opacity-50' : ''}  lg:max-w-[50%]`}>
            <div class="flex items-center gap-3">
              <Chip value={i + 1} className={`text-[10px] font-semibold !py-1 `} shape="rounded-full" />
              <p class="text-lg font-medium">{$t(list.title)}</p>
            </div>
            <p class="text-sm">
              {$t(list.desc)}
            </p>
          </div>
          <div class="w-full lg:w-[30%]">
            <PrimaryButton
              variant={list.is_completed ? VARIANTS.CONTAINED_DARK : VARIANTS.OUTLINED}
              className="!w-full font-normal text-sm flex items-center gap-2"
              onClick={() => handleClick(list.id)}
              isDisabled={list.is_completed}
            >
              {#if list.is_completed}
                <CircleCheckIcon />
              {/if}
              {$t(list.button_label)}
            </PrimaryButton>
          </div>
        </div>
      {/each}
    </section>
  </div>
</section>
