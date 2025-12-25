<script lang="ts">
  import { untrack } from 'svelte';
  import * as Page from '@cio/ui/base/page';
  import * as Select from '@cio/ui/base/select';
  import { Empty } from '@cio/ui/custom/empty';
  import * as Item from '@cio/ui/base/item';
  import { Search } from '@cio/ui/custom/search';
  import MessageSquareMoreIcon from '@lucide/svelte/icons/message-square-more';
  import MessageCirclePlusIcon from '@lucide/svelte/icons/message-circle-plus';

  import { Vote } from '$features/ui';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';

  import { CommunityListLoader, AskCommunityButton } from '../components';
  import { communityApi } from '../api/community.svelte';
  import type { CommunityQuestionData } from '../utils/types';

  interface Props {
    isLMS?: boolean;
  }

  let { isLMS = false }: Props = $props();

  let searchValue = $state('');
  let selectedId = $state('');

  function fetchCommunityQuestions(orgId?: string, profileId?: string) {
    if (!orgId || !profileId) return;

    untrack(async () => {
      await communityApi.fetchCoursesForOrg(profileId, orgId);
      await communityApi.fetchCommunityQuestions({ orgId, isLMS });
    });
  }

  $effect(() => {
    fetchCommunityQuestions($currentOrg.id, $profile.id);
  });

  let filteredQuestions = $derived(
    communityApi.questions.filter(
      (question: CommunityQuestionData[number]) =>
        question?.title?.toLowerCase?.()?.includes(searchValue.toLowerCase()) &&
        (!selectedId || question?.courseId === selectedId)
    )
  );
</script>

<Page.BodyHeader>
  <Search placeholder={$t('community.find_question')} bind:value={searchValue} />

  <Select.Root type="single" bind:value={selectedId}>
    <Select.Trigger class="w-full bg-gray-100 dark:bg-neutral-800">
      <p class="truncate">
        {selectedId
          ? communityApi.courses.find((course) => course.id === selectedId)?.title || $t('community.all')
          : $t('community.all')}
      </p>
    </Select.Trigger>
    <Select.Content>
      <Select.Item value="">{$t('community.all')}</Select.Item>
      {#each communityApi.courses as course}
        {#if course.id}
          <Select.Item value={course.id}>{course.title}</Select.Item>
        {/if}
      {/each}
    </Select.Content>
  </Select.Root>
</Page.BodyHeader>

{#if communityApi.isLoading}
  <CommunityListLoader />
  <CommunityListLoader />
  <CommunityListLoader />
  <CommunityListLoader />
{:else}
  {#each filteredQuestions as question}
    <Item.Root variant="outline">
      {#snippet child({ props })}
        <a href="{isLMS ? '/lms' : $currentOrgPath}/community/{question.slug}" {...props}>
          <Vote value={question.votes} />
          <Item.Content class="gap-y-0.5">
            <Item.Title class="mt-0">
              {question.title}
            </Item.Title>
            <Item.Description>
              {question?.authorFullname} asked {calDateDiff(question?.createdAt)}
            </Item.Description>
            <a class="m-0" href="/courses/{question.courseId}" onclick={(e) => e.stopPropagation()}>
              <span class="text-muted-foreground p-0 text-xs">
                #{question?.courseTitle}
              </span>
            </a>
          </Item.Content>
          <Item.Actions>
            <div class="flex items-center">
              <MessageCirclePlusIcon size={16} />
              <span class="ml-1">{question.comments}</span>
            </div>
          </Item.Actions>
        </a>
      {/snippet}
    </Item.Root>
  {:else}
    <Empty
      title={$t('community.no_question')}
      description={$t('community.ask_a_question')}
      icon={MessageSquareMoreIcon}
      variant="page"
    >
      <AskCommunityButton />
    </Empty>
  {/each}
{/if}
