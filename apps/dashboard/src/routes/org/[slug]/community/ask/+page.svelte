<script lang="ts">
  import { goto } from '$app/navigation';
  import * as Select from '@cio/ui/base/select';

  import type { Course } from '$lib/utils/types';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { courses } from '$lib/features/course/utils/store';
  import { supabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { fetchCourses } from '$lib/utils/services/courses';
  import generateSlug from '$lib/utils/functions/generateSlug';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { askCommunityValidation } from '$lib/utils/functions/validator';
  import { Button } from '@cio/ui/base/button';

  import { InputField } from '@cio/ui/custom/input-field';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import * as Page from '@cio/ui/base/page';

  let errors: {
    title?: string;
    courseId?: string;
    body?: string;
  } = $state({});
  let fields = $state({
    title: '',
    body: '',
    courseId: ''
  });

  let hasFetched = $state(false);
  let fetchedCourses: Course[] = $state([]);

  async function getCourses(userId: string | null, orgId: string) {
    if (hasFetched) return;

    if ($courses.length) {
      fetchedCourses = [...$courses];
      hasFetched = true;
      return;
    }

    const coursesResults = await fetchCourses(userId, orgId);
    if (!coursesResults) return;

    fetchedCourses = coursesResults.allCourses;
    hasFetched = true;
  }

  async function handleSave() {
    errors = askCommunityValidation(fields);
    console.log('handleSave errors', errors);

    if (Object.keys(errors).length) {
      return;
    }

    const { data: question, error } = await supabase
      .from('community_question')
      .insert({
        title: fields.title,
        body: fields.body,
        organization_id: $currentOrg.id,
        author_profile_id: $profile.id,
        votes: 0,
        slug: generateSlug(fields.title),
        course_id: fields.courseId
      })
      .select();

    if (error) {
      console.error('Error: asking question', error);
      snackbar.error('snackbar.community.error.try_again');
    } else {
      const slug = question[0]?.slug;

      console.log('Success: asking question', question, slug);
      snackbar.success('snackbar.community.success.question_submitted');
      goto(`${$currentOrgPath}/community/${slug}`);
    }
  }

  $effect(() => {
    if ($profile.id && $currentOrg.id) {
      getCourses($profile.id, $currentOrg.id);
    }
  });
</script>

<svelte:head>
  <title>Ask the Community - ClassroomIO</title>
</svelte:head>

<Page.Root>
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('community.ask.ask_the')}</Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <Button variant="default" onclick={handleSave}>
        {$t('community.ask.publish')}
      </Button>
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <div class="mb-3 flex justify-between gap-x-5">
        <InputField
          bind:value={fields.title}
          placeholder={$t('community.ask.title')}
          errorMessage={errors.title}
          className="w-[75%]"
        />
        <div class="w-[25%]">
          <Select.Root type="single" bind:value={fields.courseId}>
            <Select.Trigger class="h-full w-full">
              <p>
                {fields.courseId
                  ? fetchedCourses.find((course) => course.id === fields.courseId)?.title
                  : $t('community.ask.select_course')}
              </p>
            </Select.Trigger>
            <Select.Content>
              {#each fetchedCourses as course}
                {#if course.id}
                  <Select.Item value={course.id}>{course.title}</Select.Item>
                {/if}
              {/each}
            </Select.Content>
          </Select.Root>
          {#if errors.courseId}
            <p class="mt-1 text-sm text-red-500">
              {errors.courseId}
            </p>
          {/if}
        </div>
      </div>
      <div class="px-2">
        <TextEditor
          placeholder="Give an answer"
          content={fields.body}
          onChange={(content) => (fields.body = content)}
        />

        {#if errors.body}
          <p class="mt-2 text-sm text-red-500">{errors.body}</p>
        {/if}
      </div>
    {/snippet}
  </Page.Body>
</Page.Root>
