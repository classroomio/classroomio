<script lang="ts">
  import { goto } from '$app/navigation';
  import { Dropdown } from 'carbon-components-svelte';
  import ArrowLeftIcon from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import { currentOrgPath, currentOrg } from '$lib/utils/store/org';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { askCommunityValidation } from '$lib/utils/functions/validator';
  import { supabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import generateSlug from '$lib/utils/functions/generateSlug';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { profile } from '$lib/utils/store/user';
  import { fetchCourses } from '$lib/utils/services/courses';
  import { t } from '$lib/utils/functions/translations';
  import { courses } from '$lib/components/Courses/store';
  import type { Course } from '$lib/utils/types';

  let errors: {
    title?: string;
    courseId?: string;
  } = {};
  let fields = {
    title: '',
    body: '',
    courseId: ''
  };

  let fetchedCourses: Course[] = [];

  async function getCourses(userId: string | null, orgId: string) {
    if ($courses.length) {
      fetchedCourses = [...$courses];
      return;
    }

    const coursesResults = await fetchCourses(userId, orgId);
    if (!coursesResults) return;

    fetchedCourses = coursesResults.allCourses;
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

  $: {
    if ($profile.id && $currentOrg.id) {
      getCourses($profile.id, $currentOrg.id);
    }
  }
</script>

<svelte:head>
  <title>Ask the Community - ClassroomIO</title>
</svelte:head>

<section class="w-full md:max-w-3xl md:mx-auto">
  <div class="p-5">
    <a
      class="text-gray-500 dark:text-white text-md flex items-center"
      href={`${$currentOrgPath}/community`}
    >
      <ArrowLeftIcon size={24} class="carbon-icon dark:text-white" />
      {$t('community.ask.go_back')}
    </a>
    <div class="flex items-center gap-12 justify-between">
      <h1 class="dark:text-white text-2xl md:text-3xl font-bold">{$t('community.ask.ask_the')}</h1>
      <PrimaryButton
        label={$t('community.ask.publish')}
        variant={VARIANTS.CONTAINED_DARK}
        onClick={handleSave}
      />
    </div>
  </div>

  <div class="mb-3 p-2 flex gap-x-5 justify-between">
    <TextField
      bind:value={fields.title}
      placeholder={$t('community.ask.title')}
      errorMessage={errors.title}
      className="w-[75%]"
    />
    <Dropdown
      class="w-[25%] h-full"
      size="xl"
      label={$t('community.ask.select_course')}
      invalid={!!errors.courseId}
      invalidText={errors.courseId}
      items={fetchedCourses.map((course) => ({ id: course.id, text: course.title }))}
      bind:selectedId={fields.courseId}
    />
  </div>
  <div class="px-2">
    <TextEditor
      bind:value={fields.body}
      placeholder={$t('community.ask.ask_community')}
      onChange={(html) => (fields.body = html)}
    />
  </div>
</section>
