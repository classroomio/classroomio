<script lang="ts">
  import { goto } from '$app/navigation';
  import { TemplateCard, DEFAULT_COURSE_BANNER_IMAGE } from '@cio/ui';
  import { courseTemplateApi } from '$features/course/api';
  import { templateCardSubtitle, templateTypeBadge } from '$features/course/utils/template-display';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';

  const HOME_TEMPLATE_LIMIT = 4;

  const templates = $derived.by(() => {
    const cards = courseTemplateApi.cards;
    if (!cards) return [];

    return [...cards.org, ...cards.global].slice(0, HOME_TEMPLATE_LIMIT);
  });

  const orgIds = $derived(new Set(courseTemplateApi.cards?.org.map((template) => template.id) ?? []));

  let listedOrgId = '';

  function galleryHref(previewId?: string) {
    const params = previewId ? `?preview=${previewId}` : '';
    return `${$currentOrgPath}/courses/templates${params}`;
  }

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || organizationId === listedOrgId) return;

    listedOrgId = organizationId;
    void courseTemplateApi.list();
  });
</script>

{#if !courseTemplateApi.cards || templates.length > 0}
  <section class="mt-10">
    <div class="mb-3 flex items-end justify-between gap-4">
      <div class="min-w-0">
        <h2 class="text-sm font-semibold">{$t('course_templates.home.heading')}</h2>
        <p class="ui:text-muted-foreground mt-0.5 text-sm">{$t('course_templates.home.description')}</p>
      </div>
      <a class="ui:text-primary shrink-0 text-sm font-medium hover:underline" href={galleryHref()}>
        {$t('course_templates.home.browse')}
      </a>
    </div>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {#if !courseTemplateApi.cards}
        {#each [0, 1, 2, 3] as index (index)}
          <TemplateCard loading />
        {/each}
      {:else}
        {#each templates as template (template.id)}
          <TemplateCard
            title={template.title}
            subtitle={templateCardSubtitle(template.lastUsedAt, orgIds.has(template.id), $t)}
            imageUrl={template.bannerImage || DEFAULT_COURSE_BANNER_IMAGE}
            imageAlt={template.title}
            typeBadge={templateTypeBadge(template.type, $t)}
            onclick={() => goto(galleryHref(template.id))}
          />
        {/each}
      {/if}
    </div>
  </section>
{/if}
