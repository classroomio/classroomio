<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { Badge } from '@cio/ui/base/badge';
  import { Label } from '@cio/ui/base/label';
  import { Switch } from '@cio/ui/base/switch';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import XIcon from '@lucide/svelte/icons/x';

  import ReorderMaterialTabs from '$features/course/components/reorder-material-tabs.svelte';
  import { CourseTagPicker } from '$features/course/components';
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
  import { generateSlug } from '@cio/utils/functions';
  import { DEFAULT_COMPLIANCE_SETTINGS } from '../utils/compliance-utils';
  import { DeleteModal } from '$features/ui';
  import { courseApi } from '$features/course/api';
  import { tagApi } from '$features/tag/api';
  import { uploadImage } from '$lib/utils/services/upload';
  import { copyToClipboard } from '$lib/utils/functions/formatYoutubeVideo';
  import { handleOpenWidget } from '$features/ui/course-landing-page/store';
  import { currentOrgDomain, currentOrgPath, isFreePlan } from '$lib/utils/store/org';
  import { page } from '$app/stores';

  interface Props {
    hasUnsavedChanges?: boolean;
  }

  let { hasUnsavedChanges = $bindable(false) }: Props = $props();

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
  let openDeleteModal = $state(false);
  let selectedTagIds = $state<string[]>([]);
  let initialTagIds = $state<string[]>([]);
  let loadedCourseTagsForId = $state<string | null>(null);
  let isTagPopoverOpen = $state(false);

  function normalizeTagIds(tagIds: string[]) {
    return Array.from(new Set(tagIds));
  }

  function areSameTagIds(a: string[], b: string[]) {
    if (a.length !== b.length) {
      return false;
    }

    const left = [...a].sort();
    const right = [...b].sort();

    return left.every((value, index) => value === right[index]);
  }

  async function loadCourseTags(courseId: string) {
    loadedCourseTagsForId = courseId;

    await Promise.all([tagApi.getTagGroups(), tagApi.getCourseTags(courseId)]);

    const assignedTagIds = normalizeTagIds(tagApi.courseTags.map((tag) => tag.id));
    selectedTagIds = assignedTagIds;
    initialTagIds = assignedTagIds;
  }

  function toggleTagSelection(tagId: string) {
    const selected = new Set(selectedTagIds);

    if (selected.has(tagId)) {
      selected.delete(tagId);
    } else {
      selected.add(tagId);
    }

    selectedTagIds = Array.from(selected);
    hasUnsavedChanges = true;
  }

  function removeSelectedTag(tagId: string) {
    selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
    hasUnsavedChanges = true;
  }

  function widgetControl() {
    $handleOpenWidget.open = !$handleOpenWidget.open;
  }

  const downloadCourse = async () => {
    alert($t('course.navItem.settings.coming_soon'));
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

      if ($settings.isPublished && !courseApi.course.slug) {
        courseApi.course.slug = generateSlug($settings.courseTitle, { appendTimestamp: true });
      }

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
        slug: courseApi.course.slug ?? undefined,
        compliance:
          $settings.type === 'COMPLIANCE' ? (courseApi.course.compliance ?? DEFAULT_COMPLIANCE_SETTINGS) : undefined,
        callout: $settings.type === 'PUBLIC' ? sanitizeCalloutForSave($settings.callout) : null
      };

      const normalizedSelectedTagIds = normalizeTagIds(selectedTagIds);
      const hasTagChanges = !areSameTagIds(normalizedSelectedTagIds, initialTagIds);

      const updatePayload = {
        ...updatedCourse,
        ...(hasTagChanges ? { tagIds: normalizedSelectedTagIds } : {})
      };

      const response = await courseApi.update(courseApi.course.id, updatePayload, {
        showSuccessToast: !hasTagChanges
      });

      if (courseApi.success && response) {
        if (hasTagChanges) {
          initialTagIds = normalizedSelectedTagIds;
          selectedTagIds = normalizedSelectedTagIds;
          snackbar.success('snackbar.course_settings.success.update_successful');
        }

        // courseApi.update() already updates courseApi.course internally
        hasUnsavedChanges = false;
      }
    } catch (error) {
      snackbar.error();
    }
  }

  const generateNewCourseLink = () => {
    if (!courseApi.course) return;
    courseApi.course.slug = generateSlug(courseApi.course.title, { appendTimestamp: true });
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
        isContentGroupingEnabled: course.metadata?.isContentGroupingEnabled ?? true,
        callout: normalizeCallout(course.callout)
      });
    });
  }

  function sanitizeCalloutForSave(value: typeof $settings.callout) {
    if (!value) return null;

    const title = value.title.trim();
    const description = value.description.trim();
    const buttonLabel = value.buttonLabel.trim();
    const buttonUrl = value.buttonUrl.trim();
    const animation = value.animation ?? 'waves';

    if (!title && !description && !buttonLabel && !buttonUrl) return null;

    return { title, description, buttonLabel, buttonUrl, animation };
  }

  function normalizeCallout(value: unknown): typeof $settings.callout {
    if (!value || typeof value !== 'object') return null;

    const candidate = value as Record<string, unknown>;
    if (
      typeof candidate.title !== 'string' ||
      typeof candidate.description !== 'string' ||
      typeof candidate.buttonLabel !== 'string' ||
      typeof candidate.buttonUrl !== 'string'
    ) {
      return null;
    }

    const animation =
      candidate.animation === 'dotted' || candidate.animation === 'none' || candidate.animation === 'waves'
        ? candidate.animation
        : 'waves';

    return {
      title: candidate.title,
      description: candidate.description,
      buttonLabel: candidate.buttonLabel,
      buttonUrl: candidate.buttonUrl,
      animation
    };
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

  $effect(() => {
    if ($settings.type === 'PUBLIC' && $settings.callout === null) {
      settings.update((prev) => ({
        ...prev,
        callout: { title: '', description: '', buttonLabel: '', buttonUrl: '', animation: 'waves' }
      }));
    }
  });

  $effect(() => {
    const courseId = courseApi.course?.id;

    if (!courseId || loadedCourseTagsForId === courseId) {
      return;
    }

    loadCourseTags(courseId);
  });

  const selectedTagChips = $derived.by(() => {
    const allTags = tagApi.tagGroups.flatMap((group) =>
      group.tags.map((tag) => ({
        ...tag,
        category: group.name
      }))
    );

    const tagById = new Map(allTags.map((tag) => [tag.id, tag]));

    const selected: (typeof allTags)[number][] = [];

    for (const tagId of selectedTagIds) {
      const existing = tagById.get(tagId);
      if (existing) {
        selected.push(existing);
        continue;
      }

      const assigned = tagApi.courseTags.find((tag) => tag.id === tagId);
      if (assigned) {
        selected.push({
          ...assigned,
          category: '',
          courseCount: 1
        });
      }
    }

    return selected;
  });

  let courseLink = $derived(courseApi.course?.slug ? `${$currentOrgDomain}/course/${courseApi.course.slug}` : '#');
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
        <div class="relative w-fit">
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
          placeholder={$t('course.navItem.settings.course_title_placeholder')}
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
            <IconButton href={courseLink} target="_blank">
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
            <p class="text-sm">{$t('course.navItem.settings.setup_landing_for_link')}</p>
          {/if}
        </div>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.navItem.settings.tags.title')}</Field.Legend>
    <Field.Description>{$t('course.navItem.settings.tags.description')}</Field.Description>
    <Field.Field>
      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          {#if !selectedTagChips.length}
            <p class="ui:text-muted-foreground text-sm">{$t('course.navItem.settings.tags.empty')}</p>
          {:else}
            {#each selectedTagChips as tag (tag.id)}
              <Badge variant="outline" class="flex items-center gap-2">
                <span
                  class="inline-block h-2.5 w-2.5 rounded-full border"
                  style={`background-color: ${tag.color}`}
                  aria-hidden="true"
                ></span>
                <span>{tag.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  class="h-5 w-5"
                  onclick={() => removeSelectedTag(tag.id)}
                >
                  <XIcon />
                </Button>
              </Badge>
            {/each}
          {/if}

          <CourseTagPicker
            tagGroups={tagApi.tagGroups}
            {selectedTagIds}
            bind:open={isTagPopoverOpen}
            onTagToggle={toggleTagSelection}
          />
        </div>
      </div>
    </Field.Field>
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
          console.log('checked', checked);
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
          <RadioGroup.Item value={'SELF_PACED' as TCourseType} id="self-paced" />
          <Label for="self-paced">{$t('course.navItem.settings.self_paced')}</Label>
        </div>
        <div class="mb-3 flex items-center space-x-2">
          <RadioGroup.Item value={'LIVE_CLASS' as TCourseType} id="live-class" />
          <Label for="live-class">{$t('course.navItem.settings.live_class')}</Label>
        </div>
        <div class="mb-3 flex items-center space-x-2">
          <RadioGroup.Item value={'COMPLIANCE' as TCourseType} id="compliance-course" />
          <Label for="compliance-course">{$t('course.navItem.settings.compliance')}</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroup.Item value={'PUBLIC' as TCourseType} id="public-course" />
          <Label for="public-course">{$t('course.navItem.settings.public')}</Label>
        </div>
      </RadioGroup.Root>
    </Field.Field>

    {#if courseApi.errors.type}
      <div
        class="ui:mt-2 ui:rounded-md ui:border ui:border-destructive/30 ui:bg-destructive/5 ui:p-3 ui:text-sm ui:text-destructive"
        role="alert"
      >
        <div class="ui:font-medium">{$t('course.navItem.settings.convert_to_public_blocked')}</div>
        <p class="ui:mt-1 ui:text-destructive/90">{courseApi.errors.type}</p>
      </div>
    {/if}
  </Field.Set>

  {#if $settings.type === 'PUBLIC' && $settings.callout}
    <Field.Separator />

    <Field.Set>
      <Field.Legend>{$t('course.navItem.settings.callout.legend')}</Field.Legend>
      <Field.Description>{$t('course.navItem.settings.callout.description')}</Field.Description>

      <Field.Group>
        <Field.Field>
          <Field.Label>{$t('course.navItem.settings.callout.title_label')}</Field.Label>
          <InputField
            bind:value={$settings.callout.title}
            onInputChange={() => (hasUnsavedChanges = true)}
            placeholder={$t('course.navItem.settings.callout.title_placeholder')}
          />
        </Field.Field>

        <Field.Field>
          <Field.Label>{$t('course.navItem.settings.callout.description_label')}</Field.Label>
          <TextareaField
            bind:value={$settings.callout.description}
            oninput={() => (hasUnsavedChanges = true)}
            rows={3}
            placeholder={$t('course.navItem.settings.callout.description_placeholder')}
          />
        </Field.Field>

        <Field.Field>
          <Field.Label>{$t('course.navItem.settings.callout.button_label')}</Field.Label>
          <InputField
            bind:value={$settings.callout.buttonLabel}
            onInputChange={() => (hasUnsavedChanges = true)}
            placeholder={$t('course.navItem.settings.callout.button_label_placeholder')}
          />
        </Field.Field>

        <Field.Field>
          <Field.Label>{$t('course.navItem.settings.callout.button_url_label')}</Field.Label>
          <InputField
            bind:value={$settings.callout.buttonUrl}
            onInputChange={() => (hasUnsavedChanges = true)}
            placeholder={$t('course.navItem.settings.callout.button_url_placeholder')}
            type="url"
          />
        </Field.Field>

        <Field.Field>
          <Field.Label>{$t('course.navItem.settings.callout.animation_label')}</Field.Label>
          <Field.Description>
            {$t('course.navItem.settings.callout.animation_description')}
          </Field.Description>
          <RadioGroup.Root
            value={$settings.callout.animation ?? 'waves'}
            onValueChange={(value) => {
              if (!$settings.callout) return;
              const next = value === 'dotted' || value === 'none' ? value : 'waves';
              settings.update((prev) =>
                prev.callout ? { ...prev, callout: { ...prev.callout, animation: next } } : prev
              );
              hasUnsavedChanges = true;
            }}
            class="ui:mt-1 flex flex-col gap-2"
          >
            <Field.Field orientation="horizontal">
              <RadioGroup.Item value="waves" id="callout-animation-waves" />
              <Label for="callout-animation-waves">
                {$t('course.navItem.settings.callout.animation_waves')}
              </Label>
            </Field.Field>
            <Field.Field orientation="horizontal">
              <RadioGroup.Item value="dotted" id="callout-animation-dotted" />
              <Label for="callout-animation-dotted">
                {$t('course.navItem.settings.callout.animation_dotted')}
              </Label>
            </Field.Field>
            <Field.Field orientation="horizontal">
              <RadioGroup.Item value="none" id="callout-animation-none" />
              <Label for="callout-animation-none">
                {$t('course.navItem.settings.callout.animation_none')}
              </Label>
            </Field.Field>
          </RadioGroup.Root>
        </Field.Field>
      </Field.Group>

      <Field.Field>
        <Button
          variant="outline"
          size="sm"
          onclick={() => {
            settings.update((prev) => ({ ...prev, callout: null }));
            hasUnsavedChanges = true;
          }}
        >
          {$t('course.navItem.settings.callout.clear')}
        </Button>
      </Field.Field>
    </Field.Set>
  {/if}

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
      <Button
        variant="destructive"
        onclick={() => (openDeleteModal = true)}
        loading={isDeleting}
        disabled={isDeleting}
        class="w-fit!"
      >
        {$t('course.navItem.settings.delete')}
      </Button>
    </Field.Field>
  </Field.Set>
</Field.Group>
