<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import { Certificate } from '@cio/ui';
  import type { CertificateDesign } from '@cio/certificates';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    open: boolean;
    templateName: string;
    compiledDesign: CertificateDesign;
    previewData: Record<string, any>;
  }

  let { open = $bindable(false), templateName, compiledDesign, previewData }: Props = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden p-0 sm:max-w-3xl">
    <Dialog.Header class="border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
      <Dialog.Title class="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
        <EyeIcon class="size-4 text-amber-500" />
        <span>{templateName}</span>
      </Dialog.Title>
    </Dialog.Header>

    <div
      class="relative flex h-[380px] max-h-[55vh] w-full items-center justify-center overflow-hidden bg-slate-100 bg-[radial-gradient(circle,#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] p-6 dark:bg-slate-950 dark:bg-[radial-gradient(circle,#334155_1px,transparent_1px)]"
    >
      <Certificate.Preview
        design={compiledDesign}
        data={previewData}
        zoom="fit"
        showControls={true}
        class="h-full w-full"
      />
    </div>

    <Dialog.Footer class="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
      <span class="font-mono text-xs text-slate-400">Standard Landscape (1100 × 780)</span>
      <Button variant="outline" size="sm" onclick={() => (open = false)}>
        {$t('certificate_studio.close')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
