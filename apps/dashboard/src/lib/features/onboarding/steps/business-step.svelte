<script lang="ts">
  import { onMount, tick, type Snippet } from 'svelte';
  import * as Accordion from '@cio/ui/base/accordion';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Field from '@cio/ui/base/field';
  import { ToggleGroup, ToggleGroupItem } from '@cio/ui/base/toggle-group';
  import { Button } from '@cio/ui/base/button';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { InputField } from '@cio/ui/custom/input-field';
  import { DomainInput } from '@cio/ui/custom/domain-input';
  import { HighlightText } from '@cio/ui/custom/highlight-text';
  import { RadioOptionCardGroup } from '@cio/ui/custom/radio-option-card';
  import { TENANT_ROOT_DOMAIN } from '@cio/utils/constants';
  import { normalizeWebsiteUrl, getWebsiteHost } from '@cio/utils/validation/onboarding';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
  import LifeBuoyIcon from '@lucide/svelte/icons/life-buoy';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
  import { generateSitename } from '$lib/utils/functions/org';
  import { t } from '$lib/utils/functions/translations';
  import { RangePicker } from '$features/ui';
  import { onboardingFlowApi } from '$features/onboarding/api/onboarding-flow.svelte';
  import NameGreeting from '$features/onboarding/components/name-greeting.svelte';
  import SiteNameStatus from '$features/onboarding/components/site-name-status.svelte';
  import SplitShell from '$features/onboarding/components/split-shell.svelte';
  import {
    BUSINESS_COMPANY_SIZE_LABELS,
    BUSINESS_MORE_ROLES,
    BUSINESS_QUICK_ROLES,
    businessBlockLabel,
    businessDraftFromAnswers,
    businessSubmitFromAnswers,
    emptyBusinessAnswers,
    readBusinessAnswers,
    type BusinessAnswers
  } from '$features/onboarding/utils/business-answers';
  import {
    AI_PROVIDERS,
    AI_SOURCE_VALUE,
    COMPANY_SIZES,
    LEARNING_METHODS,
    ONBOARDING_ADVANCE_DELAY_MS,
    ONBOARDING_DRAFT_SAVE_DEBOUNCE_MS,
    ONBOARDING_FIRST_OUTCOME_OPTIONS,
    ONBOARDING_JOB_ROLE_OPTION_LABELS,
    ONBOARDING_STEP_LABELS,
    OTHER_VALUE,
    SOURCES
  } from '$features/onboarding/utils/constants';

  const ITEM_IDS = ['academy', 'outcome', 'business', 'team', 'learning', 'source'] as const;
  type ItemId = (typeof ITEM_IDS)[number];
  type RoleId = keyof typeof ONBOARDING_JOB_ROLE_OPTION_LABELS;

  const REQUIRED_ITEMS: ItemId[] = ['academy', 'outcome', 'business', 'team', 'learning'];
  const LAST_ITEM: ItemId = ITEM_IDS[ITEM_IDS.length - 1];
  const ITEM_NUMBERS: Record<ItemId, string> = {
    academy: '01',
    outcome: '02',
    business: '03',
    team: '04',
    learning: '05',
    source: '06'
  };
  const MORE_ROLE_ICONS = {
    marketing: MegaphoneIcon,
    support: LifeBuoyIcon,
    operations: SettingsIcon,
    other: EllipsisIcon
  } as const;
  const SAVE_RETRY_BASE_MS = 1000;
  const SAVE_RETRY_MAX_MS = 30000;
  const BUSINESS_DESCRIPTION_LIMIT = 1000;
  const FULLNAME_MIN_LENGTH = 5;
  const SITE_NAME_MIN_LENGTH = 5;
  const CHIP_CLASS =
    'h-auto min-w-0 rounded-full border ui:border-border ui:bg-card py-2 pl-[11px] pr-[14px] text-[13.5px] font-normal ui:text-foreground whitespace-nowrap hover:border-[color-mix(in_oklab,var(--primary)_45%,var(--border))] hover:bg-(--card) hover:text-(--foreground) data-[state=on]:border-(--primary) data-[state=on]:bg-[color-mix(in_oklab,var(--primary)_8%,var(--card))] data-[state=on]:text-(--foreground)';
  const CHIP_GROUP_CLASS = 'w-full flex-wrap justify-start gap-2';
  const answers = $state<BusinessAnswers>(emptyBusinessAnswers());
  const academyErrors = $state({ fullname: '', orgName: '', siteName: '' });
  let openItem = $state<ItemId | ''>('');
  let isSiteNameTouched = $state(false);
  let isSourceSkipped = $state(false);
  let websiteError = $state('');
  let isSubmitting = $state(false);
  let isSaveFailing = $state(false);
  let missingMessage = $state('');
  let continueButton = $state<HTMLElement | null>(null);
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  let advanceTimer: ReturnType<typeof setTimeout> | undefined;
  let saveRetryDelay = SAVE_RETRY_BASE_MS;

  const hasAi = $derived(onboardingFlowApi.state?.capabilities.ai ?? true);
  const domainSuffix = `.${TENANT_ROOT_DOMAIN}`;
  const descriptionLength = $derived(answers.description?.length ?? 0);
  const contextMode = $derived(answers.contextMode === 'description' ? 'description' : 'website');
  const moreRoleSelected = $derived(BUSINESS_MORE_ROLES.find((role) => role === answers.jobRole));

  function isReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isFullnameValid(value: string) {
    return value.trim().length >= FULLNAME_MIN_LENGTH;
  }

  function isOrgNameValid(value: string) {
    const trimmed = value.trim();

    return trimmed.length >= FULLNAME_MIN_LENGTH && !/^-|-$/.test(trimmed);
  }

  function isSiteNameValid(value: string) {
    return value.length >= SITE_NAME_MIN_LENGTH && /^[a-z0-9-]+$/.test(value) && !/^-|-$/.test(value);
  }

  function isAnswered(item: ItemId): boolean {
    switch (item) {
      case 'academy':
        return (
          isFullnameValid(answers.fullname) && isOrgNameValid(answers.orgName) && isSiteNameValid(answers.siteName)
        );
      case 'outcome':
        return Boolean(answers.firstOutcome);
      case 'business':
        if (answers.contextMode === 'none') return true;
        if (answers.contextMode === 'description') return answers.description.trim().length >= 20;

        return Boolean(answers.websiteUrl && getWebsiteHost(answers.websiteUrl));
      case 'team':
        return Boolean(answers.jobRole && answers.companySize);
      case 'learning':
        return Boolean(answers.learningMethod);
      case 'source':
        if (answers.source === AI_SOURCE_VALUE) {
          return (
            Boolean(answers.aiProvider) &&
            (answers.aiProvider !== OTHER_VALUE || Boolean(answers.aiProviderOther.trim()))
          );
        }
        if (answers.source === OTHER_VALUE) return Boolean(answers.sourceOther.trim());

        return Boolean(answers.source);
    }
  }

  function optionLabel(options: { value: string; label: string }[], value: string) {
    const option = options.find((candidate) => candidate.value === value);

    return option ? $t(option.label) : '';
  }

  function roleLabel(role: string) {
    return role in ONBOARDING_JOB_ROLE_OPTION_LABELS ? $t(ONBOARDING_JOB_ROLE_OPTION_LABELS[role as RoleId]) : '';
  }

  function summary(item: ItemId): string {
    switch (item) {
      case 'academy':
        return answers.orgName.trim();
      case 'outcome':
        return optionLabel(ONBOARDING_FIRST_OUTCOME_OPTIONS, answers.firstOutcome);
      case 'business':
        return businessBlockLabel(answers, $t('onboarding.v2.business.skipped'));
      case 'team':
        return [roleLabel(answers.jobRole), sizeLabel(answers.companySize)].filter(Boolean).join(', ');
      case 'learning':
        return optionLabel(LEARNING_METHODS, answers.learningMethod);
      case 'source': {
        if (answers.source === OTHER_VALUE) return answers.sourceOther.trim();

        const provider = answers.source === AI_SOURCE_VALUE ? optionLabel(AI_PROVIDERS, answers.aiProvider) : '';

        return [optionLabel(SOURCES, answers.source), provider].filter(Boolean).join(', ');
      }
    }
  }

  function sizeLabel(value: string) {
    return value in BUSINESS_COMPANY_SIZE_LABELS ? $t(BUSINESS_COMPANY_SIZE_LABELS[value]) : '';
  }

  const outcomeOptions = $derived(
    ONBOARDING_FIRST_OUTCOME_OPTIONS.map((option) => ({
      id: `onboarding-outcome-${option.value}`,
      value: option.value,
      title: $t(option.label),
      description: $t(option.hint)
    }))
  );

  const learningOptions = $derived(LEARNING_METHODS.filter((option) => option.value !== OTHER_VALUE));

  const contextOptions = $derived([
    { value: 'website', label: $t('onboarding.v2.business.context.website') },
    { value: 'description', label: $t('onboarding.v2.business.context.description') }
  ]);

  function scheduleSave(delay = ONBOARDING_DRAFT_SAVE_DEBOUNCE_MS) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void save(), delay);
  }

  async function save() {
    await onboardingFlowApi.saveBusinessDraft(businessDraftFromAnswers(answers));

    if (!onboardingFlowApi.lastError) {
      isSaveFailing = false;
      saveRetryDelay = SAVE_RETRY_BASE_MS;

      return;
    }

    isSaveFailing = true;
    scheduleSave(saveRetryDelay);
    saveRetryDelay = Math.min(saveRetryDelay * 2, SAVE_RETRY_MAX_MS);
  }

  function changed() {
    saveRetryDelay = SAVE_RETRY_BASE_MS;
    scheduleSave();
  }

  async function setOpenItem(next: ItemId | '', { focus = true } = {}) {
    clearTimeout(advanceTimer);

    openItem = next;
    missingMessage = '';
    if (!next) return;

    await tick();
    document
      .querySelector(`[data-business-item="${next}"]`)
      ?.scrollIntoView({ behavior: isReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });

    if (focus && next === 'business') focusContextField();
  }

  function focusContextField() {
    const name = contextMode === 'description' ? 'onboarding-business-description' : 'onboarding-business-website';

    document.querySelector<HTMLElement>(`[name="${name}"]`)?.focus({ preventScroll: true });
  }

  function nextItemAfter(from: ItemId): ItemId | '' {
    const fromIndex = ITEM_IDS.indexOf(from);
    const ordered = [...ITEM_IDS.slice(fromIndex + 1), ...ITEM_IDS.slice(0, fromIndex + 1)];

    return ordered.find((item) => !isAnswered(item) && !(item === 'source' && isSourceSkipped)) ?? '';
  }

  function advanceFrom(item: ItemId) {
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(
      () => {
        const next = nextItemAfter(item);

        void setOpenItem(next);
        if (!next) continueButton?.focus({ preventScroll: true });
      },
      isReducedMotion() ? 0 : ONBOARDING_ADVANCE_DELAY_MS
    );
  }

  function choose(item: ItemId, key: 'firstOutcome' | 'jobRole' | 'companySize' | 'learningMethod', value: string) {
    if (!value) return;

    answers[key] = value;
    changed();

    if (isAnswered(item)) advanceFrom(item);
  }

  function handleFullnameInput(value: string) {
    answers.fullname = value;
    academyErrors.fullname = '';
    changed();
  }

  function handleOrgNameInput(value: string) {
    answers.orgName = value;
    academyErrors.orgName = '';

    if (!isSiteNameTouched) {
      answers.siteName = generateSitename(value);
      academyErrors.siteName = '';
    }

    changed();
  }

  function handleSiteNameInput(value: string) {
    isSiteNameTouched = true;
    answers.siteName = value.toLowerCase();
    academyErrors.siteName = '';
    changed();
  }

  function validateAcademy() {
    academyErrors.fullname = '';
    academyErrors.orgName = '';
    academyErrors.siteName = '';

    if (!isFullnameValid(answers.fullname)) {
      academyErrors.fullname = 'onboarding.v2.workspace.errors.fullname';
    }

    if (answers.orgName.trim().length < FULLNAME_MIN_LENGTH) {
      academyErrors.orgName = 'validations.organization_name.min_char';
    } else if (/^-|-$/.test(answers.orgName.trim())) {
      academyErrors.orgName = 'validations.organization_name.hyphen_rule';
    }

    if (answers.siteName.length < SITE_NAME_MIN_LENGTH) {
      academyErrors.siteName = 'validations.site_name.min_char';
    } else if (/^[-]|[-]$/.test(answers.siteName)) {
      academyErrors.siteName = 'validations.site_name.hyphen_rule';
    } else if (!/^[a-z0-9-]+$/.test(answers.siteName)) {
      academyErrors.siteName = 'validations.site_name.characters';
    }

    return !academyErrors.fullname && !academyErrors.orgName && !academyErrors.siteName;
  }

  function finishAcademyOnEnter(event: KeyboardEvent) {
    if (event.key !== 'Enter' || !isAnswered('academy')) return;

    event.preventDefault();
    advanceFrom('academy');
  }

  function chooseContextMode(value: string) {
    if (value !== 'website' && value !== 'description') return;

    answers.contextMode = value;
    websiteError = '';
    changed();
    void tick().then(focusContextField);
  }

  function checkWebsite() {
    const isInvalid = contextMode === 'website' && answers.websiteUrl.trim() && !getWebsiteHost(answers.websiteUrl);
    websiteError = isInvalid ? $t('onboarding.v2.business.errors.website_invalid') : '';

    return !isInvalid;
  }

  function handleWebsiteInput(value: string) {
    answers.websiteUrl = value;
    answers.contextMode = 'website';
    if (websiteError) checkWebsite();
    changed();
  }

  function handleDescriptionInput() {
    answers.contextMode = 'description';
    changed();
  }

  function submitWebsite() {
    if (!checkWebsite()) {
      missingMessage = '';

      return;
    }

    if (!isAnswered('business')) {
      missingMessage = $t('onboarding.v2.business.missing.business');

      return;
    }

    missingMessage = '';
    advanceFrom('business');
  }

  function skipWebsite() {
    answers.contextMode = 'none';
    answers.websiteUrl = '';
    answers.description = '';
    websiteError = '';
    missingMessage = '';
    changed();
    advanceFrom('business');
  }

  function chooseSource(value: string) {
    if (!value) return;

    answers.source = value;
    if (value !== OTHER_VALUE) answers.sourceOther = '';
    if (value !== AI_SOURCE_VALUE) {
      answers.aiProvider = '';
      answers.aiProviderOther = '';
    }
    isSourceSkipped = false;
    changed();

    if (isAnswered('source')) {
      advanceFrom('source');

      return;
    }

    void tick().then(() =>
      document.querySelector<HTMLElement>('[name="onboarding-business-source-other"]')?.focus({ preventScroll: true })
    );
  }

  function chooseProvider(value: string) {
    if (!value) return;

    answers.aiProvider = value;
    if (value !== OTHER_VALUE) answers.aiProviderOther = '';
    changed();

    if (isAnswered('source')) {
      advanceFrom('source');

      return;
    }

    void tick().then(() =>
      document.querySelector<HTMLElement>('[name="onboarding-business-ai-other"]')?.focus({ preventScroll: true })
    );
  }

  function finishSourceOnEnter(event: KeyboardEvent) {
    if (event.key !== 'Enter' || !isAnswered('source')) return;

    event.preventDefault();
    advanceFrom('source');
  }

  function skipSource() {
    isSourceSkipped = true;
    void setOpenItem('');
    continueButton?.focus({ preventScroll: true });
  }

  async function submit() {
    const businessSaved = await onboardingFlowApi.submitBusiness(businessSubmitFromAnswers(answers), {
      navigate: false
    });

    if (!businessSaved) {
      const businessErrors = onboardingFlowApi.errors;
      if (businessErrors && Object.keys(businessErrors).length > 0) {
        missingMessage = Object.values(businessErrors)[0];
      }

      return;
    }

    const workspaceSaved = await onboardingFlowApi.submitWorkspace({
      fullname: answers.fullname.trim(),
      orgName: answers.orgName.trim(),
      siteName: answers.siteName
    });

    if (workspaceSaved) return;

    const siteNameError = onboardingFlowApi.errors.siteName;
    if (siteNameError) {
      academyErrors.siteName = siteNameError;
      await setOpenItem('academy', { focus: false });
    }
  }

  /** Continue walks the accordion one step at a time; only the last item validates and submits. */
  async function handleContinue() {
    missingMessage = '';

    if (openItem && openItem !== LAST_ITEM) {
      await setOpenItem(ITEM_IDS[ITEM_IDS.indexOf(openItem) + 1]);

      return;
    }

    const missing = REQUIRED_ITEMS.find((item) => !isAnswered(item));
    if (missing) {
      await setOpenItem(missing, { focus: false });

      if (missing === 'academy') {
        validateAcademy();
        await save();

        return;
      }

      if (missing === 'business' && !checkWebsite()) return;

      missingMessage = $t(`onboarding.v2.business.missing.${missing}`);
      await save();

      return;
    }

    if (answers.contextMode === 'website' && answers.websiteUrl && !normalizeWebsiteUrl(answers.websiteUrl)) {
      await setOpenItem('business', { focus: false });
      checkWebsite();

      return;
    }

    isSubmitting = true;

    try {
      await submit();
    } finally {
      isSubmitting = false;
    }
  }

  function handlePageHide() {
    clearTimeout(saveTimer);
    void onboardingFlowApi.flushBusinessDraft(businessDraftFromAnswers(answers));
  }

  let hydratedAnswers = false;

  $effect(() => {
    const stored = onboardingFlowApi.state?.business;
    if (hydratedAnswers || !stored) return;

    hydratedAnswers = true;
    Object.assign(answers, readBusinessAnswers(stored));

    const current = onboardingFlowApi.state;
    const signupPlaceholderName = current?.email?.split('@')[0] ?? '';
    const profileName = current?.fullname && current.fullname !== signupPlaceholderName ? current.fullname : '';
    if (!answers.fullname) answers.fullname = profileName;
    if (!answers.orgName) answers.orgName = current?.organization?.name ?? '';
    if (!answers.siteName) answers.siteName = current?.organization?.siteName ?? '';

    isSiteNameTouched = Boolean(current?.organization?.siteName);
    openItem = REQUIRED_ITEMS.find((item) => !isAnswered(item)) ?? '';
  });

  onMount(() => {
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      clearTimeout(saveTimer);
      clearTimeout(advanceTimer);
    };
  });
