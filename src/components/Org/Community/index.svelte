<script>
  import { goto } from '@sapper/app';
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime';
  import AddComment20 from 'carbon-icons-svelte/lib/AddComment20';
  import Vote from '../../Vote/index.svelte';
  import Box from '../../Box/index.svelte';
  import CoursesEmptyIcon from '../../Icons/CoursesEmptyIcon.svelte';
  import Space from '../../Space/index.svelte';
  import { currentOrgPath, currentOrg } from '../../../utils/store/org';
  import { supabase } from '../../../utils/functions/supabase';

  let discussions = [];

  dayjs.extend(relativeTime);

  async function fetchCommunityQuestions(orgId) {
    if (!orgId) return;

    const { data, error } = await supabase
      .from('community_question')
      .select(
        `
        organization_id,
        title,
        votes,
        created_at,
        slug,
        comments:community_answer(count),
        author:organizationmember!community_question_author_id_fkey!inner(
          profile!inner(fullname)
        )
      `
      )
      .eq('organization_id', orgId);
    console.log('data', data);
    console.log('error', error);

    if (error) {
      console.error('Error loading community', error);
      return goto(`${currentOrgPath}`);
    }

    discussions =
      data?.map((discussion) => ({
        title: discussion.title,
        slug: discussion.slug,
        author: discussion?.author?.profile?.fullname,
        comments: discussion.comments?.[0]?.count || 0,
        votes: discussion.votes,
        createdAt: dayjs(discussion.created_at).fromNow(true),
      })) || [];
  }

  $: fetchCommunityQuestions($currentOrg.id);
</script>

<div
  class="flex items-center justify-center lg:justify-start flex-wrap my-4 m-auto border-c rounded bg-gray-100 dark:bg-gray-700"
>
  {#each discussions as discussion}
    <div class="w-full flex border-bottom-c p-5">
      <Vote value={discussion.votes} />
      <div class="discussion-topic-author">
        <h4>
          <a
            class="text-black dark:text-white"
            rel="prefetch"
            href="{$currentOrgPath}/community/{discussion.slug}"
          >
            {discussion.title}
          </a>
        </h4>
        <span class="text-gray-600 dark:text-gray-100">
          {discussion.author} asked {discussion.createdAt}
        </span>
      </div>
      <Space />
      <div class="flex items-center">
        <AddComment20 />
        <span class="ml-1">{discussion.comments}</span>
      </div>
    </div>
  {:else}
    <Box>
      <CoursesEmptyIcon />
      <h3 class="dark:text-white text-2xl my-5">No Questions asked</h3>
      <p class="dark:text-white w-1/3 text-center">
        Ask a question to the community
      </p>
    </Box>
  {/each}
</div>

<style>
  h4 {
    font-size: 16px;
    font-weight: 900;
    word-break: break-word;
    overflow-wrap: break-word;
    margin: 0;
  }

  .discussion-topic-author {
    margin-right: 20px;
  }
  .discussion-topic-author span {
    font-size: 12px;
  }
</style>
