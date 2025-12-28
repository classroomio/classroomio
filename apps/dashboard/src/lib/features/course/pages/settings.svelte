<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { Label } from '@cio/ui/base/label';
  import { Switch } from '@cio/ui/base/switch';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';

  import ReorderMaterialTabs from '$features/course/components/reorder-material-tabs.svelte';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { InputField } from '@cio/ui/custom/input-field';
  import * as Field from '@cio/ui/base/field';
  import { UpgradeBanner, UnsavedChanges, UploadWidget } from '$features/ui';
  import { Button } from '@cio/ui/base/button';

  import { settings } from '$features/course/utils/settings-store';
  import Copy from '@lucide/svelte/icons/copy';
  import type { Course } from '$lib/utils/types';
  import { COURSE_TYPE } from '$lib/utils/types';
  import { lessons } from '$features/course/components/lesson/store/lessons';
  import { course } from '$features/course/store';
  import { t } from '$lib/utils/functions/translations';
  import { isObject } from '$lib/utils/functions/isObject';
  import { snackbar } from '$features/ui/snackbar/store';
  import generateSlug from '$lib/utils/functions/generateSlug';
  import { DeleteModal } from '$features/ui';
  import { deleteCourse, updateCourse } from '$lib/utils/services/courses';
  import { copyToClipboard } from '$lib/utils/functions/formatYoutubeVideo';
  import { handleOpenWidget } from '$features/ui/course-landing-page/store';
  import { currentOrg, currentOrgDomain, currentOrgPath, isFreePlan } from '$lib/utils/store/org';

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

  export async function handleSave() {
    if (!$settings.course_title) {
      errors.title = $t('snackbar.course_settings.error.title');
      return;
    }

    if (!$settings.course_description) {
      errors.description = $t('snackbar.course_settings.error.description');
      return;
    }

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
      await updateCourse($course.id, avatar ? new File([avatar], avatar) : undefined, updatedCourse);

      $course = {
        ...$course,
        ...updatedCourse
      };

      snackbar.success('snackbar.course_settings.success.saved');

      hasUnsavedChanges = false;
    } catch (error) {
      snackbar.error();
    }
  }

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

