<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Item from '@cio/ui/base/item';
  import * as Page from '@cio/ui/base/page';
  import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import UserPlusIcon from '@lucide/svelte/icons/user-plus';
  import UsersIcon from '@lucide/svelte/icons/users';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import FileTextIcon from '@lucide/svelte/icons/file-text';

  import { currentOrg } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';
  import { snackbar } from '$lib/components/Snackbar/store.js';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();
  const setupList = $derived(
    (data.setup || []).map((item) => {
      if (item.id === 'profile') {
        item.is_completed = !$profile.avatarUrl?.includes('avatars/avatar.png');
      }
      return item;
    })
  );

  const completed = $derived(setupList.filter((list) => list.is_completed).length);
  const total = $derived(setupList.length);
  const progressPercentage = $derived(Math.round((completed / total) * 100));

  const StepsEnum = {
    UPDATE_PROFILE: 'profile',
    UPDATE_ORG_PROFILE: 'organization',
    CREATE_COURSE: 'course',
    CREATE_LESSON: 'lesson',
    CREATE_EXERCISE: 'exercise',
    PUBLISH_COURSE: 'publish'
  };

  const isCompleted = (id: string) => {
    return setupList?.find((c) => c.id === id)?.is_completed == true;
  };

  const handleClick = (id: string) => {
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
        goto(`/org/${$currentOrg.siteName}/settings/org`);
        break;
    }
  };
</script>

<svelte:head>
  <title>Setup - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full md:max-w-4xl lg:mx-auto">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('setup.get_started')}</Page.Title>
      <Page.Subtitle>{$t('setup.description')}</Page.Subtitle>
    </Page.HeaderContent>

    <Page.Action>
      <div class="relative shrink-0">
        <svg class="size-14 -rotate-90" viewBox="0 0 100 100">
          <!-- Background circle -->
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            stroke-width="8"
            class="text-gray-200 dark:text-gray-700"
          />
          <!-- Progress circle -->
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            stroke-width="8"
            stroke-linecap="round"
            class="text-green-600"
            stroke-dasharray={2 * Math.PI * 45}
            stroke-dashoffset={2 * Math.PI * 45 * (1 - progressPercentage / 100)}
            style="transition: stroke-dashoffset 0.5s ease-in-out;"
          />
        </svg>
        <!-- Center text -->
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <p class="text-sm font-bold">{progressPercentage}%</p>
        </div>
      </div>
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <section class="space-y-6 px-4">
        <Item.Root variant="outline">
          <Item.Content>
            <Item.Description class="mb-4">
              {$t('setup.description')}
            </Item.Description>
            <div class="flex items-center gap-2">
              <Item.Description class="text-sm">
                {completed} of {total}
                {$t('setup.completed')}
              </Item.Description>
              <div class="flex gap-1">
                {#each Array(total) as _, i}
                  <div
                    class="size-2 rounded-full {i < completed ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}"
                  ></div>
                {/each}
              </div>
            </div>
          </Item.Content>
        </Item.Root>

        <!-- Setup Items -->
        <Item.Group class="space-y-2">
          {#each setupList as list}
            <Item.Root variant="muted" class={list.is_completed ? 'opacity-60' : ''}>
              <Item.Media variant="icon">
                {#if list.is_completed}
                  <div class="flex size-5 items-center justify-center rounded">
                    <BadgeCheckIcon class="size-5 text-white" />
                  </div>
                {:else if list.id === StepsEnum.CREATE_COURSE}
                  <BookOpenIcon class="size-5 text-gray-600" />
                {:else if list.id === StepsEnum.CREATE_LESSON || list.id === StepsEnum.CREATE_EXERCISE}
                  <FileTextIcon class="size-5 text-gray-600" />
                {:else if list.id === StepsEnum.PUBLISH_COURSE}
                  <GlobeIcon class="size-5 text-gray-600" />
                {:else if list.id === StepsEnum.UPDATE_PROFILE}
                  <UserPlusIcon class="size-5 text-gray-600" />
                {:else if list.id === StepsEnum.UPDATE_ORG_PROFILE}
                  <UsersIcon class="size-5 text-gray-600" />
                {:else}
                  <BookOpenIcon class="size-5 text-gray-600" />
                {/if}
              </Item.Media>
              <Item.Content>
                <Item.Title class={list.is_completed ? 'text-gray-500 line-through' : 'font-semibold'}>
                  {$t(list.title)}
                </Item.Title>
                <Item.Description class={list.is_completed ? 'text-gray-500 line-through' : ''}>
                  {$t(list.desc)}
                </Item.Description>
              </Item.Content>
              <Item.Actions>
                {#if list.is_completed}
                  <Button variant="secondary" size="sm" disabled class="bg-gray-400 text-white">
                    {$t('setup.done')}
                  </Button>
                {:else}
                  <Button variant="outline" size="sm" onclick={() => handleClick(list.id)} class="w-full sm:w-auto">
                    {$t('setup.todo')}
                    <ChevronRightIcon class="ml-2 size-4" />
                  </Button>
                {/if}
              </Item.Actions>
            </Item.Root>
          {/each}
        </Item.Group>
      </section>
    {/snippet}
  </Page.Body>
</Page.Root>
