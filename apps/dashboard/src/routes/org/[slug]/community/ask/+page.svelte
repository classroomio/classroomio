<script lang="ts">
  import { goto } from '$app/navigation';
  import { courses } from '$lib/components/Courses/store';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import EdraEditor from '$lib/components/Edra/EdraRoot.svelte';
  import generateSlug from '$lib/utils/functions/generateSlug';
  import { supabase } from '$lib/utils/functions/supabase';
  import { t } from '$lib/utils/functions/translations';
  import { askCommunityValidation } from '$lib/utils/functions/validator';
  import { fetchCourses } from '$lib/utils/services/courses';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import type { Course } from '$lib/utils/types';
  import { Dropdown } from 'carbon-components-svelte';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

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

<section class="w-full md:mx-auto md:max-w-3xl">
  <div class="p-5">
    <a class="text-md flex items-center text-gray-500 dark:text-white" href={`${$currentOrgPath}/community`}>
      <ArrowLeftIcon size={16} />
      {$t('community.ask.go_back')}
    </a>
    <div class="flex items-center justify-between gap-12">
      <h1 class="text-2xl font-bold md:text-3xl dark:text-white">{$t('community.ask.ask_the')}</h1>
      <PrimaryButton label={$t('community.ask.publish')} variant={VARIANTS.CONTAINED_DARK} onClick={handleSave} />
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
  <div class="px-2">
    <EdraEditor content={fields.body} onContentChange={(content) => (fields.body = content)} />

    {#if errors.body}
      <p class="mt-2 text-sm text-red-500">{errors.body}</p>
    {/if}
  </div>
</section>
