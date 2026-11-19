<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Page from '@cio/ui/base/page';
  import * as Select from '@cio/ui/base/select';
  import { Button } from '@cio/ui/base/button';
  import { Search } from '@cio/ui/custom/search';
  import { BackButton, TemplateCard, DEFAULT_COURSE_BANNER_IMAGE } from '@cio/ui';
  import { DeleteModal } from '$features/ui';
  import { courseTemplateApi } from '$features/course/api';
  import TemplatePreviewDialog from '$features/course/components/template-preview-dialog.svelte';
  import { formatTemplateUsedDate, templateTypeBadge } from '$features/course/utils/template-display';
  import { t } from '$lib/utils/functions/translations';
  import { isOrgAdmin, currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { isStudentExperience } from '$lib/utils/store/app';
  import { resolve } from '$app/paths';

  let searchValue = $state(page.url.searchParams.get('q') ?? '');
  let deleteId = $state('');
  let deleteOpen = $state(false);

  const scope = $derived(page.url.searchParams.get('scope') ?? 'all');
  const previewId = $derived(page.url.searchParams.get('preview'));
  const query = $derived(searchValue.trim().toLowerCase());

  const orgTemplates = $derived(courseTemplateApi.cards?.org ?? []);
  const globalTemplates = $derived(courseTemplateApi.cards?.global ?? []);

  const visible = $derived.by(() => {
    const owned = scope === 'global' ? [] : orgTemplates;
    const shared = scope === 'org' ? [] : globalTemplates;
    const cards = [
      ...owned.map((template) => ({ ...template, owned: true })),
      ...shared.map((template) => ({ ...template, owned: false }))
    ];

    if (!query) return cards;

    return cards.filter((template) => template.title.toLowerCase().includes(query));
  });

  const showBlank = $derived($isOrgAdmin && !query);
  const showOrgEmpty = $derived(scope === 'org' && !query && orgTemplates.length === 0 && !courseTemplateApi.listing);
  const showNoResults = $derived(
    !courseTemplateApi.listing && visible.length === 0 && (query.length > 0 || scope === 'global')
  );

  function subtitle(template: { lastUsedAt: string | null }, owned: boolean) {
    if (!owned) return $t('course_templates.card.curated');
    if (!template.lastUsedAt) return $t('course_templates.card.yours');

    const date = formatTemplateUsedDate(template.lastUsedAt);
    if (!date) return $t('course_templates.card.yours');

    return $t('course_templates.card.used', { date });
  }

  function setScope(value: string) {
    const params = new URLSearchParams(page.url.searchParams);
    if (!value || value === 'all') params.delete('scope');
    else params.set('scope', value);
    const search = params.toString();
    goto(search ? `${page.url.pathname}?${search}` : page.url.pathname, { replaceState: true, noScroll: true });
  }

  function setPreview(templateId: string | null) {
    const params = new URLSearchParams(page.url.searchParams);
    if (templateId) params.set('preview', templateId);
    else params.delete('preview');
    const search = params.toString();
    goto(search ? `${page.url.pathname}?${search}` : page.url.pathname, {
      replaceState: true,
      noScroll: true,
      keepFocus: true
    });
  }

  async function confirmDelete() {
    if (!deleteId) return;

    await courseTemplateApi.deleteTemplate(deleteId);
    if (courseTemplateApi.success) {
      deleteOpen = false;
      deleteId = '';
      await courseTemplateApi.list();
    }
  }

  async function duplicate(templateId: string) {
    await courseTemplateApi.duplicate(templateId);
    await courseTemplateApi.list();
  }

  function syncSearch(value: string) {
    const next = value.trim();
    const current = page.url.searchParams.get('q') ?? '';
    if (next === current) return;

    const params = new URLSearchParams(page.url.searchParams);
    if (next) params.set('q', next);
    else params.delete('q');
    const search = params.toString();
    goto(search ? `${page.url.pathname}?${search}` : page.url.pathname, {
      replaceState: true,
      noScroll: true,
      keepFocus: true
    });
  }

  let urlQuery = $state(page.url.searchParams.get('q') ?? '');
  let listedOrgId = '';

  $effect(() => {
    const fromUrl = page.url.searchParams.get('q') ?? '';
    if (fromUrl === urlQuery) return;

    urlQuery = fromUrl;
    searchValue = fromUrl;
  });

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || $isStudentExperience || organizationId === listedOrgId) return;

    listedOrgId = organizationId;
    void courseTemplateApi.list();
  });

  onMount(() => {
    if ($isStudentExperience) {
      goto(`${$currentOrgPath}/courses`);
    }
  });
