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
  import SetupProgress from '$features/setup/components/setup-progress.svelte';

  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { setupProgressApi } from '$features/setup/api/setup-progress.svelte';
  import { goToSetupItem, SETUP_STEPS } from '$features/setup/utils/setup-navigation';

  let { data } = $props();

  $effect(() => {
    if (data.setupProgress && data.orgSiteName) {
      setupProgressApi.initializeFromServerData(data.setupProgress, data.orgSiteName);
    }
  });

  const setupList = $derived(
    setupProgressApi.setupList.map((item) => {
      if (item.id === 'profile') {
        return {
          ...item,
          is_completed: !$profile.avatarUrl?.includes('avatars/avatar.png') || !!$profile.avatarUrl
        };
      }
      return item;
    })
  );

  const completed = $derived(setupList.filter((list) => list.is_completed).length);
  const total = $derived(setupList.length);
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
      <SetupProgress setupItems={setupList} />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <section class="space-y-6 px-4">
        <Item.Root variant="outline" class="cursor-default">
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
                {#each Array(total) as _, i (i)}
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
          {#each setupList as list (list.id)}
            <Item.Root
              variant="muted"
              class={list.is_completed ? 'opacity-60' : ''}
              onclick={() => {
                if (list.is_completed) {
                  return;
                }

                goToSetupItem(list.id);
              }}
            >
              <Item.Media variant="icon">
                {#if list.is_completed}
                  <div class="flex size-5 items-center justify-center rounded">
                    <BadgeCheckIcon class="size-5 text-white" />
                  </div>
                {:else if list.id === SETUP_STEPS.CREATE_COURSE}
                  <BookOpenIcon class="size-5 text-gray-600" />
                {:else if list.id === SETUP_STEPS.CREATE_LESSON || list.id === SETUP_STEPS.CREATE_EXERCISE}
                  <FileTextIcon class="size-5 text-gray-600" />
                {:else if list.id === SETUP_STEPS.PUBLISH_COURSE}
                  <GlobeIcon class="size-5 text-gray-600" />
                {:else if list.id === SETUP_STEPS.UPDATE_PROFILE}
                  <UserPlusIcon class="size-5 text-gray-600" />
                {:else if list.id === SETUP_STEPS.UPDATE_ORG_PROFILE}
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
                  <Button variant="outline" size="sm" type="button" class="w-full sm:w-auto">
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
