<script lang="ts">
  import type { Component } from 'svelte';
  import { untrack } from 'svelte';
  import cloneDeep from 'lodash/cloneDeep';
  import set from 'lodash/set';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { currentOrgDomain } from '$lib/utils/store/org';
  import {
    HeaderIcon,
    GoalIcon,
    LessonIcon,
    ExerciseIcon,
    CertificateIcon,
    MoneyIcon,
    ReviewIcon,
    PersonIcon,
    ContentIcon,
    HoverableItem,
    PreviewIcon
  } from '@cio/ui/custom/moving-icons';
  import type { TCourseUpdate } from '@cio/utils/validation/course';
  import type { LandingSectionKey } from '@cio/ui/custom/org-landing-page';

  import { IconButton } from '@cio/ui/custom/icon-button';
  import { CloseButton } from '$features/ui';
  import HeaderForm from './header-form.svelte';
  import RequirementForm from './requirement-form.svelte';
  import DescriptionForm from './description-form.svelte';
  import PricingForm from './pricing-form.svelte';
  import GoalsForm from './goals-form.svelte';
  import ReviewsForm from './reviews-form.svelte';
  import CertificateForm from './certificate-form.svelte';
  import InstructorForm from './instructor-form.svelte';
  import SkillsToolsForm from './skills-tools-form.svelte';
  import { Button } from '@cio/ui/base/button';
  import { courseApi } from '$features/course/api';
  import { generateSlug } from '@cio/utils/functions';
  import { openCoursePreview } from '$features/course/utils/course-preview';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { useSidebar } from '@cio/ui/base/sidebar';

  import type { Course } from '$features/course/utils/types';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    course: Course;
    courseId: string;
    syncCourseStore: (course: Course) => void;
    onClose?: () => void;
    selectedSectionKey?: LandingSectionKey | null;
  }

  let {
    course = $bindable(),
    courseId,
    syncCourseStore,
    onClose,
    selectedSectionKey = $bindable(null)
  }: Props = $props();

  const sidebar = useSidebar();
  let loading = $state(false);

  interface Section {
    key: LandingSectionKey;
    title: string;
    icon: Component;
    domId: string;
  }

  const sections: Section[] = $derived([
    {
      key: 'header',
      title: $t('course.navItem.landing_page.editor.title.header'),
      icon: HeaderIcon,
      domId: 'header'
    },
    {
      key: 'requirement',
      title: $t('course.navItem.landing_page.editor.title.requirement'),
      icon: ExerciseIcon,
      domId: 'requirement'
    },
    {
      key: 'description',
      title: $t('course.navItem.landing_page.editor.title.description'),
      icon: LessonIcon,
      domId: 'description'
    },
    {
      key: 'goals',
      title: $t('course.navItem.landing_page.editor.title.goals'),
      icon: GoalIcon,
      domId: 'goals'
    },
    {
      key: 'chips',
      title: $t('course.navItem.landing_page.editor.title.chips'),
      icon: ContentIcon,
      domId: 'course-chips'
    },
    {
      key: 'certificate',
      title: $t('course.navItem.landing_page.editor.title.certificate'),
      icon: CertificateIcon,
      domId: 'certificate'
    },
    {
      key: 'reviews',
      title: $t('course.navItem.landing_page.editor.title.reviews'),
      icon: ReviewIcon,
      domId: 'reviews'
    },
    {
      key: 'instructor',
      title: $t('course.navItem.landing_page.editor.title.instructor'),
      icon: PersonIcon,
      domId: 'instructor'
    },
    {
      key: 'pricing',
      title: $t('course.navItem.landing_page.editor.title.pricing'),
      icon: MoneyIcon,
      domId: 'pricing'
    }
  ]);

  const selectedSection = $derived(
    selectedSectionKey ? (sections.find((s) => s.key === selectedSectionKey) ?? null) : null
  );

  function handleClose() {
    if (!selectedSectionKey) {
      onClose?.();
      return;
    }

    selectedSectionKey = null;
  }

  function handleSectionSelect(key: LandingSectionKey) {
    return () => {
      selectedSectionKey = key;
      const section = sections.find((s) => s.key === key);
      if (section) {
        const el = document.getElementById(section.domId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
  }

  $effect(() => {
    if (!selectedSection) return;
    const el = document.getElementById(selectedSection.domId);
    if (el) {
      untrack(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  });

  async function handleSave() {
    loading = true;
    course.slug = course.slug || generateSlug(course.title, { appendTimestamp: true });

    const updatePayload = {
      ...course,
      type: course.type!,
      slug: course.slug!,
      isPublished: course.isPublished ?? undefined,
      overview: course.overview ?? undefined,
      compliance: course.compliance ?? undefined,
      certificate: course.certificate
        ? {
            ...course.certificate,
            isDownloadable: course.certificate.isDownloadable ?? undefined,
            theme: course.certificate.theme ?? undefined
          }
        : undefined
    } as TCourseUpdate;

    await courseApi.update(courseId, updatePayload);

    loading = false;
    syncCourseStore(course);
  }

  function handlePreview() {
    openCoursePreview({
      courseId,
      courseSlug: course.slug,
      currentOrgDomain: $currentOrgDomain
    });
  }

  function setter(value: unknown, setterKey: string) {
    if (typeof value === 'undefined') return;

    const _course = untrack(() => cloneDeep(course));
    set(_course, setterKey, value);

    course = _course;
  }
</script>

<Sidebar.Header
  class="flex flex-row! items-center {sidebar.open ? 'justify-between' : 'justify-center'} border-b px-2 py-2"
>
  {#if !selectedSection}
    {#if sidebar.open}
      <CloseButton onClick={handleClose} />

      <div class="flex items-center gap-1" data-open={sidebar.open} data-mobile={sidebar.isMobile}>
        <Button type="button" variant="outline" onclick={handleSave} {loading}>
          {$t('course.navItem.landing_page.editor.save')}
        </Button>
        <HoverableItem>
          {#snippet children(isHovered)}
            <IconButton onclick={handlePreview} disabled={loading} aria-label={$t('course.header.preview')}>
              <PreviewIcon {isHovered} size={16} />
            </IconButton>
          {/snippet}
        </HoverableItem>
      </div>
    {:else}
      <CloseButton onClick={handleClose} />
    {/if}
  {:else if sidebar.open || !sidebar.isMobile}
    <div class="flex items-center gap-2">
      <IconButton onclick={handleClose}>
        <ArrowLeftIcon size={16} />
      </IconButton>
      <h3 class="text-sm font-semibold">
        {selectedSection.title}
      </h3>
    </div>
  {:else}
    <IconButton onclick={handleClose} tooltip={selectedSection.title}>
      <ArrowLeftIcon size={16} />
    </IconButton>
  {/if}
</Sidebar.Header>

<Sidebar.Content class="flex-1 overflow-y-auto">
  {#if !selectedSection}
    <Sidebar.Group>
      <Sidebar.GroupLabel class="px-2">
        {$t('course.navItem.landing_page.editor.page_builder')}
      </Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each sections as section (section.key)}
            {@const SectionIcon = section.icon}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton onclick={handleSectionSelect(section.key)} tooltipContent={section.title}>
                <SectionIcon size={16} />
                <span>{section.title}</span>
                <ChevronRightIcon size={16} />
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  {:else}
    <div class="p-4">
      {#if selectedSection.key === 'header'}
        <HeaderForm bind:course />
      {:else if selectedSection.key === 'requirement'}
        <RequirementForm bind:course {setter} />
      {:else if selectedSection.key === 'description'}
        <DescriptionForm bind:course {setter} />
      {:else if selectedSection.key === 'goals'}
        <GoalsForm bind:course {setter} />
      {:else if selectedSection.key === 'chips'}
        <SkillsToolsForm bind:course {setter} />
      {:else if selectedSection.key === 'certificate'}
        <CertificateForm bind:course {setter} />
      {:else if selectedSection.key === 'reviews'}
        <ReviewsForm bind:course {setter} />
      {:else if selectedSection.key === 'instructor'}
        <InstructorForm bind:course {setter} />
      {:else if selectedSection.key === 'pricing'}
        <PricingForm bind:course {setter} />
      {/if}
    </div>
  {/if}
</Sidebar.Content>
