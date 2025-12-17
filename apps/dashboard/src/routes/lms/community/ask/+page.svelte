<script lang="ts">
  import { goto } from '$app/navigation';
  import * as Select from '@cio/ui/base/select';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

  import type { Course } from '$lib/utils/types';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { courses } from '$features/course/utils/store';
  import { supabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$features/ui/snackbar/store';
  import { fetchCourses } from '$lib/utils/services/courses';
  import generateSlug from '$lib/utils/functions/generateSlug';
  import { askCommunityValidation } from '$lib/utils/functions/validator';
  import { TextEditor } from '$features/ui';

  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';

  let errors: {
    title?: string;
    courseId?: string;
  } = $state({});
  let fields = $state({
    title: '',
    body: '',
    courseId: ''
  });

  let fetchedCourses: Course[] = $state([]);
  let hasFetched = $state(false);

  async function getCourses(userId?: string, orgId?: string) {
    if (!userId || !orgId || hasFetched) {
      return;
    }

    hasFetched = true;
    if ($courses.length) {
      fetchedCourses = [...$courses];
      return;
    }

    const coursesResults = await fetchCourses(userId, orgId);
    fetchedCourses = coursesResults?.allCourses || [];
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
        course_id: fields.courseId,
        organization_id: $currentOrg.id,
        author_profile_id: $profile.id,
        votes: 0,
        slug: generateSlug(fields.title)
      })
      .select();

    if (error) {
      console.error('Error: asking question', error);
      snackbar.error();
    } else {
      const slug = question[0]?.slug;
      console.log('Success: asking question in lms', question, slug);
      snackbar.success('snackbar.community.success.question_submitted');

      goto(`/lms/community/${slug}`);
    }
  }

  $effect(() => {
    getCourses($profile.id, $currentOrg.id);
  });
</script>

<svelte:head>
  <title>Ask the Community - ClassroomIO</title>
</svelte:head>

<section class="mx-auto w-full max-w-3xl">
  <div class="p-5">
    <a class="text-md flex items-center text-gray-500 dark:text-white" href="/lms/community">
      <ArrowLeftIcon size={16} />
      {$t('community.ask.go_back')}
    </a>
    <div class="flex items-center justify-between">
      <h1 class="text-3xl dark:text-white">{$t('community.ask.ask_the')}</h1>
      <Button onclick={handleSave}>
        {$t('community.ask.publish')}
      </Button>
    </div>
  </div>

  <div class="mb-3 flex justify-between gap-x-5 p-2">
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

  <TextEditor
    placeholder={$t('community.ask.ask_community')}
    content={fields.body}
    onChange={(content) => (fields.body = content)}
  />
</section>
