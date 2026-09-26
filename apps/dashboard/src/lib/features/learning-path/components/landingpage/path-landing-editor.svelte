<script lang="ts">
  import type { Component } from 'svelte';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import {
    HeaderIcon,
    ExerciseIcon,
    LessonIcon,
    GoalIcon,
    ContentIcon,
    CertificateIcon,
    ReviewIcon,
    PersonIcon,
    MoneyIcon,
    ExploreIcon,
    HoverableItem,
    PreviewIcon
  } from '@cio/ui/custom/moving-icons';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import { CloseButton, UnsavedChanges } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { learningPathApi } from '$features/learning-path/api';
  import { openPathPreview } from '../../utils/path-preview';
  import { currentOrgDomain, currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { ZPaymentLink } from '@cio/utils/validation/course';
  import { normalizeIntegerInput } from '@cio/utils/functions';
  import { INSTRUCTOR_ROLE_LABEL } from '@cio/utils/constants';
  import { resolveInitialPathInstructors, sanitizePathLandingPage } from '../../utils/landing-page-utils';
  import type { LearningPathDetail, UpdateLearningPathInput } from '../../utils/types';
  import type { TLandingPage } from '@cio/utils/validation/learning-path';

  import HeaderForm from './forms/header-form.svelte';
  import RequirementForm from './forms/requirement-form.svelte';
  import DescriptionForm from './forms/description-form.svelte';
  import GoalsForm from './forms/goals-form.svelte';
  import SkillsForm from './forms/skills-form.svelte';
  import CertificateForm from './forms/certificate-form.svelte';
  import ReviewsForm from './forms/reviews-form.svelte';
  import InstructorsForm from './forms/instructors-form.svelte';
  import PricingForm from './forms/pricing-form.svelte';
  import VisitorAccessForm from './forms/visitor-access-form.svelte';
  import FaqsForm from './forms/faqs-form.svelte';

  import type { LandingSectionKey } from '@cio/ui/custom/org-landing-page';

  interface Props {
    path: LearningPathDetail;
    onClose: () => void;
    selectedSectionKey?: LandingSectionKey | null;
  }

  let { path, onClose, selectedSectionKey = $bindable(null) }: Props = $props();

  const sidebar = useSidebar();
  let isSaving = $state(false);
  let showPaymentError = $state(false);

  // Initialize draft landing page.
  // If no instructors were saved yet, pre-populate from the path's courses
  // (falling back to org/user) so saves never block on missing instructors.
  // svelte-ignore state_referenced_locally
  let landingPage = $state<TLandingPage>({ ...(path.landingPage ?? {}) });

  // Seed derived instructors once at init when the draft has none saved.
  {
    const initialInstructors = resolveInitialPathInstructors(path, {
      fallbackOrg: $currentOrg,
      fallbackUser: $profile,
      defaultRole: $t('learningPath.landing.instructors.default_role') || INSTRUCTOR_ROLE_LABEL.INSTRUCTOR
    });

    if (initialInstructors) {
      landingPage = { ...landingPage, instructors: initialInstructors };
    }
  }
  // svelte-ignore state_referenced_locally
  let initialSnapshot = $state(JSON.stringify(path.landingPage ?? {}));
  // svelte-ignore state_referenced_locally
  let currentPathId = $state(path.id);

  // svelte-ignore state_referenced_locally
  let pathCost = $state(Number(path.cost) || 0);
  // svelte-ignore state_referenced_locally
  let pathCurrency = $state<'USD' | 'NGN'>((path.currency as string) === 'NGN' ? 'NGN' : 'USD');
  // svelte-ignore state_referenced_locally
  let initialPricingSnapshot = $state(
    JSON.stringify({
      cost: Number(path.cost) || 0,
      currency: (path.currency as string) === 'NGN' ? 'NGN' : 'USD'
    })
  );

  const isPaid = $derived(Boolean(landingPage.paymentEnabled));
  const paymentLink = $derived((landingPage.paymentLink ?? '').trim());
  const isPaymentLinkEmpty = $derived(isPaid && !paymentLink);
  const isPaymentLinkInvalid = $derived(Boolean(isPaid && paymentLink && !ZPaymentLink.safeParse(paymentLink).success));

  // eslint-disable-next-line svelte/prefer-writable-derived -- must be writable: bound to UnsavedChanges
  let hasUnsavedChanges = $state(false);

  $effect(() => {
    const isLandingPageDirty = JSON.stringify(landingPage) !== initialSnapshot;
    const isPricingDirty = JSON.stringify({ cost: pathCost, currency: pathCurrency }) !== initialPricingSnapshot;
    hasUnsavedChanges = isLandingPageDirty || isPricingDirty;
  });

  $effect(() => {
    if (path.id !== currentPathId) {
      currentPathId = path.id;
      const nextDraft: TLandingPage = { ...(path.landingPage ?? {}) };
      const initialInstructors = resolveInitialPathInstructors(path, {
        fallbackOrg: $currentOrg,
        fallbackUser: $profile,
        defaultRole: $t('learningPath.landing.instructors.default_role') || INSTRUCTOR_ROLE_LABEL.INSTRUCTOR
      });

      if (initialInstructors) {
        nextDraft.instructors = initialInstructors;
      }

      landingPage = nextDraft;
      initialSnapshot = JSON.stringify(path.landingPage ?? {});
      pathCost = Number(path.cost) || 0;
      pathCurrency = (path.currency as string) === 'NGN' ? 'NGN' : 'USD';
      initialPricingSnapshot = JSON.stringify({
        cost: pathCost,
        currency: pathCurrency
      });
      selectedSectionKey = null;
      hasUnsavedChanges = false;
      showPaymentError = false;
    }
  });

  function patchLandingPage(patch: Partial<TLandingPage>) {
    landingPage = { ...landingPage, ...patch };
  }

  interface Section {
    key: LandingSectionKey;
    title: string;
    icon: Component;
  }

  // Order matches courses 100%: header → requirement → description → goals →
  // skills → certificate → reviews → instructors → pricing, then path-only access/faqs
  const sections: Section[] = $derived([
    {
      key: 'header',
      title: $t('learningPath.landing.header.title'),
      icon: HeaderIcon
    },
    {
      key: 'requirement',
      title: $t('learningPath.landing.requirement.title'),
      icon: ExerciseIcon
    },
    {
      key: 'description',
      title: $t('learningPath.landing.description.title'),
      icon: LessonIcon
    },
    {
      key: 'goals',
      title: $t('learningPath.landing.goals.title'),
      icon: GoalIcon
    },
    {
      key: 'skills',
      title: $t('learningPath.landing.skills.title'),
      icon: ContentIcon
    },
    {
      key: 'certificate',
      title: $t('learningPath.landing.certificate.title'),
      icon: CertificateIcon
    },
    {
      key: 'reviews',
      title: $t('learningPath.landing.reviews.title'),
      icon: ReviewIcon
    },
    {
      key: 'instructors',
      title: $t('learningPath.landing.instructors.title'),
      icon: PersonIcon
    },
    {
      key: 'pricing',
      title: $t('learningPath.landing.pricing.title'),
      icon: MoneyIcon
    },
    {
      key: 'access',
      title: $t('learningPath.landing.access.title'),
      icon: ExploreIcon
    },
    {
      key: 'faqs',
      title: $t('learningPath.landing.faqs.title'),
      icon: ContentIcon
    }
  ]);

  const selectedSection = $derived(
    selectedSectionKey ? (sections.find((section) => section.key === selectedSectionKey) ?? null) : null
  );

  function handleBackToSections() {
    if (selectedSectionKey === 'pricing') {
      if (isPaymentLinkEmpty) {
        showPaymentError = true;
        snackbar.error('learningPath.landing.pricing.payment_required');
        return;
      }
      if (isPaymentLinkInvalid) {
        showPaymentError = true;
        snackbar.error('learningPath.landing.pricing.payment_invalid_url');
        return;
      }
    }
    showPaymentError = false;
    selectedSectionKey = null;
  }

  function handlePreview() {
    openPathPreview({
      pathId: path.id,
      pathSlug: path.slug,
      currentOrgDomain: $currentOrgDomain
    });
  }

  async function handleSave() {
    if (!path?.publicId) return;

    if (isPaymentLinkEmpty) {
      showPaymentError = true;
      snackbar.error('learningPath.landing.pricing.payment_required');
      selectedSectionKey = 'pricing';
      return;
    }

    if (isPaymentLinkInvalid) {
      showPaymentError = true;
      snackbar.error('learningPath.landing.pricing.payment_invalid_url');
      selectedSectionKey = 'pricing';
      return;
    }

    const payload = sanitizePathLandingPage(landingPage);

    isSaving = true;
    try {
      const updateData: UpdateLearningPathInput = {
        landingPage: payload,
        cost: normalizeIntegerInput(pathCost),
        currency: pathCurrency
      };
      const updated = await learningPathApi.update(path.publicId, updateData, { showSuccessToast: false });
      if (updated) {
        landingPage = { ...(updated.landingPage ?? payload) };
        initialSnapshot = JSON.stringify(landingPage);
        path.cost = updated.cost;
        path.currency = updated.currency;
        pathCost = Number(updated.cost) || 0;
        pathCurrency = (updated.currency as string) === 'NGN' ? 'NGN' : 'USD';
        initialPricingSnapshot = JSON.stringify({
          cost: pathCost,
          currency: pathCurrency
        });
        hasUnsavedChanges = false;
        showPaymentError = false;
        snackbar.success('learningPath.snackbar.landing_saved');
      }
    } catch (error) {
      console.error('Failed to save learning path landing page', error);
      snackbar.error('learningPath.snackbar.landing_save_failed');
    } finally {
      isSaving = false;
    }
  }
</script>

<UnsavedChanges bind:hasUnsavedChanges />

<Sidebar.Header
  class="flex flex-row! items-center {sidebar.open ? 'justify-between' : 'justify-center'} border-b px-2 py-2"
>
  {#if !selectedSection}
    {#if sidebar.open}
      <CloseButton onClick={onClose} />

      <div class="flex items-center gap-1" data-open={sidebar.open} data-mobile={sidebar.isMobile}>
        <Button
          type="button"
          variant="outline"
          testId="path-landing-save"
          onclick={handleSave}
          loading={isSaving}
          disabled={!hasUnsavedChanges || isSaving || isPaymentLinkEmpty}
        >
          {$t('learningPath.landing.save')}
        </Button>
        <HoverableItem>
          {#snippet children(isHovered)}
            <IconButton onclick={handlePreview} disabled={isSaving} aria-label={$t('learningPath.landing.preview')}>
              <PreviewIcon {isHovered} size={16} />
            </IconButton>
          {/snippet}
        </HoverableItem>
      </div>
    {:else}
      <CloseButton onClick={onClose} />
    {/if}
  {:else if sidebar.open || !sidebar.isMobile}
    <div class="flex items-center gap-2">
      <IconButton onclick={handleBackToSections} aria-label={$t('common.back')}>
        <ArrowLeftIcon size={16} />
      </IconButton>
      <h3 class="truncate text-sm font-semibold">
        {selectedSection.title}
      </h3>
    </div>
    <HoverableItem>
      {#snippet children(isHovered)}
        <IconButton onclick={handlePreview} disabled={isSaving} aria-label={$t('learningPath.landing.preview')}>
          <PreviewIcon {isHovered} size={16} />
        </IconButton>
      {/snippet}
    </HoverableItem>
  {:else}
    <IconButton onclick={handleBackToSections} tooltip={selectedSection.title}>
      <ArrowLeftIcon size={16} />
    </IconButton>
  {/if}
</Sidebar.Header>

<Sidebar.Content class="flex-1 overflow-y-auto">
  {#if !selectedSection}
    <Sidebar.Group>
      <Sidebar.GroupLabel class="px-2">
        {$t('learningPath.landing.page_builder')}
      </Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each sections as section (section.key)}
            {@const SectionIcon = section.icon}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton onclick={() => (selectedSectionKey = section.key)} tooltipContent={section.title}>
                <SectionIcon size={16} />
                <span class="text-sm">{section.title}</span>
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
        <HeaderForm {landingPage} {path} onChange={patchLandingPage} />
      {:else if selectedSection.key === 'requirement'}
        <RequirementForm {landingPage} onChange={patchLandingPage} />
      {:else if selectedSection.key === 'description'}
        <DescriptionForm {landingPage} onChange={patchLandingPage} />
      {:else if selectedSection.key === 'goals'}
        <GoalsForm {landingPage} onChange={patchLandingPage} />
      {:else if selectedSection.key === 'skills'}
        <SkillsForm {landingPage} onChange={patchLandingPage} />
      {:else if selectedSection.key === 'certificate'}
        <CertificateForm {landingPage} onChange={patchLandingPage} />
      {:else if selectedSection.key === 'reviews'}
        <ReviewsForm {landingPage} onChange={patchLandingPage} />
      {:else if selectedSection.key === 'instructors'}
        <InstructorsForm {landingPage} {path} onChange={patchLandingPage} />
      {:else if selectedSection.key === 'pricing'}
        <PricingForm
          {landingPage}
          {path}
          bind:cost={pathCost}
          bind:currency={pathCurrency}
          {showPaymentError}
          onChange={patchLandingPage}
        />
      {:else if selectedSection.key === 'access'}
        <VisitorAccessForm {landingPage} onChange={patchLandingPage} />
      {:else if selectedSection.key === 'faqs'}
        <FaqsForm {landingPage} onChange={patchLandingPage} />
      {/if}
    </div>
  {/if}
</Sidebar.Content>
