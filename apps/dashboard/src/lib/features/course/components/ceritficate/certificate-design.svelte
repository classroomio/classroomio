<script lang="ts">
  import { resolve } from '$app/paths';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import { Certificate } from '@cio/ui';
  import * as Card from '@cio/ui/base/card';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import { t } from '$lib/utils/functions/translations';

  import { courseApi } from '$features/course/api';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import {
    CERTIFICATE_TEMPLATES,
    DEFAULT_CERTIFICATE_DESIGN,
    type CertificateDesign,
    resolveTemplateId
  } from '@cio/certificates';

  type Props = {
    errors?: Record<string, string>;
  };

  let { errors: _errors }: Props = $props();

  const design: CertificateDesign = $derived.by(() => {
    const certificate = courseApi.course?.certificate;
    const stored = certificate?.design as Partial<CertificateDesign> | undefined;
    const legacyTheme = certificate?.theme as string | undefined;

    return {
      templateId: resolveTemplateId(stored?.templateId ?? legacyTheme),
      accentColor: stored?.accentColor ?? DEFAULT_CERTIFICATE_DESIGN.accentColor,
      subtitle: stored?.subtitle ?? DEFAULT_CERTIFICATE_DESIGN.subtitle,
      descriptionOverride: stored?.descriptionOverride,
      signatories: [
        {
          name: stored?.signatories?.[0]?.name ?? DEFAULT_CERTIFICATE_DESIGN.signatories[0].name,
          role: stored?.signatories?.[0]?.role ?? DEFAULT_CERTIFICATE_DESIGN.signatories[0].role
        },
        {
          name: stored?.signatories?.[1]?.name ?? DEFAULT_CERTIFICATE_DESIGN.signatories[1].name,
          role: stored?.signatories?.[1]?.role ?? DEFAULT_CERTIFICATE_DESIGN.signatories[1].role
        }
      ],
      idFormat: stored?.idFormat ?? DEFAULT_CERTIFICATE_DESIGN.idFormat
    };
  });

  const previewData = $derived({
    recipientName: 'Eleanor Vance',
    courseName: courseApi.course?.title ?? 'Course Title',
    courseDescription: design.descriptionOverride || courseApi.course?.description || '',
    orgName: $currentOrg.name || 'Organization',
    orgLogoUrl: $currentOrg.avatarUrl || undefined,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' }),
    certificateId: (design.idFormat ?? 'N° {seq}').replace('{seq}', '0247')
  });

  const templateLabel = $derived(
    CERTIFICATE_TEMPLATES.find((tpl) => tpl.id === design.templateId)?.label ?? design.templateId
  );

  const courseId = $derived(courseApi.course?.id ?? '');
  const editorHref = $derived(courseId ? resolve('/courses/[id]/certificates/editor', { id: courseId }) : '#');
</script>

<div class="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
  <div class="aspect-[1.4/1] w-full">
    <Certificate.Preview {design} data={previewData} zoom="fit" />
  </div>

  <div class="flex flex-col gap-3">
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-base">{$t('course.navItem.certificates.editor.summary_title')}</Card.Title>
        <Card.Description>{$t('course.navItem.certificates.editor.summary_subtitle')}</Card.Description>
      </Card.Header>
      <Card.Content class="space-y-3 pb-4">
        <div class="flex items-center justify-between">
          <span class="ui:text-muted-foreground text-xs tracking-wider uppercase">
            {$t('course.navItem.certificates.editor.field_template')}
          </span>
          <Badge variant="secondary" class="text-[10px] uppercase">{templateLabel}</Badge>
        </div>
        <div class="flex items-center justify-between">
          <span class="ui:text-muted-foreground text-xs tracking-wider uppercase">
            {$t('course.navItem.certificates.editor.field_accent')}
          </span>
          <span class="ui:border-border inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs">
            <span class="size-3.5 rounded-full" style:background-color={design.accentColor} aria-hidden="true"></span>
            {design.accentColor}
          </span>
        </div>
        <div class="flex items-start justify-between gap-2">
          <span class="ui:text-muted-foreground text-xs tracking-wider uppercase">
            {$t('course.navItem.certificates.editor.field_signatories')}
          </span>
          <div class="text-right text-xs">
            <div class="font-medium">{design.signatories[0].name}</div>
            <div class="ui:text-muted-foreground">{design.signatories[0].role}</div>
            <div class="mt-1 font-medium">{design.signatories[1].name}</div>
            <div class="ui:text-muted-foreground">{design.signatories[1].role}</div>
          </div>
        </div>
      </Card.Content>
      <Card.Footer>
        <Button class="w-full justify-center" disabled={$isFreePlan || !courseId} href={editorHref}>
          {#if $isFreePlan}
            <ZapIcon class="size-4" />
          {/if}
          {$t('course.navItem.certificates.editor.customize_design')}
          <ArrowRightIcon class="size-4" />
        </Button>
      </Card.Footer>
    </Card.Root>
  </div>
</div>
