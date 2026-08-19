<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { Badge } from '@cio/ui/base/badge';
  import { Label } from '@cio/ui/base/label';
  import { Switch } from '@cio/ui/base/switch';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import * as Select from '@cio/ui/base/select';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import XIcon from '@lucide/svelte/icons/x';
  import { getQuestionTypeById } from '@cio/question-types';

  import ReorderMaterialTabs from '$features/course/components/reorder-material-tabs.svelte';
  import CertificateDeadlineRequiredDialog from '$features/course/components/certificate-deadline-required-dialog.svelte';
  import { CourseTagPicker } from '$features/course/components';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Input } from '@cio/ui/base/input';
  import * as Field from '@cio/ui/base/field';
  import { UpgradeBanner, UnsavedChanges, UploadWidget, TextEditor, AttentionHighlight } from '$features/ui';
  import { Button } from '@cio/ui/base/button';

  import { settings } from '$features/course/utils/settings-store';
  import { getOrderedNavigableContent } from '$features/course/utils/content';
  import Copy from '@lucide/svelte/icons/copy';
  import * as Alert from '@cio/ui/base/alert';
  import LockOpenIcon from '@lucide/svelte/icons/lock-open';
  import type { TCourseType } from '@cio/db/types';
  import type { Course } from '../utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { isObject } from '$lib/utils/functions/isObject';
  import { snackbar } from '$features/ui/snackbar/store';
  import { generateSlug, isPublishedComplianceMissingDeadline, isSelfEnrollmentAllowed } from '@cio/utils/functions';
  import { DEFAULT_COMPLIANCE_SETTINGS } from '../utils/compliance-utils';
  import { ContentType } from '@cio/utils/constants/content';
  import { DeleteModal } from '$features/ui';
  import { contentApi, courseApi } from '$features/course/api';
  import { collectLockedContentItems } from '$features/course/utils/content-lock-utils';
  import { tagApi } from '$features/tag/api';
  import { uploadImage } from '$lib/utils/services/upload';
  import { copyToClipboard } from '$lib/utils/functions/formatYoutubeVideo';
  import { handleOpenWidget } from '$features/ui/course-landing-page/store';
  import { currentOrgDomain, currentOrgPath, isFreePlan } from '$lib/utils/store/org';
  import { page } from '$app/stores';
  import { ROUTE_NAME, ROUTE_SECTIONS } from '$lib/routing/routes';

  interface Props {
    hasUnsavedChanges?: boolean;
  }

  let { hasUnsavedChanges = $bindable(false) }: Props = $props();

  let isLoading = $state(false);
  let isGeneratingLink = $state(false);
  let isDeleting = $state(false);
  let openCertificateDeadlineDialog = $state(false);
  let completionDeadlineTrigger = $state(0);
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
  let initializedCourseId = $state<string | null>(null);
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

  let isUnlockingAll = $state(false);

  const lockedContentItems = $derived(collectLockedContentItems(courseApi.course));
  const isLiveClassCourse = $derived(courseApi.course?.type === 'LIVE_CLASS');
  const showLockedContentNotice = $derived($settings.isPublished && lockedContentItems.length > 0);

  async function handleUnlockAllContent() {
    const courseId = courseApi.course?.id;
    if (!courseId || lockedContentItems.length === 0 || isUnlockingAll) return;

    isUnlockingAll = true;
    const itemsToUnlock = [...lockedContentItems];
    const didUnlock = await contentApi.updateContent(
      courseId,
      itemsToUnlock.map((item) => ({ id: item.id, type: item.type, isUnlocked: true }))
    );

    if (didUnlock) {
      for (const item of itemsToUnlock) {
        courseApi.updateContentItem(item.id, item.type, { isUnlocked: true });
      }
      snackbar.success('snackbar.course_settings.success.unlocked_all_content');
    }

    isUnlockingAll = false;
  }

  async function handleDeleteCourse() {
    if (!courseApi.course) return;

    isDeleting = true;

    await courseApi.delete(courseApi.course.id);
    if (courseApi.success) {
      goto($currentOrgPath + '/courses');
    }

    isDeleting = false;
  }

  function onPublishToggle(checked: boolean) {
    if (!checked) {
      $settings.isPublished = false;
      hasUnsavedChanges = true;
      return;
    }

    if (
      isPublishedComplianceMissingDeadline({
        type: $settings.type,
        isPublished: true,
        deadline: $settings.certificate.deadline
      })
    ) {
      openCertificateDeadlineDialog = true;
      return;
    }

    // Otherwise, publish normally
    $settings.isPublished = true;
    $settings.allowSelfEnrollment = true;
    hasUnsavedChanges = true;
  }

  function goToCompletionDeadline() {
    openCertificateDeadlineDialog = false;
    completionDeadlineTrigger += 1;
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

    if (Number(courseApi.course?.cost) > 0 && !(courseApi.course?.metadata?.paymentLink ?? '').trim()) {
      snackbar.error('course.navItem.landing_page.editor.pricing_form.payment_required');
      return;
    }

    try {
      let logoUrl = $settings.logo;

      // Upload image if avatar is provided
      if (avatar) {
        logoUrl = await uploadImage(new File([avatar], avatar));
      }

      if (!courseApi.course) return;

      if (
        isPublishedComplianceMissingDeadline({
          type: $settings.type,
          isPublished: $settings.isPublished,
          deadline: $settings.certificate.deadline
        })
      ) {
        openCertificateDeadlineDialog = true;
        return;
      }

      if ($settings.isPublished && !courseApi.course.slug) {
        courseApi.course.slug = generateSlug($settings.courseTitle, { appendTimestamp: true });
      }

      const metadataPayload = {
        ...(isObject(courseApi.course.metadata) ? courseApi.course.metadata : {}),
        lessonTabsOrder: $settings.tabs,
        grading: $settings.grading,
        lessonDownload: $settings.lessonDownload,
        allowSelfEnrollment: $settings.allowSelfEnrollment,
        isContentGroupingEnabled: $settings.isContentGroupingEnabled,
        progressionMode: $settings.progressionMode,
        welcomeEmailMessage: $settings.welcomeEmailMessage?.trim() ? $settings.welcomeEmailMessage : null
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
        callout: $settings.type === 'PUBLIC' ? sanitizeCalloutForSave($settings.callout) : null,
        certificate: {
          ...(courseApi.course.certificate ?? {}),
          deadline: $settings.certificate.deadline,
          threshold: $settings.certificate.threshold,
          requiredExerciseId: $settings.certificate.requiredExerciseId,
          exerciseMinScorePercent: $settings.certificate.requiredExerciseId
            ? $settings.certificate.exerciseMinScorePercent
            : null
        }
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
      console.error(error);
      snackbar.error();
    }
  }

  const generateNewCourseLink = async () => {
    if (!courseApi.course || isGeneratingLink) return;

    isGeneratingLink = true;
    try {
      const newSlug = generateSlug(courseApi.course.title, { appendTimestamp: true });
      const response = await courseApi.update(courseApi.course.id, { slug: newSlug }, { showSuccessToast: false });

      if (courseApi.success && response) {
        courseApi.course.slug = response.slug ?? newSlug;
        snackbar.success('snackbar.course_settings.success.link_generated');
      }
    } catch (error) {
      console.error(error);
      snackbar.error();
    } finally {
      isGeneratingLink = false;
    }
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
        allowSelfEnrollment: isSelfEnrollmentAllowed(course.metadata),
        isContentGroupingEnabled: course.metadata?.isContentGroupingEnabled ?? true,
        progressionMode: course.metadata?.progressionMode ?? 'free',
        callout: normalizeCallout(course.callout),
        welcomeEmailMessage: course.metadata?.welcomeEmailMessage ?? '',
        certificate: {
          deadline: course.certificate?.deadline ?? null,
          threshold: typeof course.certificate?.threshold === 'number' ? course.certificate.threshold : 100,
          requiredExerciseId: course.certificate?.requiredExerciseId ?? null,
          exerciseMinScorePercent:
            typeof course.certificate?.exerciseMinScorePercent === 'number'
              ? course.certificate.exerciseMinScorePercent
              : course.certificate?.requiredExerciseId
                ? 100
                : null
        }
      });
    });
  }

  export function handleDiscard() {
    if (!courseApi.course) return;

    setDefault(courseApi.course);
    selectedTagIds = [...initialTagIds];
    avatar = undefined;
    errors = { title: undefined, description: undefined };
    delete courseApi.errors.type;
    courseApi.publicConversionOffenders = [];
    hasUnsavedChanges = false;
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
    const course = courseApi.course;
    if (course?.id && initializedCourseId !== course.id) {
      initializedCourseId = course.id;
      setDefault(course);
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

  const certExercises = $derived(
    getOrderedNavigableContent(courseApi.course).filter((item) => item.type === ContentType.Exercise)
  );

  const finalExerciseTitle = $derived(
    certExercises.find((item) => item.id === $settings.certificate.requiredExerciseId)?.title
  );

  function isoToDatetimeLocal(iso: string | null | undefined): string {
    if (!iso) return '';

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function onCompletionDeadlineChange(e: Event) {
    const value = (e.currentTarget as HTMLInputElement).value;
    $settings.certificate.deadline = value ? new Date(value).toISOString() : null;
    hasUnsavedChanges = true;
  }

  function onThresholdInput(e: Event) {
    const value = Number((e.currentTarget as HTMLInputElement).value);
    $settings.certificate.threshold = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 100;
    hasUnsavedChanges = true;
  }

  function onFinalExerciseChange(value: string) {
    $settings.certificate.requiredExerciseId = value && value !== 'none' ? value : null;

    if (!$settings.certificate.requiredExerciseId) {
      $settings.certificate.exerciseMinScorePercent = null;
    } else if (typeof $settings.certificate.exerciseMinScorePercent !== 'number') {
      $settings.certificate.exerciseMinScorePercent = 100;
    }

    hasUnsavedChanges = true;
  }

  function onMinExerciseScoreInput(e: Event) {
    const value = Number((e.currentTarget as HTMLInputElement).value);
    $settings.certificate.exerciseMinScorePercent = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 100;
    hasUnsavedChanges = true;
  }
</script>

<UnsavedChanges bind:hasUnsavedChanges />

<DeleteModal onDelete={handleDeleteCourse} bind:open={openDeleteModal} />

<CertificateDeadlineRequiredDialog bind:open={openCertificateDeadlineDialog} onGoToDeadline={goToCompletionDeadline} />

<Field.Group class="w-full max-w-md! px-2">
  <Field.Set>
    <Field.Legend>{$t('course.navItem.settings.cover_image')}</Field.Legend>
    <Field.Description>{$t('course.navItem.settings.optional_image')}</Field.Description>
    <Field.Group>
      <Field.Field>
        <div class="flex items-center gap-2">
          <Button variant="secondary" onclick={widgetControl}>
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
            alt="Course cover"
            src={$settings.logo ? $settings.logo : '/images/classroomio-course-img-template.jpg'}
            class="relative mt-2 h-[200px] w-[280px] rounded-md border object-cover md:mt-0"
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
            <IconButton
              onclick={generateNewCourseLink}
              loading={isGeneratingLink}
              tooltip={$t('course.navItem.settings.generate_link')}
            >
              <RotateCcwIcon size={16} />
            </IconButton>
            <IconButton
              href={courseLink}
              target="_blank"
              disabled={isGeneratingLink || !courseApi.course?.slug}
              tooltip={$t('course.navItem.settings.open_link')}
            >
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
              disabled={isGeneratingLink}
              tooltip={$t('course.navItem.settings.copy_link')}
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
    <Field.Legend>{$t('course.navItem.settings.type')}</Field.Legend>
    <Field.Description>
      {$t('course.navItem.settings.course_type_desc')}
      <a
        href="https://classroomio.com/docs/guides/course-types"
        target="_blank"
        rel="noopener noreferrer"
        class="ui:text-primary underline"
      >
        {$t('course.navItem.settings.course_type_learn_more')}
      </a>
    </Field.Description>
    <Field.Field>
      <Select.Root
        type="single"
        value={$settings.type}
        onValueChange={(value) => {
          if (!value) return;
          $settings.type = value as TCourseType;
          if (value !== 'PUBLIC') {
            delete courseApi.errors.type;
            courseApi.publicConversionOffenders = [];
          }
          hasUnsavedChanges = true;
        }}
      >
        <Select.Trigger class="w-full">
          {$t(`course.navItem.settings.${$settings.type.toLowerCase()}`)}
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            <Select.Item value="SELF_PACED" label={$t('course.navItem.settings.self_paced')}>
              {$t('course.navItem.settings.self_paced')}
            </Select.Item>
            <Select.Item value="LIVE_CLASS" label={$t('course.navItem.settings.live_class')}>
              {$t('course.navItem.settings.live_class')}
            </Select.Item>
            <Select.Item value="COMPLIANCE" label={$t('course.navItem.settings.compliance')}>
              {$t('course.navItem.settings.compliance')}
            </Select.Item>
            <Select.Item value="PUBLIC" label={$t('course.navItem.settings.public')}>
              {$t('course.navItem.settings.public')}
            </Select.Item>
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </Field.Field>

    {#if courseApi.errors.type || courseApi.publicConversionOffenders.length > 0}
      <div class="ui:mt-3 ui:rounded-lg ui:border ui:border-destructive ui:p-4" role="alert">
        <div class="flex items-start gap-3">
          <TriangleAlertIcon class="ui:stroke-destructive h-5 w-5 shrink-0 translate-y-0.5" />
          <div class="min-w-0 flex-1">
            <h4 class="text-sm font-semibold">{$t('course.navItem.settings.convert_to_public_blocked')}</h4>
            <p class="mt-1 text-xs leading-relaxed">
              {$t('course.navItem.settings.convert_to_public_blocked_desc')}
            </p>

            {#if courseApi.publicConversionOffenders.length > 0}
              <div class="mt-3 space-y-2">
                {#each courseApi.publicConversionOffenders as offender (offender.questionId)}
                  {@const questionTypeMeta = getQuestionTypeById(offender.typeId)}
                  <a
                    href={`/courses/${courseApi.course?.id}/exercises/${offender.exerciseId}?tab=questions&highlight=exercise-question-${offender.questionId}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    class="group ui:bg-background/80 flex items-center justify-between gap-3 rounded-md border p-2.5 transition-colors"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span
                          class="ui:text-foreground max-w-24 truncate text-sm font-medium group-hover:underline md:max-w-40"
                          title={offender.questionTitle}
                        >
                          {offender.questionTitle}
                        </span>
                        {#if questionTypeMeta?.label}
                          <Badge variant="outline" class="text-[11px]">
                            {questionTypeMeta.label}
                          </Badge>
                        {/if}
                      </div>
                      <p
                        class="ui:text-muted-foreground mt-0.5 max-w-56 truncate text-xs md:max-w-72"
                        title={$t('course.navItem.settings.question_in_exercise', {
                          exercise: offender.exerciseTitle
                        })}
                      >
                        {$t('course.navItem.settings.question_in_exercise', {
                          exercise: offender.exerciseTitle
                        })}
                      </p>
                    </div>
                    <div class="text-destructive flex shrink-0 items-center gap-1 text-xs font-medium">
                      <span>{$t('course.navItem.settings.fix_question')}</span>
                      <ArrowUpRightIcon
                        class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </div>
                  </a>
                {/each}
              </div>
            {:else if courseApi.errors.type}
              <p class="ui:mt-2 ui:text-destructive/90 text-sm">{courseApi.errors.type}</p>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <Field.Group class="mt-3">
      <AttentionHighlight
        id={ROUTE_SECTIONS[ROUTE_NAME.COURSE_SETTINGS].COMPLETION_DEADLINE}
        trigger={completionDeadlineTrigger}
      >
        <Field.Field>
          <Field.Label>
            {$t('course.navItem.settings.completion_deadline_label')}
          </Field.Label>
          <Input
            id="course-completion-deadline"
            type="datetime-local"
            class="w-full"
            value={isoToDatetimeLocal($settings.certificate.deadline)}
            onchange={onCompletionDeadlineChange}
          />
          <Field.Description>{$t('course.navItem.settings.completion_deadline_helper')}</Field.Description>
          {#if courseApi.errors['certificate.deadline']}
            <Field.Error>{courseApi.errors['certificate.deadline']}</Field.Error>
          {/if}
        </Field.Field>
      </AttentionHighlight>

      <Field.Field>
        <Field.Label for="course-completion-threshold">
          {$t('course.certification.threshold_label')}
        </Field.Label>
        <Input
          id="course-completion-threshold"
          type="number"
          min={0}
          max={100}
          class="w-full"
          value={String($settings.certificate.threshold)}
          oninput={onThresholdInput}
        />
        <Field.Description>{$t('course.certification.threshold_helper')}</Field.Description>
        {#if courseApi.errors['certificate.threshold']}
          <Field.Error>{courseApi.errors['certificate.threshold']}</Field.Error>
        {/if}
      </Field.Field>

      <Field.Field>
        <Field.Label for="course-final-exercise">
          {$t('course.certification.final_exercise_label')}
        </Field.Label>
        <Select.Root
          type="single"
          value={$settings.certificate.requiredExerciseId ?? 'none'}
          onValueChange={onFinalExerciseChange}
        >
          <Select.Trigger class="w-full">
            {finalExerciseTitle ?? $t('course.certification.final_exercise_none')}
          </Select.Trigger>
          <Select.Content>
            <Select.Group>
              <Select.Item value="none" label={$t('course.certification.final_exercise_none')}>
                {$t('course.certification.final_exercise_none')}
              </Select.Item>
              {#each certExercises as item (item.id)}
                <Select.Item value={item.id} label={item.title}>
                  {item.title}
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
        <Field.Description>{$t('course.certification.final_exercise_helper')}</Field.Description>
        <Field.Description>{$t('course.certification.final_exercise_multiple_attempts_note')}</Field.Description>
      </Field.Field>

      {#if $settings.certificate.requiredExerciseId}
        <Field.Field>
          <Field.Label for="course-min-exercise-score">
            {$t('course.certification.min_exercise_score_label')}
          </Field.Label>
          <Input
            id="course-min-exercise-score"
            type="number"
            min={0}
            max={100}
            class="w-full"
            value={String($settings.certificate.exerciseMinScorePercent ?? 100)}
            oninput={onMinExerciseScoreInput}
          />
          <Field.Description>{$t('course.certification.min_exercise_score_helper')}</Field.Description>
          {#if courseApi.errors['certificate.exerciseMinScorePercent']}
            <Field.Error>{courseApi.errors['certificate.exerciseMinScorePercent']}</Field.Error>
          {/if}
        </Field.Field>
      {/if}
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('course.navItem.settings.welcome_email.title')}</Field.Legend>
    <Field.Description>{$t('course.navItem.settings.welcome_email.description')}</Field.Description>
    <div class="w-full max-w-md">
      <TextEditor
        content={$settings.welcomeEmailMessage}
        placeholder={$t('course.navItem.settings.welcome_email.placeholder')}
        class="w-full"
        editorClass="h-auto! max-h-[200px] min-h-[120px]"
        onChange={(text) => {
          $settings.welcomeEmailMessage = text;
          hasUnsavedChanges = true;
        }}
      />
    </div>
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
    <Field.Legend>{$t('course.navItem.settings.progression_mode_title')}</Field.Legend>
    <Field.Description>{$t('course.navItem.settings.progression_mode_description')}</Field.Description>
    <Field.Field>
      <RadioGroup.Root
        value={$settings.progressionMode}
        onValueChange={(value) => {
          if (value === 'free' || value === 'sequential') {
            $settings.progressionMode = value;
            hasUnsavedChanges = true;
          }
        }}
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <RadioGroup.Item value="free" id="progression-free" />
            <Label for="progression-free">{$t('course.navItem.settings.progression_mode_free')}</Label>
          </div>
          <div class="flex items-center gap-2">
            <RadioGroup.Item value="sequential" id="progression-sequential" />
            <Label for="progression-sequential">{$t('course.navItem.settings.progression_mode_sequential')}</Label>
          </div>
        </div>
      </RadioGroup.Root>
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
        id="allow-self-enrollment"
        checked={$settings.allowSelfEnrollment}
        onCheckedChange={(checked) => {
          $settings.allowSelfEnrollment = checked;
          hasUnsavedChanges = true;
        }}
      />
      <Label for="allow-self-enrollment">
        {$settings.allowSelfEnrollment ? $t('course.navItem.settings.enabled') : $t('course.navItem.settings.disabled')}
      </Label>
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set id="publish">
    <Field.Legend>{$t('course.navItem.settings.publish')}</Field.Legend>
    <Field.Description>{$t('course.navItem.settings.determines')}</Field.Description>
    <AttentionHighlight id="publish">
      <Field.Field orientation="horizontal">
        <Switch id="is-published" checked={$settings.isPublished} onCheckedChange={onPublishToggle} />
        <Label for="publish">
          {$settings.isPublished ? $t('course.navItem.settings.published') : $t('course.navItem.settings.unpublished')}
        </Label>
      </Field.Field>
    </AttentionHighlight>

    {#if showLockedContentNotice}
      <Alert.Root variant={isLiveClassCourse ? 'information' : 'warning'}>
        <LockOpenIcon />
        <Alert.Title>
          {$t('course.navItem.settings.locked_content.title', { count: lockedContentItems.length })}
        </Alert.Title>
        <Alert.Description>
          {isLiveClassCourse
            ? $t('course.navItem.settings.locked_content.description_live')
            : $t('course.navItem.settings.locked_content.description')}
          <Button
            variant="outline"
            size="sm"
            class="mt-2 w-fit"
            loading={isUnlockingAll}
            disabled={isUnlockingAll}
            onclick={handleUnlockAllContent}
          >
            {$t('course.navItem.settings.locked_content.unlock_all')}
          </Button>
        </Alert.Description>
      </Alert.Root>
    {/if}
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