<Field.Group class="w-full max-w-md! px-2">
  <Field.Set>
    <Field.Legend>{$t('course.navItem.settings.cover_image')}</Field.Legend>
    <Field.Description>{$t('course.navItem.settings.optional_image')}</Field.Description>
    <Field.Group>
      <Field.Field>
        <div class="flex items-center gap-2">
          <Button onclick={widgetControl}>
            {$t('course.navItem.settings.replace')}
          </Button>
          <Button variant="outline" onclick={deleteBannerImage}>
            {$t('ai.reset')}
          </Button>
        </div>
        {#if $handleOpenWidget.open}
          <UploadWidget
            bind:imageURL={$settings.logo}
            onchange={() => {
              hasUnsavedChanges = true;
            }}
          />
        {/if}
      </Field.Field>
      <Field.Field>
        <div class="relative z-20 w-fit">
          <img
            style="min-width:280px; min-height:200px"
            alt="Course cover"
            src={$settings.logo ? $settings.logo : '/images/classroomio-course-img-template.jpg'}
            class="relative mt-2 h-[200px] w-[280px] rounded-md md:mt-0"
          />
        </div>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set id="share">
    <Field.Legend>{$t('course.navItem.settings.course_details')}</Field.Legend>
    <Field.Group>
      <Field.Field>
        <InputField
          label={$t('course.navItem.settings.course_title')}
          placeholder="Write the course title here"
          className="w-full"
          isRequired
          bind:value={$settings.course_title}
          errorMessage={errors?.title}
          onInputChange={() => {
            hasUnsavedChanges = true;
          }}
        />
      </Field.Field>
      <Field.Field>
        <TextareaField
          label={$t('course.navItem.settings.course_description')}
          placeholder={$t('course.navItem.settings.placeholder')}
          className="w-full"
          isRequired
          bind:value={$settings.course_description}
          errorMessage={errors?.description}
          onchange={() => {
            hasUnsavedChanges = true;
          }}
        />
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('course.navItem.settings.link')}</Field.Label>
        <div class="mb-2 flex items-center gap-2">
          <IconButton onclick={generateNewCourseLink}>
            <RotateCcwIcon size={16} />
          </IconButton>
          <span class="grow"></span>
          <IconButton onclick={() => goto(courseLink)}>
            <ArrowUpRightIcon size={16} />
          </IconButton>
        </div>
        <div class="flex items-center justify-between rounded-md border p-3">
          {#if $course.slug}
            <p class="text-sm">{courseLink}</p>
            <IconButton
              onclick={() => {
                copyToClipboard(courseLink);
              }}
            >
              <Copy size={16} />
            </IconButton>
          {:else}
            <p class="text-sm">Setup landing page to get course link</p>
          {/if}
        </div>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.navItem.settings.order')}</Field.Legend>
    <Field.Description>{$t('course.navItem.settings.drag')}</Field.Description>
    <Field.Field>
      <ReorderMaterialTabs
        onchange={() => {
          hasUnsavedChanges = true;
        }}
      />
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.navItem.settings.lesson_download')}</Field.Legend>
    <Field.Description>{$t('course.navItem.settings.available')}</Field.Description>
    <Field.Field>
      {#if $isFreePlan}
        <UpgradeBanner>{$t('upgrade.download_lessons')}</UpgradeBanner>
      {:else}
        <div class="flex items-center space-x-2">
          <Switch
            id="lesson-download"
            checked={$settings.lesson_download}
            onCheckedChange={(checked) => {
              $settings.lesson_download = checked;
              hasUnsavedChanges = true;
            }}
          />
          <Label for="lesson-download" class="text-sm text-gray-500">
            {$settings.lesson_download ? $t('course.navItem.settings.enabled') : $t('course.navItem.settings.disabled')}
          </Label>
        </div>
      {/if}
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.navItem.settings.course_download')}</Field.Legend>
    <Field.Description>{$t('course.navItem.settings.course_avail')}</Field.Description>
    <Field.Field>
      {#if $isFreePlan}
        <UpgradeBanner>{$t('upgrade.download_course')}</UpgradeBanner>
      {:else}
        <Button variant="outline" onclick={downloadCourse} disabled={isLoading} loading={isLoading}>
          {$t('course.navItem.settings.download')}
        </Button>
      {/if}
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.navItem.settings.type')}</Field.Legend>
    <Field.Description>{$t('course.navItem.settings.course_type_desc')}</Field.Description>
    <Field.Field>
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
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.navItem.settings.allow')}</Field.Legend>
    <Field.Description>{$t('course.navItem.settings.access')}</Field.Description>
    <Field.Field orientation="horizontal">
      <Switch
        id="allow-new-students"
        checked={$settings.allow_new_students}
        onCheckedChange={(checked) => {
          $settings.allow_new_students = checked;
          hasUnsavedChanges = true;
        }}
      />
      <Label for="allow-new-students" class="text-sm text-gray-500">
        {$settings.allow_new_students ? $t('course.navItem.settings.enabled') : $t('course.navItem.settings.disabled')}
      </Label>
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.navItem.settings.publish')}</Field.Legend>
    <Field.Description>{$t('course.navItem.settings.determines')}</Field.Description>
    <Field.Field orientation="horizontal">
      <Switch
        id="is-published"
        checked={$settings.is_published}
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
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set id="delete">
    <Field.Legend>{$t('course.navItem.settings.delete')}</Field.Legend>
    <Field.Description>{$t('course.navItem.settings.delete_text')}</Field.Description>
    <Field.Field>
      <Button variant="destructive" onclick={() => (openDeleteModal = true)} loading={isDeleting} disabled={isDeleting}>
        {$t('course.navItem.settings.delete')}
      </Button>
    </Field.Field>
  </Field.Set>
</Field.Group>
