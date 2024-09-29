<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    CodeSnippet,
    Grid,
    Row,
    Column,
    Toggle,
    RadioButtonGroup,
    RadioButton
  } from 'carbon-components-svelte';
  import { Restart, ArrowUpRight } from 'carbon-icons-svelte';
  import { env } from '$env/dynamic/public';

  import SectionTitle from '$lib/components/Org/SectionTitle.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import DragAndDrop from './DragAndDrop.svelte';

  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { settings } from './store';
  import { course } from '$lib/components/Course/store';
  import type { Course } from '$lib/utils/types';
  import { updateCourse, deleteCourse } from '$lib/utils/services/courses';
  import { currentOrgPath, isFreePlan } from '$lib/utils/store/org';
  import { isObject } from '$lib/utils/functions/isObject';
  import { lessons } from '../Lesson/store/lessons';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { snackbar } from '$lib/components/Snackbar/store';
  import UploadWidget from '$lib/components/UploadWidget/index.svelte';
  import { handleOpenWidget } from '$lib/components/CourseLandingPage/store';
  import UpgradeBanner from '$lib/components/Upgrade/Banner.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import generateSlug from '$lib/utils/functions/generateSlug';
  import { t } from '$lib/utils/functions/translations';
  import { COURSE_TYPE } from '$lib/utils/types';

  let isSaving = false;
  let isLoading = false;
  let isDeleting = false;
  let errors: {
    title: string | undefined;
    description: string | undefined;
  } = { title: undefined, description: undefined };
  let avatar: string | undefined;

  function widgetControl() {
    $handleOpenWidget.open = !$handleOpenWidget.open;
  }

  function getLessonOrder(id: string) {
    const index = $lessons.findIndex((lesson) => lesson.id === id);
    if (index < 9) {
      return '0' + (index + 1);
    } else {
      return index + 1;
    }
  }

  const downloadCourse = async () => {
    isLoading = true;
    try {
      const lessonsList = $lessons.map((lesson) => ({
        lessonTitle: lesson.title,
        lessonNumber: getLessonOrder(lesson.id),
        lessonNote: lesson.note,
        slideUrl: lesson.slide_url || '',
        video: lesson.videos || ''
      }));
      const response = await fetch(env.PUBLIC_SERVER_URL + '/downloadCourse', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseTitle: $course.title,
          orgName: $currentOrg.name,
          orgTheme: $currentOrg.theme || '',
          lessons: lessonsList
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.blob();
      const file = new Blob([data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);

      let a = document.createElement('a');
      document.body.append(a);
      a.download = $course.title + ' - ' + 'Course ';
      a.href = fileURL;
      a.click();
      a.remove();

      snackbar.success('snackbar.course_settings.success.download');
    } catch (error) {
      snackbar.error('snackbar.course_settings.error.not_right');
    }
    isLoading = false;
  };

  const deleteBannerImage = () => {
    $course.logo = '';
  };

  async function handleDeleteCourse() {
    isDeleting = true;
    try {
      await deleteCourse($course.id);
      isDeleting = false;
      goto($currentOrgPath + '/courses');
    } catch (error) {
      snackbar.error('snackbar.course_settings.error.went_wrong');
      isDeleting = false;
    }
  }

  const handleSave = async () => {
    if (!$settings.course_title) {
      errors.title = $t('snackbar.course_settings.error.title');
      return;
    }
    if (!$settings.course_description) {
      errors.description = $t('snackbar.course_settings.error.description');
      return;
    }
    isSaving = true;
    try {
      const updatedCourse = {
        title: $settings.course_title,
        description: $settings.course_description,
        type: $settings.type,
        logo: $settings.logo,
        is_published: $settings.is_published,
        metadata: {
          ...(isObject($course.metadata) ? $course.metadata : {}),
          lessonTabsOrder: $settings.tabs,
          grading: $settings.grading,
          lessonDownload: $settings.lesson_download,
          allowNewStudent: $settings.allow_new_students
        },
        slug: $course.slug
      };
      await updateCourse($course.id, avatar, updatedCourse);

      $course = {
        ...$course,
        ...updatedCourse
      };

      snackbar.success('snackbar.course_settings.success.saved');
    } catch (error) {
      snackbar.error();
    }

    isSaving = false;
  };

  function setDefault(course: Course) {
    if (course && Object.keys(course).length && $settings.course_title !== course.title) {
      $settings = {
        course_title: course.title,
        type: course.type,
        course_description: course.description,
        logo: course.logo || '',
        tabs: course.metadata.lessonTabsOrder || $settings.tabs,
        grading: !!course.metadata.grading,
        lesson_download: !!course.metadata.lessonDownload,
        is_published: !!course.is_published,
        allow_new_students: course.metadata.allowNewStudent
      };
    }
  }

  const generateNewCourseLink = () => {
    $course.slug = generateSlug($course.title);
  };

  $: setDefault($course);
  $: courseLink = `${$currentOrgDomain}/course/${$course.slug}`;
</script>

<Grid class="border-c rounded border-gray-200 dark:border-neutral-600">
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.cover_image')}</SectionTitle>
      <p>
        {$t('course.navItem.settings.optional_image')}
      </p>
      <span class="flex items-center justify-start">
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          label={$t('course.navItem.settings.replace')}
          className="mr-2"
          onClick={widgetControl}
        />
        <PrimaryButton
          variant={VARIANTS.CONTAINED_DANGER}
          label={$t('course.navItem.settings.del')}
          onClick={deleteBannerImage}
        />
      </span>
      {#if $handleOpenWidget.open}
        <UploadWidget bind:imageURL={$settings.logo} />
      {/if}
    </Column>

    <Column sm={8} md={8} lg={6}>
      <div class="w-fit relative z-[20]">
        <img
          style="min-width:280px; min-height:200px"
          alt="About us"
          src={$settings.logo ? $settings.logo : '/images/classroomio-course-img-template.jpg'}
          class="mt-2 md:mt-0 w-[280px] h-[200px] rounded-md relative"
        />
      </div>
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.course_details')}</SectionTitle>
    </Column>

    <Column sm={8} md={8} lg={8}>
      <TextField
        label={$t('course.navItem.settings.course_title')}
        placeholder="Write the course title here"
        className="w-full mb-5"
        bind:value={$settings.course_title}
        errorMessage={errors.title}
      />
      <TextArea
        label={$t('course.navItem.settings.course_description')}
        placeholder={$t('course.navItem.settings.placeholder')}
        className="w-full mb-5"
        bind:value={$settings.course_description}
        errorMessage={errors.description}
      />
      <div class="">
        <p class="text-md flex items-center gap-2 mb-2">
          {$t('course.navItem.settings.link')}
          <IconButton contained={true} size="small" onClick={generateNewCourseLink}>
            <Restart size={16} />
          </IconButton>
          <span class="grow" />
          <IconButton contained={true} size="small" onClick={() => goto(courseLink)}>
            <ArrowUpRight size={16} />
          </IconButton>
        </p>
        {#if $course.slug}
          <CodeSnippet wrapText type="multi" code={courseLink} />
        {:else}
          <CodeSnippet code="Setup landing page to get course link" />
        {/if}
      </div>
    </Column>
  </Row>
  <!-- <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.grading')}</SectionTitle>
      <p>{$t('course.navItem.settings.reports')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <Toggle size="sm" bind:toggled={$settings.grading}>
        <span slot="labelA" style="color: gray">{$t('course.navItem.settings.disabled')}</span>
        <span slot="labelB" style="color: gray">{$t('course.navItem.settings.enabled')}</span>
      </Toggle>
    </Column>
  </Row> -->

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.order')}</SectionTitle>
      <p>{$t('course.navItem.settings.drag')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <DragAndDrop />
    </Column>
  </Row>
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.lesson_download')}</SectionTitle>
      <p>{$t('course.navItem.settings.available')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      {#if $isFreePlan}
        <UpgradeBanner>{$t('upgrade.download_lessons')}</UpgradeBanner>
      {:else}
        <Toggle size="sm" bind:toggled={$settings.lesson_download}>
          <span slot="labelA" style="color: gray">{$t('course.navItem.settings.disabled')}</span>
          <span slot="labelB" style="color: gray">{$t('course.navItem.settings.enabled')}</span>
        </Toggle>
      {/if}
    </Column>
  </Row>
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.course_download')}</SectionTitle>
      <p>{$t('course.navItem.settings.course_avail')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      {#if $isFreePlan}
        <UpgradeBanner>{$t('upgrade.download_course')}</UpgradeBanner>
      {:else}
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          label={$t('course.navItem.settings.download')}
          onClick={downloadCourse}
          isDisabled={isLoading || !env.PUBLIC_SERVER_URL}
          {isLoading}
        />
      {/if}
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.type')}</SectionTitle>
      <p>{$t('course.navItem.settings.course_type_desc')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <RadioButtonGroup hideLegend bind:selected={$settings.type}>
        <RadioButton
          labelText={$t('course.navItem.settings.live_class')}
          value={COURSE_TYPE.LIVE_CLASS}
        />
        <RadioButton
          labelText={$t('course.navItem.settings.self_paced')}
          value={COURSE_TYPE.SELF_PACED}
        />
      </RadioButtonGroup>
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.allow')}</SectionTitle>
      <p>{$t('course.navItem.settings.access')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <Toggle size="sm" bind:toggled={$settings.allow_new_students}>
        <span slot="labelA" style="color: gray">{$t('course.navItem.settings.disabled')}</span>
        <span slot="labelB" style="color: gray">{$t('course.navItem.settings.enabled')}</span>
      </Toggle>
    </Column>
  </Row>

  <!-- Publish Course -->
  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.publish')}</SectionTitle>
      <p>{$t('course.navItem.settings.determines')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <Toggle
        size="sm"
        bind:toggled={$settings.is_published}
        on:toggle={(e) => {
          $settings.allow_new_students = e.detail.toggled;

          if (!$course.slug) {
            generateNewCourseLink();
          }
        }}
      >
        <span slot="labelA" style="color: gray">{$t('course.navItem.settings.unpublished')}</span>
        <span slot="labelB" style="color: gray">{$t('course.navItem.settings.published')}</span>
      </Toggle>
    </Column>
  </Row>

  <Row class="flex lg:flex-row flex-col py-7 border-bottom-c">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.delete')}</SectionTitle>
      <p>{$t('course.navItem.settings.delete_text')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <PrimaryButton
        variant={VARIANTS.CONTAINED_DANGER}
        label={$t('course.navItem.settings.delete')}
        onClick={handleDeleteCourse}
        isLoading={isDeleting}
        isDisabled={isDeleting}
      />
    </Column>
  </Row>
  <Row class="p-5 w-full flex items-center justify-end">
    <PrimaryButton
      label={$t('course.navItem.settings.save')}
      isLoading={isSaving}
      isDisabled={isSaving}
      onClick={handleSave}
    />
  </Row>
</Grid>