</script>

<svelte:head>
  <title>{$t('course_templates.gallery.title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <BackButton href={`${$currentOrgPath}/courses`} label={$t('course_templates.gallery.back')} class="p-0!" />
      <Page.Title>{$t('course_templates.gallery.title')}</Page.Title>
      <Page.Subtitle>{$t('course_templates.gallery.subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <Page.BodyHeader align="right">
        <Select.Root type="single" value={scope} onValueChange={setScope}>
          <Select.Trigger class="w-44" aria-label={$t('course_templates.gallery.scope_all')}>
            {scope === 'org'
              ? $t('course_templates.gallery.scope_org')
              : scope === 'global'
                ? $t('course_templates.gallery.scope_global')
                : $t('course_templates.gallery.scope_all')}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">{$t('course_templates.gallery.scope_all')}</Select.Item>
            <Select.Item value="org">{$t('course_templates.gallery.scope_org')}</Select.Item>
            <Select.Item value="global">{$t('course_templates.gallery.scope_global')}</Select.Item>
          </Select.Content>
        </Select.Root>
        <Search
          placeholder={$t('course_templates.gallery.search')}
          bind:value={searchValue}
          onValueChange={syncSearch}
        />
      </Page.BodyHeader>

      {#if showBlank || visible.length > 0 || (courseTemplateApi.listing && !courseTemplateApi.cards)}
        <div class="mt-4 grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4">
          {#if showBlank}
            <TemplateCard
              blank
              title={$t('course_templates.row.blank')}
              subtitle={$t('course_templates.row.blank_subtitle')}
              onclick={() => goto(`${$currentOrgPath}/courses?create=true`)}
            />
          {/if}
          {#if courseTemplateApi.listing && !courseTemplateApi.cards}
            {#each [0, 1, 2, 3] as index (index)}
              <TemplateCard loading />
            {/each}
          {:else}
            {#each visible as template (template.id)}
              <TemplateCard
                title={template.title}
                subtitle={subtitle(template, template.owned)}
                imageUrl={template.bannerImage || template.logo || DEFAULT_COURSE_BANNER_IMAGE}
                imageAlt={template.title}
                typeBadge={templateTypeBadge(template.type, $t)}
                onclick={() => setPreview(template.id)}
              >
                {#snippet overlay()}
                  {#if template.owned}
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger>
                        {#snippet child({ props })}
                          <Button
                            {...props}
                            variant="secondary"
                            size="icon"
                            class="ui:group-hover:opacity-100 ui:group-focus-within:opacity-100 absolute top-2 right-2 z-10 opacity-0 transition-opacity data-[state=open]:opacity-100"
                            aria-label={$t('courses.course_card.actions_menu_aria')}
                            onclick={(event) => {
                              props.onclick?.(event);
                              event.stopPropagation();
                            }}
                          >
                            <EllipsisVerticalIcon class="size-4" />
                          </Button>
                        {/snippet}
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end">
                        <DropdownMenu.Item onclick={() => goto(resolve(`/courses/${template.id}/lessons`, {}))}>
                          {$t('course_templates.menu.open')}
                        </DropdownMenu.Item>
                        {#if $isOrgAdmin}
                          <DropdownMenu.Item onclick={() => duplicate(template.id)}>
                            {$t('course_templates.menu.duplicate')}
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item
                            class="text-red-600"
                            onclick={() => {
                              deleteId = template.id;
                              deleteOpen = true;
                            }}
                          >
                            {$t('course_templates.menu.delete')}
                          </DropdownMenu.Item>
                        {/if}
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  {/if}
                {/snippet}
              </TemplateCard>
            {/each}
          {/if}
        </div>
      {/if}
      {#if showOrgEmpty}
        <p class="ui:text-muted-foreground mt-8 text-center text-sm">{$t('course_templates.gallery.empty_org')}</p>
      {:else if showNoResults}
        <p class="ui:text-muted-foreground mt-8 text-center text-sm">
          {query
            ? $t('course_templates.gallery.no_match', { query: searchValue.trim() })
            : $t('course_templates.gallery.empty_global')}
        </p>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>

<TemplatePreviewDialog templateId={previewId} onClose={() => setPreview(null)} />

<DeleteModal bind:open={deleteOpen} isLoading={courseTemplateApi.deleting} onDelete={confirmDelete} />
