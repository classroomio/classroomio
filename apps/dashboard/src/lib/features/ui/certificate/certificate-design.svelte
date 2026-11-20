<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import { Certificate } from '@cio/ui';
  import * as Card from '@cio/ui/base/card';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import { t } from '$lib/utils/functions/translations';
  import { CERTIFICATE_TEMPLATES, type CertificateDesign, type CertificateRenderData } from '@cio/certificates';
  import { isFreePlan } from '$lib/utils/store/org';

  interface Props {
    design: CertificateDesign;
    previewData: CertificateRenderData;
    editorHref: string;
    disabled?: boolean;
  }

  let { design, previewData, editorHref, disabled = false }: Props = $props();

  const templateLabel = $derived(
    CERTIFICATE_TEMPLATES.find((tpl) => tpl.id === design.templateId)?.label ?? design.templateId
  );
</script>

<div class="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
  <div class="aspect-[1.4/1] w-full">
    <Certificate.Preview {design} data={previewData} zoom="fit" />
  </div>

  <div class="flex flex-col gap-3">
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-base">{$t('certificate.editor.summary_title')}</Card.Title>
        <Card.Description>{$t('certificate.editor.summary_subtitle')}</Card.Description>
      </Card.Header>
      <Card.Content class="space-y-3 pb-4">
        <div class="flex items-center justify-between">
          <span class="ui:text-muted-foreground text-xs tracking-wider uppercase">
            {$t('certificate.editor.field_template')}
          </span>
          <Badge variant="secondary" class="text-[10px] uppercase">{templateLabel}</Badge>
        </div>
        <div class="flex items-center justify-between">
          <span class="ui:text-muted-foreground text-xs tracking-wider uppercase">
            {$t('certificate.editor.field_accent')}
          </span>
          <span class="ui:border-border inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs">
            <span class="size-3.5 rounded-full" style:background-color={design.accentColor} aria-hidden="true"></span>
            {design.accentColor}
          </span>
        </div>
        <div class="flex items-start justify-between gap-2">
          <span class="ui:text-muted-foreground text-xs tracking-wider uppercase">
            {$t('certificate.editor.field_signatories')}
          </span>
          <div class="text-right text-xs">
            {#if design.signatories[0]?.enabled}
              <div class="font-medium">{design.signatories[0].name}</div>
              <div class="ui:text-muted-foreground">{design.signatories[0].role}</div>
            {/if}
            {#if design.signatories[1]?.enabled}
              <div class:mt-1={design.signatories[0]?.enabled} class="font-medium">{design.signatories[1].name}</div>
              <div class="ui:text-muted-foreground">{design.signatories[1].role}</div>
            {/if}
          </div>
        </div>
      </Card.Content>
      <Card.Footer>
        <Button
          variant="secondary"
          class="w-full justify-center"
          disabled={$isFreePlan || disabled || !editorHref}
          href={editorHref}
        >
          {#if $isFreePlan}
            <ZapIcon class="size-4" />
          {/if}
          {$t('certificate.editor.customize_design')}
          <ArrowRightIcon class="size-4" />
        </Button>
      </Card.Footer>
    </Card.Root>
  </div>
</div>
