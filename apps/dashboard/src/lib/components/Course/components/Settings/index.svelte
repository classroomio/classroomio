<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { Label } from '@cio/ui/base/label';
  import { Switch } from '@cio/ui/base/switch';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';

  import DragAndDrop from './DragAndDrop.svelte';
  import { IconButton } from '$lib/components/IconButton';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { Row, Grid, Column } from '$lib/components/Org/Settings/Layout';
  import SectionTitle from '$lib/components/Org/SectionTitle.svelte';
  import UpgradeBanner from '$lib/components/Upgrade/Banner.svelte';
  import UploadWidget from '$lib/components/UploadWidget/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import UnsavedChanges from '$lib/components/UnsavedChanges/index.svelte';

  import { settings } from './store';
  import Copy from '@lucide/svelte/icons/copy';
  import type { Course } from '$lib/utils/types';
  import { COURSE_TYPE } from '$lib/utils/types';
  import { lessons } from '../Lesson/store/lessons';
  import { course } from '$lib/components/Course/store';
  import { t } from '$lib/utils/functions/translations';
  import { isObject } from '$lib/utils/functions/isObject';
  import { snackbar } from '$lib/components/Snackbar/store';
  import generateSlug from '$lib/utils/functions/generateSlug';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import DeleteModal from '$lib/components/Modal/DeleteModal.svelte';
  import { deleteCourse, updateCourse } from '$lib/utils/services/courses';
  import { copyToClipboard } from '$lib/utils/functions/formatYoutubeVideo';
  import { handleOpenWidget } from '$lib/components/CourseLandingPage/store';
  import { currentOrg, currentOrgDomain, currentOrgPath, isFreePlan } from '$lib/utils/store/org';

  let isSaving = $state(false);
  let isLoading = $state(false);
  let isDeleting = $state(false);
  let errors: {
    title: string | undefined;
    description: string | undefined;
  } = $state({
    title: undefined,
    description: undefined
  });
  let avatar: string | undefined;
  let hasUnsavedChanges = $state(false);
  let openDeleteModal = $state(false);

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
    alert('Coming soon');
    return;

    isLoading = true;

    try {
      const lessonsList = $lessons.map((lesson) => ({
        lessonTitle: lesson.title,
        lessonNumber: getLessonOrder(lesson.id),
        lessonNote: lesson.note,
        slideUrl: lesson.slide_url || '',
        video: lesson.videos || ''
      }));

      const response = await fetch('/downloadCourse', {
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

    untrack(() => {
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
    });
  }

  $effect(() => {
    setDefault($course);
  });

  let courseLink = $derived(`${$currentOrgDomain}/course/${$course.slug}`);
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
        <PrimaryButton variant={VARIANTS.OUTLINED} label={$t('ai.reset')} onClick={deleteBannerImage} />
      </span>
      {#if $handleOpenWidget.open}
        <UploadWidget
          bind:imageURL={$settings.logo}
          onchange={() => {
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
            <RotateCcwIcon size={16} />
          </IconButton>
          <span class="grow"></span>
          <IconButton contained={true} size="small" onClick={() => goto(courseLink)}>
            <ArrowUpRightIcon size={16} />
          </IconButton>
        </p>
        <div class="flex items-center justify-between rounded-md border p-3">
          {#if $course.slug}
            <p class="text-sm">{courseLink}</p>

            <IconButton
              contained={true}
              size="small"
              onClick={() => {
                copyToClipboard(courseLink);
              }}
            >
              <Copy size={16} />
            </IconButton>
          {:else}
            <p class="text-sm">Setup landing page to get course link</p>
          {/if}
        </div>
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
        <div class="flex items-center space-x-2">
          <Switch
            id="lesson-download"
            bind:checked={$settings.lesson_download}
            onCheckedChange={() => {
              hasUnsavedChanges = true;
            }}
          />
          <Label for="lesson-download" class="text-sm text-gray-500">
            {$settings.lesson_download ? $t('course.navItem.settings.enabled') : $t('course.navItem.settings.disabled')}
          </Label>
        </div>
      {/if}
    </Column>
  </Row>
  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.course_download')}</SectionTitle>
      <p>{$t('course.navItem.settings.course_avail')}</p>
    </Column>
    <Column sm={4} md={4} lg={4}>
      {#if $isFreePlan}
        <UpgradeBanner>{$t('upgrade.download_course')}</UpgradeBanner>
      {:else}
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          label={$t('course.navItem.settings.download')}
          onClick={downloadCourse}
          isDisabled={isLoading}
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
      <RadioGroup.Root
        value={$settings.type}
        onValueChange={(value) => {
          $settings.type = value as COURSE_TYPE;
          if (hasUnsavedChanges) return;
          hasUnsavedChanges = true;
        }}
      >
        <div class="mb-3 flex items-center space-x-2">
          <RadioGroup.Item value={COURSE_TYPE.LIVE_CLASS} id="live-class" />
          <Label for="live-class">{$t('course.navItem.settings.live_class')}</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroup.Item value={COURSE_TYPE.SELF_PACED} id="self-paced" />
          <Label for="self-paced">{$t('course.navItem.settings.self_paced')}</Label>
        </div>
      </RadioGroup.Root>
    </Column>
  </Row>

  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.allow')}</SectionTitle>
      <p>{$t('course.navItem.settings.access')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <div class="flex items-center space-x-2">
        <Switch
          id="allow-new-students"
          bind:checked={$settings.allow_new_students}
          onCheckedChange={() => {
            hasUnsavedChanges = true;
          }}
        />
        <Label for="allow-new-students" class="text-sm text-gray-500">
          {$settings.allow_new_students
            ? $t('course.navItem.settings.enabled')
            : $t('course.navItem.settings.disabled')}
        </Label>
      </div>
    </Column>
  </Row>

  <!-- Publish Course -->
  <Row class="border-bottom-c flex flex-col py-7 lg:flex-row">
    <Column sm={8} md={8} lg={8}>
      <SectionTitle>{$t('course.navItem.settings.publish')}</SectionTitle>
      <p>{$t('course.navItem.settings.determines')}</p>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <div class="flex items-center space-x-2">
        <Switch
          id="is-published"
          bind:checked={$settings.is_published}
          onCheckedChange={(checked) => {
            hasUnsavedChanges = true;
            $settings.allow_new_students = checked;
            if (!$course.slug) {
              generateNewCourseLink();
            }
          }}
        />
        <Label for="is-published" class="text-sm text-gray-500">
          {$settings.is_published ? $t('course.navItem.settings.published') : $t('course.navItem.settings.unpublished')}
        </Label>
      </div>
    </Column>
  </Row>

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
  <div class="flex w-full items-center justify-end p-5">
    <PrimaryButton
      label={$t('course.navItem.settings.save')}
      isLoading={isSaving}
      isDisabled={isSaving}
      onClick={handleSave}
    />
  </div>
</Grid>