</script>

<svelte:head>
  <title>{$t(ONBOARDING_STEP_LABELS.business)}</title>
</svelte:head>

{#snippet itemHeader(item: ItemId, title: string, optional: boolean)}
  {@const isOpen = openItem === item}
  {@const isDone = isAnswered(item)}
  {@const itemSummary = (isDone || (item === 'source' && isSourceSkipped)) && !isOpen ? summary(item) : ''}
  <span class="ui:text-muted-foreground font-mono text-[11px] tracking-[0.1em]">{ITEM_NUMBERS[item]}</span>
  <span
    class="min-w-0 text-base font-bold tracking-[-0.02em] {isOpen || isDone
      ? 'ui:text-foreground'
      : 'ui:text-muted-foreground'}"
  >
    {title}
  </span>
  {#if optional}
    <span
      class="ui:border-border ui:text-muted-foreground shrink-0 rounded-full border px-2 py-px text-xs font-medium whitespace-nowrap"
    >
      {$t('onboarding.v2.business.optional')}
    </span>
  {/if}
  {#if isDone}
    <span class="inline-flex items-center {isOpen ? 'ml-auto' : ''}">
      <span class="ui:bg-primary ui:text-primary-foreground inline-grid size-[18px] place-items-center rounded-full">
        <CheckIcon class="custom size-[11px]" strokeWidth={3} aria-hidden="true" />
      </span>
      <span class="sr-only">{$t('onboarding.v2.business.answered')}</span>
    </span>
  {/if}
  <span class="ui:text-muted-foreground ml-auto min-w-0 truncate text-[13px] font-normal max-[520px]:hidden">
    {itemSummary}
  </span>
{/snippet}

{#snippet item(id: ItemId, title: string, optional: boolean, body: Snippet)}
  <Accordion.Item
    value={id}
    data-business-item={id}
    class="ui:bg-card rounded-[14px] border transition-colors last:border {openItem === id
      ? 'ui:border-primary'
      : 'ui:border-border'}"
  >
    <Accordion.Trigger
      class="items-center justify-start gap-3 rounded-[14px] px-5 py-4 text-base font-normal hover:no-underline [&>svg]:hidden"
    >
      {@render itemHeader(id, title, optional)}
    </Accordion.Trigger>
    <Accordion.Content class="ui:border-border mx-5 grid gap-[18px] border-t pt-[18px] pb-5">
      {@render body()}
    </Accordion.Content>
  </Accordion.Item>
{/snippet}

{#snippet academyBody()}
  <NameGreeting name={answers.fullname} />

  <InputField
    label={$t('onboarding.v2.workspace.fullname_label')}
    placeholder={$t('onboarding.v2.workspace.fullname_placeholder')}
    name="onboarding-business-fullname"
    testId="onboarding-business-fullname"
    className="gap-1.5"
    bind:value={answers.fullname}
    onInput={(event) => handleFullnameInput(event.currentTarget.value)}
    onKeyDown={finishAcademyOnEnter}
    errorMessage={academyErrors.fullname ? $t(academyErrors.fullname) : undefined}
    helperMessage={$t('onboarding.v2.workspace.fullname_hint')}
  />

  <InputField
    label={$t('onboarding.v2.workspace.org_name_label')}
    placeholder={$t('onboarding.v2.workspace.org_name_placeholder')}
    name="onboarding-business-org-name"
    testId="onboarding-business-orgName"
    autoComplete={false}
    className="gap-1.5"
    bind:value={answers.orgName}
    onInput={(event) => handleOrgNameInput(event.currentTarget.value)}
    onKeyDown={finishAcademyOnEnter}
    errorMessage={academyErrors.orgName ? $t(academyErrors.orgName) : undefined}
  />

  <Field.Field>
    <Field.Label for="onboarding-business-site-name">{$t('onboarding.v2.workspace.site_name_label')}</Field.Label>
    <DomainInput
      id="onboarding-business-site-name"
      value={answers.siteName}
      prefix=""
      suffix={domainSuffix}
      placeholder={$t('onboarding.v2.workspace.site_name_placeholder')}
      data-testid="onboarding-business-siteName"
      oninput={(event) => handleSiteNameInput((event.currentTarget as HTMLInputElement).value)}
      onkeydown={finishAcademyOnEnter}
    />
    <SiteNameStatus siteName={answers.siteName} />
    {#if academyErrors.siteName}
      <Field.Error>{$t(academyErrors.siteName)}</Field.Error>
    {/if}
  </Field.Field>
{/snippet}

{#snippet outcomeBody()}
  <div data-testid="onboarding-business-outcome">
    <RadioOptionCardGroup
      bind:value={answers.firstOutcome}
      options={outcomeOptions}
      variant="tile"
      onChange={(value) => choose('outcome', 'firstOutcome', value)}
    />
  </div>
{/snippet}

{#snippet businessBody()}
  <p class="ui:text-muted-foreground text-[13.5px] leading-normal">
    {$t(hasAi ? 'onboarding.v2.business.context_hint' : 'onboarding.v2.business.no_ai_hint')}
  </p>
  <div data-testid="onboarding-business-context">
    <RangePicker
      value={contextMode}
      options={contextOptions}
      label={$t('onboarding.v2.business.items.business')}
      onChange={chooseContextMode}
      testId="onboarding-business-context-mode"
    />
  </div>

  {#if contextMode === 'website'}
    <div class="flex flex-col gap-2">
      <InputField
        label={$t('onboarding.v2.business.website_label')}
        placeholder={$t('onboarding.v2.business.website_placeholder')}
        name="onboarding-business-website"
        value={answers.websiteUrl}
        onInput={(event) => handleWebsiteInput(event.currentTarget.value)}
        onBlur={checkWebsite}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;

          event.preventDefault();
          submitWebsite();
        }}
        errorMessage={websiteError}
      />
      {#if websiteError}
        <Button variant="ghost" size="sm" class="w-fit" onclick={() => chooseContextMode('description')}>
          {$t('onboarding.v2.business.describe_instead')}
        </Button>
      {/if}
    </div>
  {:else}
    <TextareaField
      label={$t('onboarding.v2.business.description_label')}
      placeholder={$t('onboarding.v2.business.description_placeholder')}
      name="onboarding-business-description"
      bind:value={answers.description}
      maxlength={BUSINESS_DESCRIPTION_LIMIT}
      rows={3}
      oninput={handleDescriptionInput}
      helperMessage={$t('onboarding.v2.business.description_helper')}
    >
      {#snippet labelAction()}
        <span class="ui:text-muted-foreground text-xs">
          {descriptionLength}/{BUSINESS_DESCRIPTION_LIMIT}
        </span>
      {/snippet}
    </TextareaField>
  {/if}

  <div class="flex flex-wrap justify-end gap-2">
    <Button variant="ghost" size="sm" onclick={skipWebsite}>{$t('onboarding.v2.business.skip_analysis')}</Button>
    <Button size="sm" onclick={submitWebsite}>{$t('onboarding.v2.business.next')}</Button>
  </div>
{/snippet}

{#snippet teamBody()}
  <Field.Field>
    <Field.Label id="onboarding-business-role-label">{$t('onboarding.v2.business.role_label')}</Field.Label>
    <div class="flex flex-wrap gap-2" data-testid="onboarding-business-role">
      <ToggleGroup
        type="single"
        value={answers.jobRole}
        onValueChange={(value) => choose('team', 'jobRole', value)}
        aria-labelledby="onboarding-business-role-label"
        class="contents"
      >
        {#each BUSINESS_QUICK_ROLES as role (role)}
          <ToggleGroupItem value={role} class={CHIP_CLASS}>{roleLabel(role)}</ToggleGroupItem>
        {/each}
      </ToggleGroup>
      <DropdownMenu.DropdownMenu>
        <DropdownMenu.Trigger
          aria-pressed={Boolean(moreRoleSelected)}
          data-pressed={moreRoleSelected ? 'true' : 'false'}
          class="ui:border-border ui:bg-card ui:text-foreground inline-flex items-center gap-[7px] rounded-full border py-2 pr-[14px] pl-[11px] text-[13.5px] whitespace-nowrap transition-colors hover:border-[color-mix(in_oklab,var(--primary)_45%,var(--border))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ring) data-[pressed=true]:border-(--primary) data-[pressed=true]:bg-[color-mix(in_oklab,var(--primary)_8%,var(--card))]"
        >
          {moreRoleSelected ? roleLabel(moreRoleSelected) : $t('onboarding.v2.business.more_roles')}
          <ChevronDownIcon class="custom size-3" aria-hidden="true" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start" sideOffset={6} class="w-[290px] min-w-[220px] rounded-2xl p-1.5">
          <DropdownMenu.RadioGroup value={answers.jobRole} onValueChange={(value) => choose('team', 'jobRole', value)}>
            {#each BUSINESS_MORE_ROLES as role (role)}
              {@const RoleIcon = MORE_ROLE_ICONS[role]}
              <DropdownMenu.RadioItem
                value={role}
                class="gap-[11px] rounded-[10px] px-3 py-2.5 text-[14.5px] font-medium data-[state=checked]:bg-[color-mix(in_oklab,var(--primary)_9%,transparent)] data-[state=checked]:text-(--primary) [&>span:first-child]:hidden"
              >
                <RoleIcon class="custom size-4" aria-hidden="true" />
                <span>{roleLabel(role)}</span>
              </DropdownMenu.RadioItem>
            {/each}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.DropdownMenu>
    </div>
  </Field.Field>

  <Field.Field>
    <Field.Label id="onboarding-business-size-label">{$t('onboarding.v2.business.size_label')}</Field.Label>
    <div data-testid="onboarding-business-size">
      <ToggleGroup
        type="single"
        value={answers.companySize}
        onValueChange={(value) => choose('team', 'companySize', value)}
        aria-labelledby="onboarding-business-size-label"
        class={CHIP_GROUP_CLASS}
      >
        {#each COMPANY_SIZES as size (size.value)}
          <ToggleGroupItem value={size.value} class={CHIP_CLASS}>{sizeLabel(size.value)}</ToggleGroupItem>
        {/each}
      </ToggleGroup>
    </div>
  </Field.Field>
{/snippet}

{#snippet learningBody()}
  <div data-testid="onboarding-business-learning">
    <ToggleGroup
      type="single"
      value={answers.learningMethod}
      onValueChange={(value) => choose('learning', 'learningMethod', value)}
      aria-label={$t('onboarding.v2.business.items.learning')}
      class={CHIP_GROUP_CLASS}
    >
      {#each learningOptions as option (option.value)}
        <ToggleGroupItem value={option.value} class={CHIP_CLASS}>{$t(option.label)}</ToggleGroupItem>
      {/each}
    </ToggleGroup>
  </div>
{/snippet}

{#snippet sourceBody()}
  <p class="ui:text-muted-foreground text-[13.5px] leading-normal">{$t('onboarding.v2.business.source_hint')}</p>
  <div data-testid="onboarding-business-source">
    <ToggleGroup
      type="single"
      value={answers.source}
      onValueChange={chooseSource}
      aria-label={$t('onboarding.v2.business.items.source')}
      class={CHIP_GROUP_CLASS}
    >
      {#each SOURCES as source (source.value)}
        <ToggleGroupItem value={source.value} class={CHIP_CLASS}>{$t(source.label)}</ToggleGroupItem>
      {/each}
    </ToggleGroup>
  </div>

  {#if answers.source === OTHER_VALUE}
    <div class="ui:border-border grid gap-2 border-t pt-3.5">
      <InputField
        label={$t('onboarding.v2.business.source_label')}
        placeholder={$t('onboarding.v2.business.other_placeholder')}
        name="onboarding-business-source-other"
        bind:value={answers.sourceOther}
        onInput={changed}
        onKeyDown={finishSourceOnEnter}
      />
    </div>
  {:else if answers.source === AI_SOURCE_VALUE}
    <div class="ui:border-border grid gap-2 border-t pt-3.5">
      <Field.Label id="onboarding-business-provider-label">{$t('onboarding.v2.business.ai_provider_label')}</Field.Label
      >
      <ToggleGroup
        type="single"
        value={answers.aiProvider}
        onValueChange={chooseProvider}
        aria-labelledby="onboarding-business-provider-label"
        class={CHIP_GROUP_CLASS}
      >
        {#each AI_PROVIDERS as provider (provider.value)}
          <ToggleGroupItem value={provider.value} class={CHIP_CLASS}>{$t(provider.label)}</ToggleGroupItem>
        {/each}
      </ToggleGroup>
      {#if answers.aiProvider === OTHER_VALUE}
        <InputField
          label={$t('onboarding.v2.business.ai_provider_other_label')}
          placeholder={$t('onboarding.v2.business.other_placeholder')}
          name="onboarding-business-ai-other"
          bind:value={answers.aiProviderOther}
          onInput={changed}
          onKeyDown={finishSourceOnEnter}
        />
      {/if}
    </div>
  {/if}

  <div class="flex justify-end">
    <Button variant="ghost" size="sm" onclick={skipSource}>{$t('onboarding.v2.business.skip')}</Button>
  </div>
{/snippet}

<SplitShell>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-3">
      <p class="ui:text-muted-foreground font-mono text-xs tracking-[0.12em] uppercase">
        {$t('onboarding.v2.business.eyebrow')}
      </p>
      <h1 class="text-[26px] leading-normal font-[650] tracking-[-0.03em]">
        <HighlightText
          variant="swipe"
          text={$t('onboarding.v2.business.heading')}
          highlight={$t('onboarding.v2.business.heading_highlight')}
        />
      </h1>
      <p class="ui:text-muted-foreground text-sm leading-[1.6]">
        {$t('onboarding.v2.business.subtitle')}
      </p>
    </div>

    <Accordion.Root
      type="single"
      value={openItem}
      onValueChange={(value) => void setOpenItem((value ?? '') as ItemId | '')}
      class="grid gap-2.5"
    >
      {@render item('academy', $t('onboarding.v2.business.items.academy'), false, academyBody)}
      {@render item('outcome', $t('onboarding.v2.business.items.outcome'), false, outcomeBody)}
      {@render item('business', $t('onboarding.v2.business.items.business'), false, businessBody)}
      {@render item('team', $t('onboarding.v2.business.items.team'), false, teamBody)}
      {@render item('learning', $t('onboarding.v2.business.items.learning'), false, learningBody)}
      {@render item('source', $t('onboarding.v2.business.items.source'), true, sourceBody)}
    </Accordion.Root>

    <p class="ui:text-destructive text-[13.5px] empty:hidden" role="alert" aria-live="assertive">{missingMessage}</p>
    {#if isSaveFailing}
      <p class="ui:text-muted-foreground text-[13.5px]" aria-live="polite">
        {$t('onboarding.v2.business.save_retrying')}
      </p>
    {/if}

    <p class="ui:text-muted-foreground max-w-[62ch] text-[13.5px] leading-[1.55]">
      {$t('onboarding.v2.business.foothold')}
    </p>

    <div class="flex justify-end">
      <Button
        bind:ref={continueButton}
        onclick={handleContinue}
        loading={isSubmitting}
        testId="onboarding-business-continue"
      >
        {$t('onboarding.v2.common.continue')}
        <ArrowRightIcon class="custom size-4" aria-hidden="true" />
      </Button>
    </div>
  </div>
</SplitShell>
