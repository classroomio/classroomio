<script lang="ts">
  /* pages/certificates.svelte for a student: locked (instructor has not unlocked it), course not complete, or ready to download */
  import DownloadIcon from '@lucide/svelte/icons/download';
  import ImageIcon from '@lucide/svelte/icons/image';
  import LockIcon from '@lucide/svelte/icons/lock';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { t } from '../copy';
  import type { Progress } from './model';

  interface Props {
    course: { id: string; title: string; certificate?: Record<string, unknown> | null };
    done: Record<string, boolean>;
    progress: Progress;
    user: { fullname: string };
    org: { name: string };
    store: any;
    notify: (message: string, kind?: 'success' | 'error' | 'info') => void;
    certificateDocument: (recipient: string) => string;
  }

  let { course, progress, user, notify, certificateDocument }: Props = $props();

  const certificate = $derived(course.certificate ?? {});
  const unlocked = $derived(certificate.isDownloadable !== false);
  const threshold = $derived(Number(certificate.threshold ?? 100));
  const complete = $derived(progress.total > 0 && progress.percent >= threshold);
  const title = $derived(complete ? 'course.navItem.certificates.unlocked_certificate' : 'course.navItem.certificates.complete_to_download_title');

  function download(kind: 'pdf' | 'png') {
    if (kind === 'png') {
      notify('Image export is simulated in the prototype; the PDF opens a printable certificate.', 'info');
      return;
    }

    const win = window.open('', '_blank');

    if (!win) return;

    win.document.write(certificateDocument(user.fullname));
    win.document.close();
    notify('Certificate opened for printing or saving as PDF (simulated download).', 'success');
  }
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-4xl lg:max-w-5xl">
  <Page.Header>
    <Page.HeaderContent><Page.Title>{t('course.navItem.certificates.title')}</Page.Title></Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      {#if !unlocked}
        <div class="w-full flex-1">
          <Empty
            title={t('course.navItem.certificates.locked_certificate')}
            description={`${t('course.navItem.certificates.instructor_unlock')} ${t('course.navItem.certificates.contact_instructor')}`}
            icon={LockIcon}
            variant="page"
          />
        </div>
      {:else}
        <div class="flex-1">
          <Empty title={t(title)} icon={DownloadIcon} variant="page">
            <div class="ui:text-muted-foreground mx-auto mb-4 max-w-md space-y-2 text-center text-sm">
              {#if complete}
                <p>{t('course.navItem.certificates.unlocked_certificate_subtitle')}</p>
              {:else}
                <p>{t('course.certificates.progress_hint', { current: progress.percent, required: threshold })}</p>
              {/if}
            </div>
            <div class="flex flex-wrap items-center justify-center gap-2">
              <Button onclick={() => download('pdf')} disabled={!complete}>
                <DownloadIcon size={16} />
                {t('course.navItem.certificates.download_certificate')}
              </Button>
              <Button variant="outline" onclick={() => download('png')} disabled={!complete}>
                <ImageIcon size={16} />
                {t('course.navItem.certificates.download_image')}
              </Button>
            </div>
          </Empty>
        </div>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
