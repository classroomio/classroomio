<script lang="ts">
  import { goto } from '$app/navigation';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import { Dropdown } from 'carbon-components-svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { askCommunityValidation } from '$lib/utils/functions/validator';
  import { supabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import generateSlug from '$lib/utils/functions/generateSlug';
  import EdraEditor from '$lib/components/Edra/EdraRoot.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { courses } from '$lib/components/Courses/store';
  import type { Course } from '$lib/utils/types';
  import { fetchCourses } from '$lib/utils/services/courses';

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
      <h1 class="text-3xl font-bold dark:text-white">{$t('community.ask.ask_the')}</h1>
      <PrimaryButton label={$t('community.ask.publish')} onClick={handleSave} />
    </div>
  </div>

  <div class="mb-3 flex justify-between gap-x-5 p-2">
    <TextField
      bind:value={fields.title}
      placeholder={$t('community.ask.title')}
      errorMessage={errors.title}
      className="w-[75%]"
    />
    <Dropdown
      class="h-full w-[25%]"
      size="xl"
      label={$t('community.ask.select_course')}
      invalid={!!errors.courseId}
      invalidText={errors.courseId}
      items={fetchedCourses.map((course) => ({ id: course.id, text: course.title }))}
      bind:selectedId={fields.courseId}
    />
  </div>

  <EdraEditor content={fields.body} onContentChange={(content) => (fields.body = content)} />
</section>
