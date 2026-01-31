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
  import type { TCourseType } from '@cio/db/types';
  import type { Course } from '../utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { isObject } from '$lib/utils/functions/isObject';
  import { snackbar } from '$features/ui/snackbar/store';
  import generateSlug from '$lib/utils/functions/generateSlug';
  import { DeleteModal } from '$features/ui';
  import { courseApi } from '$features/course/api';
  import { uploadImage } from '$lib/utils/services/upload';
  import { copyToClipboard } from '$lib/utils/functions/formatYoutubeVideo';
  import { handleOpenWidget } from '$features/ui/course-landing-page/store';
  import { currentOrgDomain, currentOrgPath, isFreePlan } from '$lib/utils/store/org';
  import { page } from '$app/stores';

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

  const downloadCourse = async () => {
    alert('Coming soon');
  };

  const deleteBannerImage = () => {
    $settings.logo = '';
    hasUnsavedChanges = true;
  };

  async function handleDeleteCourse() {
    if (!courseApi.course) return;

    isDeleting = true;

    await courseApi.delete(courseApi.course.id);
    if (courseApi.success) {
      goto($currentOrgPath + '/courses');
    }

    isDeleting = false;
  }

  export async function handleSave() {
    if (!$settings.courseTitle) {
      errors.title = $t('snackbar.course_settings.error.title');
      return;
    }

    if (!$settings.courseDescription) {
      errors.description = $t('snackbar.course_settings.error.description');
      return;
    }

    try {
      let logoUrl = $settings.logo;

      // Upload image if avatar is provided
      if (avatar) {
        logoUrl = await uploadImage(new File([avatar], avatar));
      }

      if (!courseApi.course) return;

      const metadataPayload = {
        ...(isObject(courseApi.course.metadata) ? courseApi.course.metadata : {}),
        lessonTabsOrder: $settings.tabs,
        grading: $settings.grading,
        lessonDownload: $settings.lessonDownload,
        allowNewStudent: $settings.allowNewStudents ?? false,
        isContentGroupingEnabled: $settings.isContentGroupingEnabled
      } as NonNullable<Course['metadata']>;

      const updatedCourse = {
        title: $settings.courseTitle,
        description: $settings.courseDescription,
        type: $settings.type,
        logo: logoUrl,
        isPublished: $settings.isPublished,
        metadata: metadataPayload,
        slug: courseApi.course.slug!
      };

      const response = await courseApi.update(courseApi.course.id, updatedCourse);

      if (courseApi.success && response) {
        // courseApi.update() already updates courseApi.course internally
        hasUnsavedChanges = false;
      }
    } catch (error) {
      snackbar.error();
    }
  }

  const generateNewCourseLink = () => {
    if (!courseApi.course) return;
    courseApi.course.slug = generateSlug(courseApi.course.title);
    hasUnsavedChanges = true;
  };

  async function setDefault(course: Course) {
    if (!course || !Object.keys(course).length) return;

    untrack(() => {
      settings.set({
        courseTitle: course.title,
        type: (course.type as TCourseType) || ('SELF_PACED' as TCourseType),
        courseDescription: course.description,
        logo: course.logo || '',
        tabs: course.metadata?.lessonTabsOrder || $settings.tabs,
        grading: !!course.metadata?.grading,
        lessonDownload: !!course.metadata?.lessonDownload,
        isPublished: !!course.isPublished,
        allowNewStudents: !!course.metadata?.allowNewStudent,
        isContentGroupingEnabled: course.metadata?.isContentGroupingEnabled ?? true
      });
    });
  }

  // Initialize course from page data
  $effect(() => {
    const courseData = $page.data?.course;
    const courseId = $page.data?.courseId;
    if (courseData && courseId && !courseApi.course) {
      courseApi.course = courseData;
    }
  });

  $effect(() => {
    if (courseApi.course) {
      setDefault(courseApi.course);
    }
  });

  let courseLink = $derived(courseApi.course?.slug ? `${$currentOrgDomain}/course/${courseApi.course.slug}` : '');
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
          bind:value={$settings.courseTitle}
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
          bind:value={$settings.courseDescription}
          errorMessage={errors?.description}
          onchange={() => {
            hasUnsavedChanges = true;
          }}
        />
      </Field.Field>
      <Field.Field>
        <Field.Label class="justify-between"
          >{$t('course.navItem.settings.link')}

          <div class="flex items-center gap-1">
            <IconButton onclick={generateNewCourseLink}>
              <RotateCcwIcon size={16} />
            </IconButton>
            <IconButton onclick={() => goto(courseLink)}>
              <ArrowUpRightIcon size={16} />
            </IconButton>
          </div>
        </Field.Label>

        <div class="flex items-center justify-between rounded-md border p-1">
          {#if courseApi.course?.slug}
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
    <Field.Legend>{$t('course.navItem.settings.content_grouping_title')}</Field.Legend>
    <Field.Description>{$t('course.navItem.settings.content_grouping_description')}</Field.Description>
    <Field.Field orientation="horizontal">
      <Switch
        id="content-grouping"
        checked={$settings.isContentGroupingEnabled}
        onCheckedChange={(checked) => {
          $settings.isContentGroupingEnabled = checked;
          hasUnsavedChanges = true;
        }}
      />
      <Label for="content-grouping">
        {$settings.isContentGroupingEnabled
          ? $t('course.navItem.settings.enabled')
          : $t('course.navItem.settings.disabled')}
      </Label>
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
            checked={$settings.lessonDownload}
            onCheckedChange={(checked) => {
              $settings.lessonDownload = checked;
              hasUnsavedChanges = true;
            }}
          />
          <Label for="lesson-download">
            {$settings.lessonDownload ? $t('course.navItem.settings.enabled') : $t('course.navItem.settings.disabled')}
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
          $settings.type = value as TCourseType;
          if (hasUnsavedChanges) return;
          hasUnsavedChanges = true;
        }}
      >
        <div class="mb-3 flex items-center space-x-2">
          <RadioGroup.Item value={'LIVE_CLASS' as TCourseType} id="live-class" />
          <Label for="live-class">{$t('course.navItem.settings.live_class')}</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroup.Item value={'SELF_PACED' as TCourseType} id="self-paced" />
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
        checked={$settings.allowNewStudents}
        onCheckedChange={(checked) => {
          $settings.allowNewStudents = checked;
          hasUnsavedChanges = true;
        }}
      />
      <Label for="allow-new-student">
        {$settings.allowNewStudents ? $t('course.navItem.settings.enabled') : $t('course.navItem.settings.disabled')}
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
        checked={$settings.isPublished}
        onCheckedChange={(checked) => {
          $settings.isPublished = checked;
          hasUnsavedChanges = true;
        }}
      />
      <Label for="publish">
        {$settings.isPublished ? $t('course.navItem.settings.published') : $t('course.navItem.settings.unpublished')}
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
