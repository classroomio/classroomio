<script lang="ts">
  import { goto } from '$app/navigation';
  import { env } from '$env/dynamic/public';
  import {
    CodeSnippet,
    Column,
    Grid,
    RadioButton,
    RadioButtonGroup,
    Row,
    Toggle
  } from 'carbon-components-svelte';
  import { ArrowUpRight, Restart } from 'carbon-icons-svelte';

  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import SectionTitle from '$lib/components/Org/SectionTitle.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import UnsavedChanges from '$lib/components/UnsavedChanges/index.svelte';
  import DragAndDrop from './DragAndDrop.svelte';

  import { course } from '$lib/components/Course/store';
  import { handleOpenWidget } from '$lib/components/CourseLandingPage/store';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import DeleteModal from '$lib/components/Modal/DeleteModal.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { snackbar } from '$lib/components/Snackbar/store';
  import UpgradeBanner from '$lib/components/Upgrade/Banner.svelte';
  import UploadWidget from '$lib/components/UploadWidget/index.svelte';
  import generateSlug from '$lib/utils/functions/generateSlug';
  import { isObject } from '$lib/utils/functions/isObject';
  import { t } from '$lib/utils/functions/translations';
  import { deleteCourse, updateCourse } from '$lib/utils/services/courses';
  import { currentOrg, currentOrgDomain, currentOrgPath, isFreePlan } from '$lib/utils/store/org';
  import type { Course } from '$lib/utils/types';
  import { COURSE_TYPE } from '$lib/utils/types';
  import { lessons, lessonSections } from '../Lesson/store/lessons';
  import { settings } from './store';
  import { getAccessToken } from '$lib/utils/functions/supabase';

  let isSaving = false;
  let isLoading = false;
  let isDeleting = false;
  let errors: {
    title: string | undefined;
    description: string | undefined;
  };
  let avatar: string | undefined;
  let hasUnsavedChanges = false;
  let openDeleteModal = false;

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
    $settings.logo = '';
    hasUnsavedChanges = true;
  };

  async function handleDeleteCourse() {
    isDeleting = true;

    try {
      await deleteCourse($course.id);
      goto($currentOrgPath + '/courses');
    } catch (error) {
      snackbar.error('snackbar.course_settings.error.went_wrong');
    }

    isDeleting = false;
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

      hasUnsavedChanges = false;
    } catch (error) {
      snackbar.error();
    }

    isSaving = false;
  };

  const generateNewCourseLink = () => {
    $course.slug = generateSlug($course.title);
    hasUnsavedChanges = true;
  };

  async function setDefault(course: Course) {
    if (!course || !Object.keys(course).length) return;

    settings.set({
      course_title: course.title,
      type: course.type,
      course_description: course.description,
      logo: course.logo || '',
      tabs: course.metadata.lessonTabsOrder || $settings.tabs,
      grading: !!course.metadata.grading,
      lesson_download: !!course.metadata.lessonDownload,
      is_published: !!course.is_published,
      allow_new_students: course.metadata.allowNewStudent
    });
  }

  const handleScormExport = async () => {
    try {
      console.log('🚀 Starting SCORM export for course:', $course.id);

      const accessToken = await getAccessToken();

      const response = await fetch(`/api/scorm?courseId=${$course.id}`, {
        method: 'POST',
        headers: {
          Authorization: accessToken,
          Accept: 'application/zip'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Export failed');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `scorm-course-${Date.now()}.zip`;

      console.log('✅ Download response received, filename:', filename);

      // Convert response to blob
      const blob = await response.blob();

      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up the URL object
      URL.revokeObjectURL(url);

      console.log('✅ SCORM package downloaded successfully!');
      snackbar.success('SCORM package downloaded successfully!');
    } catch (error) {
      console.error('❌ SCORM export failed:', error);
      snackbar.error('snackbar.course_settings.error.not_right');
    }
  };

  $: setDefault($course);
  $: courseLink = `${$currentOrgDomain}/course/${$course.slug}`;
</script>

<UnsavedChanges bind:hasUnsavedChanges />

<DeleteModal onDelete={handleDeleteCourse} bind:open={openDeleteModal} />

<Grid class="border-c rounded border-gray-200 dark:border-neutral-600">
  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.cover_image')}</SectionTitle>
      <p>
        {$t('course.navItem.settings.optional_image')}
      </p>
      <span class="flex items-center justify-start">
        <PrimaryButton
          variant={VARIANTS.CONTAINED_DARK}
          label={$t('course.navItem.settings.replace')}
          className="mr-2"
          onClick={widgetControl}
        />
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          label={$t('ai.reset')}
          onClick={deleteBannerImage}
        />
      </span>
      {#if $handleOpenWidget.open}
        <UploadWidget
          bind:imageURL={$settings.logo}
          on:change={() => {
            hasUnsavedChanges = true;
          }}
        />
      {/if}
    </Column>

    <Column sm={8} md={8} lg={6}>
      <div class="relative z-[20] w-fit">
        <img
          style="min-width:280px; min-height:200px"
          alt="About us"
          src={$settings.logo ? $settings.logo : '/images/classroomio-course-img-template.jpg'}
          class="relative mt-2 h-[200px] w-[280px] rounded-md md:mt-0"
        />
      </div>
    </Column>
  </Row>

  <Row id="share" class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.course_details')}</SectionTitle>
    </Column>

    <Column sm={8} md={8} lg={8}>
      <TextField
        label={$t('course.navItem.settings.course_title')}
        placeholder="Write the course title here"
        className="w-full mb-5"
        isRequired
        bind:value={$settings.course_title}
        errorMessage={errors?.title}
        onInputChange={() => {
          hasUnsavedChanges = true;
        }}
      />
      <TextArea
        label={$t('course.navItem.settings.course_description')}
        placeholder={$t('course.navItem.settings.placeholder')}
        className="w-full mb-5"
        isRequired
        bind:value={$settings.course_description}
        errorMessage={errors?.description}
        onChange={() => {
          hasUnsavedChanges = true;
        }}
      />
      <div id="share">
        <p class="text-md mb-2 flex items-center gap-2">
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

  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.order')}</SectionTitle>
      <p>{$t('course.navItem.settings.drag')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <DragAndDrop
        on:change={() => {
          hasUnsavedChanges = true;
        }}
      />
    </Column>
  </Row>
  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.lesson_download')}</SectionTitle>
      <p>{$t('course.navItem.settings.available')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      {#if $isFreePlan}
        <UpgradeBanner>{$t('upgrade.download_lessons')}</UpgradeBanner>
      {:else}
        <Toggle
          size="sm"
          bind:toggled={$settings.lesson_download}
          on:toggle={() => {
            hasUnsavedChanges = true;
          }}
        >
          <span slot="labelA" style="color: gray">{$t('course.navItem.settings.disabled')}</span>
          <span slot="labelB" style="color: gray">{$t('course.navItem.settings.enabled')}</span>
        </Toggle>
      {/if}
    </Column>
  </Row>
  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
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

  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.type')}</SectionTitle>
      <p>{$t('course.navItem.settings.course_type_desc')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <RadioButtonGroup
        hideLegend
        bind:selected={$settings.type}
        on:change={() => {
          hasUnsavedChanges = true;
        }}
      >
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

  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.allow')}</SectionTitle>
      <p>{$t('course.navItem.settings.access')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <Toggle
        size="sm"
        bind:toggled={$settings.allow_new_students}
        on:click={() => {
          hasUnsavedChanges = true;
        }}
      >
        <span slot="labelA" style="color: gray">{$t('course.navItem.settings.disabled')}</span>
        <span slot="labelB" style="color: gray">{$t('course.navItem.settings.enabled')}</span>
      </Toggle>
    </Column>
  </Row>

  <!-- Publish Course -->
  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.publish')}</SectionTitle>
      <p>{$t('course.navItem.settings.determines')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <Toggle
        size="sm"
        bind:toggled={$settings.is_published}
        on:click={() => {
          hasUnsavedChanges = true;
        }}
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

  <!-- delete -->
  <Row id="delete" class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.delete')}</SectionTitle>
      <p>{$t('course.navItem.settings.delete_text')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <PrimaryButton
        variant={VARIANTS.CONTAINED_DANGER}
        label={$t('course.navItem.settings.delete')}
        onClick={() => (openDeleteModal = true)}
        isLoading={isDeleting}
        isDisabled={isDeleting}
      />
    </Column>
  </Row>

  <!-- export as scorm -->
  <Row id="export" class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.export')}</SectionTitle>
      <p>{$t('course.navItem.settings.export_text')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <PrimaryButton
        variant={VARIANTS.CONTAINED}
        label={$t('course.navItem.settings.export')}
        onClick={() => handleScormExport()}
        isLoading={isDeleting}
        isDisabled={isDeleting}
      />
    </Column>
  </Row>

  <Row class="flex w-full items-center justify-end p-5">
    <PrimaryButton
      label={$t('course.navItem.settings.save')}
      isLoading={isSaving}
      isDisabled={isSaving}
      onClick={handleSave}
    />
  </Row>
</Grid>
