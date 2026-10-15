<script lang="ts">
  /*
   * The learner course view: routes/(app)/courses/[id]/+layout.svelte with $isCourseLearnerView. Sidebar (course
   * header with progress ring, Exit course, nav, content tree, footer nav + progress bar, powered by), header
   * (title, progress popover on small screens), the lesson / exercise / certificates page, the mobile bottom nav and
   * outline sheet, and the course completion modal. Data and persistence come from the host page (learn.js).
   */
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import LockIcon from '@lucide/svelte/icons/lock';
  import CircleXIcon from '@lucide/svelte/icons/circle-x';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import * as Popover from '@cio/ui/base/popover';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Drawer from '@cio/ui/base/drawer';
  import * as Avatar from '@cio/ui/base/avatar';
  import { Button } from '@cio/ui/base/button';
  import { Progress } from '@cio/ui/base/progress';
  import { Separator } from '@cio/ui/base/separator';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { BackButton } from '@cio/ui/custom/back-button';
  import { PercentRingProgress } from '@cio/ui/custom/percent-ring-progress';
  import PublicCourseBottomNav from '@cio/ui/custom/public-course/bottom-nav.svelte';
  import PublicCoursePoweredBy from '@cio/ui/custom/public-course/powered-by.svelte';
  import { ContentIcon, CertificateIcon, HoverableItem, LessonIcon, ExerciseIcon } from '@cio/ui/custom/moving-icons';
  import { t } from '../copy';
  import { progressOf, type RawItem, type RawSection } from './model';
  import LessonPage from './lesson-page.svelte';
  import ExercisePage from './exercise-page.svelte';
  import CertificatePage from './certificate-page.svelte';
  import CheckCircle from './check-circle.svelte';

  interface Props {
    org: { name: string; logoUrl?: string; siteName: string; plan: string };
    user: { fullname: string; email: string };
    course: { id: string; title: string; type: string; certificate?: Record<string, unknown> | null };
    sections: RawSection[];
    activeId: string;
    tab: string;
    store: any;
    hrefs: { exit: string; learn: (itemId: string, tab?: string) => string };
    notify: (message: string, kind?: 'success' | 'error' | 'info') => void;
    certificateDocument: (recipient: string) => string;
  }

  let { org, user, course, sections, activeId = $bindable(), tab = $bindable(), store, hrefs, notify, certificateDocument }: Props = $props();

  let rev = $state(0);
  let isMobile = $state(false);
  let done = $state<Record<string, boolean>>({ ...store.progress() });
  let mobileSheetOpen = $state(false);
  let completionOpen = $state(false);
  let completionStep = $state<'checking' | 'eligible'>('checking');
  let contentTreeExpanded = $state(true);
  const expanded = new SvelteSet<string>();

  const items = $derived(sections.flatMap((section) => section.items));
  const showCertificates = $derived(org.plan.toUpperCase() !== 'FREE');
  const progress = $derived(progressOf(items, done));
  const active = $derived(items.find((item) => item.id === activeId) ?? null);
  const activeIndex = $derived(items.findIndex((item) => item.id === activeId));
  const activeSectionId = $derived(sections.find((section) => section.items.some((item) => item.id === activeId))?.id ?? null);
  const isLocked = (item: RawItem | null | undefined) => Boolean(item?.locked);
  const previousItem = $derived(activeIndex > 0 ? items[activeIndex - 1] : null);
  const nextIncomplete = $derived.by(() => {
    for (let index = activeIndex + 1; index < items.length; index += 1) {
      if (!done[items[index].id] && !isLocked(items[index])) return items[index];
    }

    return null;
  });
  const nextItem = $derived(activeIndex >= 0 && activeIndex < items.length - 1 ? items[activeIndex + 1] : null);
  const isContentPage = $derived(tab === 'content');
  const headerTitle = $derived(tab === 'certificates' ? t('course.navItems.nav_certificates') : t('course.navItems.nav_content'));
  const initials = (name: string) =>
    name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  $effect(() => {
    if (activeSectionId && isContentPage) {
      expanded.clear();
      expanded.add(activeSectionId);
    }
  });

  function go(itemId: string | null, nextTab = 'content') {
    if (itemId && isLocked(items.find((item) => item.id === itemId))) {
      notify(t('course.navItem.lessons.content_locked_title'), 'error');
      return;
    }

    if (itemId) activeId = itemId;
    tab = nextTab;
    mobileSheetOpen = false;
    history.pushState(null, '', hrefs.learn(activeId, nextTab === 'content' ? undefined : nextTab));
    window.scrollTo({ top: 0 });
    document.querySelector('[data-slot="sidebar-inset"]')?.scrollTo?.({ top: 0 });
  }

  function onPop() {
    const params = new URLSearchParams(window.location.search);

    activeId = params.get('item') || items[0]?.id || '';
    tab = params.get('tab') === 'certificates' ? 'certificates' : 'content';
  }

  onMount(() => {
    window.addEventListener('popstate', onPop);

    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => (isMobile = media.matches);

    sync();
    media.addEventListener('change', sync);

    return () => {
      window.removeEventListener('popstate', onPop);
      media.removeEventListener('change', sync);
    };
  });

  function setComplete(itemId: string, value: boolean) {
    done = { ...done, [itemId]: value };
    store.setComplete(itemId, value);
    rev += 1;
  }

  function toggleLesson(itemId: string) {
    const next = !done[itemId];

    setComplete(itemId, next);
    notify(next ? t('snackbar.lessons.success.complete_marked') : t('snackbar.lessons.success.complete_unmarked'), 'success');
    checkCompletion(next);
  }

  function checkCompletion(justCompleted: boolean) {
    if (!justCompleted || items.length === 0 || !items.every((item) => done[item.id])) return;

    completionOpen = true;
    completionStep = 'checking';
    setTimeout(() => {
      completionStep = 'eligible';
      store.markCourseComplete();
    }, 700);
  }

  function onExerciseComplete(itemId: string) {
    setComplete(itemId, true);
    checkCompletion(true);
  }

  function sectionProgress(section: RawSection) {
    return progressOf(section.items, done);
  }

  function onKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;

    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable || !isContentPage) return;
    if (event.key === 'ArrowLeft' && previousItem) go(previousItem.id);
    if (event.key === 'ArrowRight' && nextItem && !isLocked(nextItem)) go(nextItem.id);
  }

  const showBottomNav = $derived(isContentPage && isMobile && progress.total > 0);
