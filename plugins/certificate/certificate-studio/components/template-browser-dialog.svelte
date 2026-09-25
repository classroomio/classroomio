<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import CompassIcon from '@lucide/svelte/icons/compass';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import TemplateThumb from '$features/course/components/ceritficate/editor/panels/template-thumb.svelte';
  import type { CertificateTemplateId } from '@cio/certificates';
  import { t } from '$lib/utils/functions/translations';

  export interface StarterTemplate {
    id: CertificateTemplateId;
    name: string;
    style: string;
    description: string;
    accentColor: string;
    subtitle: string;
  }

  export const STARTER_TEMPLATES: StarterTemplate[] = [
    {
      id: 'classique',
      name: 'Honors Diploma',
      style: 'Victorian',
      description: 'Traditional academic elegance with ornate borders, classic serif fonts, and gold leaf accents.',
      accentColor: '#d4af37',
      subtitle: 'Certificate of Achievement'
    },
    {
      id: 'poster',
      name: 'Modern Tech Badge',
      style: 'Art Deco',
      description: 'Geometric Bauhaus-inspired layout with bold framing, ideal for engineering and software courses.',
      accentColor: '#ff5722',
      subtitle: 'Verified Technical Credential'
    },
    {
      id: 'noir',
      name: 'Executive Master',
      style: 'Executive Noir',
      description:
        'High-contrast dark atelier design tailored for executive leadership and professional certifications.',
      accentColor: '#d4af37',
      subtitle: 'Executive Leadership Diploma'
    },
    {
      id: 'minimal',
      name: 'Clean Fellowship',
      style: 'Minimalist',
      description: 'Contemporary typography with delicate hairline rules, generous whitespace, and pure simplicity.',
      accentColor: '#0a0a0a',
      subtitle: 'Professional Fellowship'
    },
    {
      id: 'brutalist',
      name: 'Architectural Certificate',
      style: 'Raw Modern',
      description: 'Bold typographic hierarchy and editorial structure tailored for design and creative disciplines.',
      accentColor: '#ff4500',
      subtitle: 'Certificate of Completion'
    }
  ];

  interface Props {
    open?: boolean;
    onClose: () => void;
    onSelectTemplate: (template: StarterTemplate) => void;
  }

  let { open = false, onClose, onSelectTemplate }: Props = $props();

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-h-[90vh] max-w-3xl overflow-hidden p-0 sm:rounded-2xl">
    <Dialog.Header class="border-b border-slate-100 bg-slate-50/60 p-6 dark:border-slate-800 dark:bg-slate-900/50">
      <div class="flex items-center gap-2.5">
        <div
          class="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        >
          <CompassIcon class="size-5" />
        </div>
        <div>
          <Dialog.Title class="text-base font-bold text-slate-900 dark:text-slate-100">
            {$t('certificate_studio.browse_templates')}
          </Dialog.Title>
          <Dialog.Description class="text-xs text-slate-500 dark:text-slate-400">
            Choose a curated starter design to customize inside the Certificate Studio.
          </Dialog.Description>
        </div>
      </div>
    </Dialog.Header>

    <div class="max-h-[65vh] overflow-y-auto p-6">
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {#each STARTER_TEMPLATES as template (template.id)}
          <div
            class="group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:border-slate-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            <!-- Thumbnail Visual -->
            <div
              class="relative aspect-[1.4/1] w-full overflow-hidden border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
            >
              <TemplateThumb id={template.id} />
              <div class="absolute top-2.5 right-2.5">
                <Badge
                  variant="secondary"
                  class="bg-white/80 font-mono text-[10px] uppercase backdrop-blur-xs dark:bg-slate-900/80"
                >
                  {template.style}
                </Badge>
              </div>
            </div>

            <!-- Content -->
            <div class="flex flex-1 flex-col justify-between p-4">
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {template.name}
                  </h4>
                  <span
                    class="size-3 rounded-full border border-black/10"
                    style:background-color={template.accentColor}
                    title={template.accentColor}
                  ></span>
                </div>
                <p class="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {template.description}
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                class="mt-4 w-full gap-1.5 transition-colors group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:border-slate-100 dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900"
                onclick={() => onSelectTemplate(template)}
              >
                <span>Use Template</span>
                <ArrowRightIcon class="size-3.5" />
              </Button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