</script>

<svelte:window onkeydown={onKeydown} />

{#snippet progressCard(cardClass = '')}
  <div class={cardClass}>
    <div class="flex items-baseline justify-between gap-2">
      <span class="text-xs font-medium">{t('course.sidebar.progress.title')}</span>
      <span class="ui:text-primary text-xs font-semibold tabular-nums">{progress.percent}%</span>
    </div>
    <Progress value={progress.percent} max={100} class="mt-2 h-1.5" />
    <p class="ui:text-muted-foreground mt-2 truncate text-[11px]">
      {t('course.sidebar.progress.lessons', { completed: progress.lessonsComplete, total: progress.lessonsTotal })}{#if progress.exercisesTotal > 0}
        · {t('course.sidebar.progress.exercises', { completed: progress.exercisesComplete, total: progress.exercisesTotal })}{/if}
    </p>
  </div>
{/snippet}

{#snippet itemRow(item: RawItem)}
  {@const locked = isLocked(item)}
  <Sidebar.MenuSubItem>
    <Sidebar.MenuSubButton isActive={isContentPage && item.id === activeId}>
      {#snippet child({ props })}
        <a
          href={hrefs.learn(item.id)}
          aria-disabled={locked}
          title={item.title}
          data-sidebar-content-id={item.id}
          class="flex w-full items-center gap-2 {locked ? 'cursor-not-allowed opacity-50' : ''}"
          onclick={(event) => {
            event.preventDefault();
            go(item.id);
          }}
          {...props}
        >
          {#if item.kind === 'lesson'}
            <LessonIcon size={14} class="shrink-0 custom text-sky-600" />
          {:else}
            <ExerciseIcon size={14} class="shrink-0 custom text-green-600" />
          {/if}
          <span class="flex-1 truncate">{item.title}</span>
          <div class="ml-auto flex items-center gap-1">
            {#if done[item.id]}
              <span class="shrink-0"><CheckCircle size={16} filled /></span>
            {/if}
            {#if locked}
              <span class="shrink-0" title={t('course.navItem.lessons.add_lesson.lock')}><LockIcon size={12} /></span>
            {/if}
          </div>
        </a>
      {/snippet}
    </Sidebar.MenuSubButton>
  </Sidebar.MenuSubItem>
{/snippet}

<Sidebar.Provider style="--sidebar-width: 320px;">
  <Sidebar.Root collapsible="icon" class="ui:z-app-bar-elevated" mobileOverlayClass="ui:z-app-bar-elevated">
    <Sidebar.Header>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton size={progress.total > 0 ? 'lg' : 'sm'}>
            {#snippet child({ props })}
              <a href={hrefs.learn(items[0]?.id ?? '')} {...props} onclick={(event) => { event.preventDefault(); go(activeId); }}>
                {#if progress.total > 0}
                  <PercentRingProgress value={progress.percent} size="small" />
                  <div class="flex min-w-0 flex-1 flex-col">
                    <span class="truncate text-sm font-medium">{course.title}</span>
                    <span class="ui:text-muted-foreground truncate text-xs">
                      {t('course.sidebar.progress.completed', { completed: progress.completed, total: progress.total })}
                    </span>
                  </div>
                {:else}
                  <Avatar.Root class="flex size-6! items-center justify-center rounded-md!">
                    <Avatar.Image src={org.logoUrl} alt={org.name} />
                    <Avatar.Fallback class="rounded-md! text-xs">{initials(org.name)}</Avatar.Fallback>
                  </Avatar.Root>
                  <span class="truncate text-sm font-medium">{course.title}</span>
                {/if}
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Header>

    <Sidebar.Content>
      <Sidebar.Group class="pt-0!">
        <BackButton href={hrefs.exit} label={t('org_navigation.exit_course')} class="px-2! py-2!" />
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton tooltipContent={t('course.navItems.nav_content')} isActive={isContentPage}>
              {#snippet child({ props })}
                <HoverableItem class="">
                  {#snippet children(isHovered)}
                    <a
                      href={hrefs.learn(activeId)}
                      data-testid="course-content-nav"
                      {...props}
                      onclick={(event) => {
                        event.preventDefault();
                        contentTreeExpanded = true;
                        go(activeId);
                      }}
                    >
                      <ContentIcon size={16} {isHovered} />
                      <span>{t('course.navItems.nav_content')}</span>
                      <div class="ml-auto flex items-center gap-1">
                        <span class="inline-flex items-center gap-1 rounded border px-1 py-0.5 text-[10px] leading-none">
                          <LessonIcon size={12} class="custom text-sky-600" /><span>{progress.lessonsTotal}</span>
                        </span>
                        {#if progress.exercisesTotal > 0}
                          <span class="inline-flex items-center gap-1 rounded border px-1 py-0.5 text-[10px] leading-none">
                            <ExerciseIcon size={12} class="custom text-green-600" /><span>{progress.exercisesTotal}</span>
                          </span>
                        {/if}
                        <IconButton
                          variant="ghost"
                          size="icon-xs"
                          aria-expanded={contentTreeExpanded}
                          aria-label={t(contentTreeExpanded ? 'course.navItem.lessons.collapse_content' : 'course.navItem.lessons.expand_content')}
                          onclick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            contentTreeExpanded = !contentTreeExpanded;
                          }}
                        >
                          <ChevronRightIcon class="transition-transform duration-200 {contentTreeExpanded ? 'rotate-90' : ''}" />
                        </IconButton>
                      </div>
                    </a>
                  {/snippet}
                </HoverableItem>
              {/snippet}
            </Sidebar.MenuButton>

            {#if contentTreeExpanded}
              <Sidebar.MenuSub class="mt-1 ml-2">
                {#each sections as section (section.id)}
                  {@const sp = sectionProgress(section)}
                  <Collapsible.Root
                    open={expanded.has(section.id)}
                    onOpenChange={(open) => (open ? expanded.add(section.id) : expanded.delete(section.id))}
                    class="group/section"
                  >
                    {#snippet child({ props })}
                      <Sidebar.MenuSubItem {...props}>
                        <Collapsible.Trigger>
                          {#snippet child({ props })}
                            <Sidebar.MenuSubButton {...props} class="flex w-full items-center gap-2 font-medium">
                              <span class="flex-1 truncate">{section.title}</span>
                              <div class="ml-auto flex items-center gap-1">
                                {#if sp.total > 0}
                                  <span class="shrink-0 text-[11px] font-medium tabular-nums {sp.completed === sp.total ? 'text-green-600' : 'ui:text-muted-foreground'}">
                                    {sp.completed}/{sp.total}
                                  </span>
                                {/if}
                                <ChevronRightIcon class="size-4 transition-transform duration-200 group-data-[state=open]/section:rotate-90" />
                              </div>
                            </Sidebar.MenuSubButton>
                          {/snippet}
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                          <Sidebar.MenuSub class="ml-2">
                            {#each section.items as item (item.id)}
                              {@render itemRow(item)}
                            {/each}
                          </Sidebar.MenuSub>
                        </Collapsible.Content>
                      </Sidebar.MenuSubItem>
                    {/snippet}
                  </Collapsible.Root>
                {/each}
              </Sidebar.MenuSub>
            {/if}
          </Sidebar.MenuItem>

          {#if showCertificates}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton tooltipContent={t('course.navItems.nav_certificates')} isActive={tab === 'certificates'}>
                {#snippet child({ props })}
                  <HoverableItem>
                    {#snippet children(isHovered)}
                      <a
                        href={hrefs.learn(activeId, 'certificates')}
                        {...props}
                        onclick={(event) => {
                          event.preventDefault();
                          go(activeId, 'certificates');
                        }}
                      >
                        <CertificateIcon {isHovered} size={16} />
                        <span>{t('course.navItems.nav_certificates')}</span>
                      </a>
                    {/snippet}
                  </HoverableItem>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/if}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>

    <Sidebar.Rail />

    <Sidebar.Footer>
      {#if progress.total > 0}
        <div class="ui:border-sidebar-border border-t group-data-[collapsible=icon]:hidden">
          <nav class="flex gap-2 px-3 py-2.5" aria-label={t('course.sidebar.footer_nav.label')}>
            <Button size="sm" variant="outline" class="flex-1" disabled={!previousItem || isLocked(previousItem)} onclick={() => go(previousItem?.id ?? null)}>
              <ChevronLeftIcon size={16} />
              {t('course.sidebar.footer_nav.previous')}
            </Button>
            <Button size="sm" variant="default" class="flex-1" disabled={!nextIncomplete} onclick={() => go(nextIncomplete?.id ?? null)}>
              {t('course.sidebar.footer_nav.next')}
              <ChevronRightIcon size={16} />
            </Button>
          </nav>
          <p class="ui:text-muted-foreground truncate px-3 pb-2 text-[11px]">
            {t('course.sidebar.progress.lessons', { completed: progress.lessonsComplete, total: progress.lessonsTotal })}{#if progress.exercisesTotal > 0}
              · {t('course.sidebar.progress.exercises', { completed: progress.exercisesComplete, total: progress.exercisesTotal })}{/if}
          </p>
          <Progress value={progress.percent} max={100} class="ui:h-[3px] ui:rounded-none" aria-hidden="true" />
        </div>
      {/if}
      <PublicCoursePoweredBy
        courseSlug={course.id}
        orgSlug={org.siteName}
        utmSource="lms-course-sidebar"
        label={t('public_course.powered_by.label')}
        brand="ClassroomIO"
      />
    </Sidebar.Footer>
  </Sidebar.Root>

  <Sidebar.Inset class="min-w-0 flex-1 {showBottomNav ? 'pb-24' : ''}">
    <header
      class="ui:border-border ui:bg-background ui:z-app-bar sticky top-0 flex h-12 w-full shrink-0 items-center gap-2 border-b backdrop-blur"
    >
      <div class="flex w-full items-center gap-2 px-4">
        <Sidebar.Trigger />
        <div class="h-4 w-2"><Separator orientation="vertical" /></div>
        <div class="flex w-[60%] min-w-0 flex-1 flex-col justify-center gap-0.5">
          <p class="max-w-xs truncate text-sm font-medium">{headerTitle}</p>
        </div>
        <span class="grow"></span>
        {#if !showBottomNav && progress.total > 0}
          <Popover.Root>
            <Popover.Trigger class="shrink-0 md:hidden" aria-label={t('course.sidebar.progress.title')}>
              <PercentRingProgress value={progress.percent} size="small" />
            </Popover.Trigger>
            <Popover.Content class="w-72" align="end">
              {@render progressCard()}
            </Popover.Content>
          </Popover.Root>
        {/if}
      </div>
    </header>

    {#if tab === 'certificates' && showCertificates}
      <CertificatePage {course} {done} {progress} {user} {org} {certificateDocument} {notify} {store} />
    {:else if active}
      {#key active.id}
        {#if active.kind === 'lesson'}
          <LessonPage
            lesson={active}
            {user}
            isComplete={Boolean(done[active.id])}
            previous={previousItem}
            next={nextItem}
            showPrevNext={!showBottomNav}
            {store}
            {notify}
            onToggle={() => toggleLesson(active.id)}
            onGo={(id) => go(id)}
            locked={isLocked(active)}
          />
        {:else}
          <ExercisePage
            exercise={active}
            courseType={course.type}
            isComplete={Boolean(done[active.id])}
            previous={previousItem}
            next={nextItem}
            showPrevNext={!showBottomNav}
            {store}
            {notify}
            onComplete={() => onExerciseComplete(active.id)}
            onGo={(id) => go(id)}
            locked={isLocked(active)}
          />
        {/if}
      {/key}
    {/if}

    {#if showBottomNav}
      <PublicCourseBottomNav
        positionLabel={activeIndex >= 0 ? `${activeIndex + 1} / ${progress.total}` : ''}
        sublineLabel={active?.title}
        sublineComplete={active?.kind === 'lesson' ? false : Boolean(active && done[active.id])}
        hasPrev={Boolean(previousItem) && !isLocked(previousItem)}
        hasNext={Boolean(nextIncomplete)}
        onPrev={() => go(previousItem?.id ?? null)}
        onNext={() => go(nextIncomplete?.id ?? null)}
        onOpenSheet={() => (mobileSheetOpen = true)}
        openSheetLabel={t('course.navItems.nav_content')}
        prevLabel={t('course.sidebar.footer_nav.previous')}
        nextLabel={t('course.sidebar.footer_nav.next')}
        centerVariant="ring"
        progressPercent={progress.percent}
      >
        {#snippet completeToggle()}
          {#if active?.kind === 'lesson' && !isLocked(active)}
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              class={done[active.id] ? 'ui:text-primary' : ''}
              aria-pressed={Boolean(done[active.id])}
              aria-label="{t('course.navItem.lessons.mark_as')} {t(done[active.id] ? 'course.navItem.lessons.incomplete' : 'course.navItem.lessons.complete')}"
              onclick={() => toggleLesson(active!.id)}
            >
              <CheckCircle size={18} filled={Boolean(done[active.id])} />
            </Button>
          {/if}
        {/snippet}
      </PublicCourseBottomNav>
    {/if}
  </Sidebar.Inset>
</Sidebar.Provider>

<Drawer.Root open={mobileSheetOpen} onOpenChange={(open) => (mobileSheetOpen = open)}>
  <Drawer.Portal>
    <Drawer.Overlay class="ui:fixed ui:inset-0 ui:z-50 ui:bg-black/40" />
    <Drawer.Content
      class="ui:fixed ui:inset-x-0 ui:bottom-0 ui:z-50 ui:flex ui:max-h-[85vh] ui:flex-col ui:rounded-t-xl ui:border-t ui:border-border ui:bg-background"
    >
      <div class="ui:mx-auto ui:mt-2 ui:h-1 ui:w-10 ui:rounded-full ui:bg-muted" aria-hidden="true"></div>
      <Drawer.Header class="ui:flex-row ui:items-center ui:justify-between ui:gap-2 ui:px-5 ui:pt-3 ui:pb-2">
        <Drawer.Title class="ui:text-sm ui:font-semibold ui:text-foreground">{t('course.navItems.nav_content')}</Drawer.Title>
        <Button variant="link" class="inline-flex! items-center! gap-1 overflow-visible p-0 text-xs! leading-none" href={hrefs.exit}>
          <CircleXIcon size={12} class="custom size-3 shrink-0 translate-y-px" aria-hidden="true" />
          {t('course.navItems.exit_course')}
        </Button>
      </Drawer.Header>
      <div class="shrink-0 px-3 pb-2">{@render progressCard('rounded-lg border p-3')}</div>
      <div class="flex-1 overflow-y-auto px-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <nav class="flex flex-col gap-1" aria-label={t('course.navItems.nav_content')}>
          {#each sections as section (section.id)}
            {@const sp = sectionProgress(section)}
            <Collapsible.Root open={expanded.has(section.id)} onOpenChange={(open) => (open ? expanded.add(section.id) : expanded.delete(section.id))} class="group/section">
              <Collapsible.Trigger class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium">
                <span class="min-w-0 flex-1 truncate">{section.title}</span>
                <span class="shrink-0 text-[11px] font-medium tabular-nums {sp.completed === sp.total ? 'ui:text-green-600' : 'ui:text-muted-foreground'}">{sp.completed}/{sp.total}</span>
                <ChevronRightIcon class="size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/section:rotate-90" />
              </Collapsible.Trigger>
              <Collapsible.Content class="ml-2 flex flex-col gap-0.5 border-l pl-2">
                {#each section.items as item (item.id)}
                  {@const locked = isLocked(item)}
                  <a
                    href={hrefs.learn(item.id)}
                    class="flex items-center gap-2 rounded-md px-3 py-2 text-sm {item.id === activeId ? 'ui:text-primary font-medium' : ''} {locked ? 'cursor-not-allowed opacity-50' : ''}"
                    onclick={(event) => {
                      event.preventDefault();
                      go(item.id);
                    }}
                  >
                    <span class="min-w-0 flex-1 truncate">{item.title}</span>
                    {#if done[item.id]}<CheckCircle size={16} filled />{/if}
                    {#if locked}<LockIcon size={12} />{/if}
                  </a>
                {/each}
              </Collapsible.Content>
            </Collapsible.Root>
          {/each}
        </nav>
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>

<Dialog.Root open={completionOpen} onOpenChange={(open) => (completionOpen = open)}>
  <Dialog.Content class="max-w-md">
    {#if completionStep === 'checking'}
      <div class="flex flex-col items-center justify-center gap-4 py-8">
        <p class="ui:text-muted-foreground text-sm">{t('course.completion.modal.checking')}</p>
      </div>
    {:else}
      <Dialog.Header>
        <Dialog.Title>{t('course.completion.modal.title')}</Dialog.Title>
        <Dialog.Description>
          {showCertificates ? t('course.completion.modal.subtitle') : t('course.completion.modal.subtitle_no_certificate')}
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Footer class="gap-2">
        <Button variant="outline" onclick={() => (completionOpen = false)}>{t('course.completion.modal.later')}</Button>
        {#if showCertificates}
          <Button
            onclick={() => {
              completionOpen = false;
              go(activeId, 'certificates');
            }}>{t('course.completion.modal.view_certificate')}</Button
          >
        {/if}
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
