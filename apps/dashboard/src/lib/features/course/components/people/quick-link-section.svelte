<script lang="ts">
  import QRCode from 'qrcode';
  import { untrack } from 'svelte';
  import copy from 'copy-to-clipboard';
  import { toPng } from 'html-to-image';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import { inviteSettingsStore, studentInviteLinkStore, qrInviteNodeStore } from './store';
  import { getInvitePayload } from './invite-utils';
  import { snackbar } from '$features/ui/snackbar/store';
  import { courseApi } from '$features/course/api';
  import { peopleApi } from '$features/course/api';
  import ShareQrImage from './share-qr-image.svelte';

  const INVITE_MODAL = 'course.navItem.people.invite_modal';

  interface Props {
    courseId: string;
    isOpen?: boolean;
    onInviteCreated?: () => void;
  }

  let { courseId, isOpen = false, onInviteCreated }: Props = $props();

  $effect(() => {
    if (!isOpen || !courseId) return;
    untrack(() => {
      createQuickInviteLink().then(() => {});
    });
  });

  async function createQuickInviteLink(forceRefresh = false) {
    if (!courseApi.course || !courseId) return '';
    const { link } = $studentInviteLinkStore;
    if (link && !forceRefresh) return link;

    studentInviteLinkStore.update((s) => ({ ...s, isCreating: true }));
    try {
      const settings = $inviteSettingsStore;
      const payload = getInvitePayload(settings);
      const invite = await peopleApi.createStudentInvite(courseId, {
        ...payload,
        sendEmail: false
      });

      const newLink = invite?.inviteLink || invite?.invites?.[0]?.inviteLink || '';
      if (!newLink) {
        snackbar.error(`${INVITE_MODAL}.snackbar_failed_generate_link`);
        return '';
      }

      studentInviteLinkStore.update((s) => ({ ...s, link: newLink, isCreating: false }));
      await generateQR(newLink);
      onInviteCreated?.();
      return newLink;
    } catch (error) {
      console.error('Failed to create invite link', error);
      snackbar.error(`${INVITE_MODAL}.snackbar_failed_generate_link`);
      return '';
    } finally {
      studentInviteLinkStore.update((s) => ({ ...s, isCreating: false }));
    }
  }

  async function copyLink() {
    const link = await createQuickInviteLink();
    if (!link) return;
    copy(link);
    snackbar.success(`${INVITE_MODAL}.snackbar_invite_link_copied`);
  }

  async function regenerateLink() {
    const link = await createQuickInviteLink(true);
    if (!link) return;
    snackbar.success(`${INVITE_MODAL}.snackbar_invite_link_regenerated`);
  }

  async function generateQR(text: string) {
    try {
      const image = await QRCode.toDataURL(text);
      untrack(() => {
        studentInviteLinkStore.update((s) => ({ ...s, qrImage: image }));
      });
    } catch (err) {
      console.error(err);
    }
  }

  function handleQRDownload() {
    const node = $qrInviteNodeStore;
    if (!node) {
      console.error('Node is not defined');
      return;
    }

    studentInviteLinkStore.update((s) => ({ ...s, isLoadingQRDownload: true }));
    setTimeout(() => {
      toPng(node)
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `${courseApi.course?.slug ?? 'course'}-qr-code.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((error) => {
          console.error('Oops, something went wrong!', error);
        })
        .finally(() => {
          studentInviteLinkStore.update((s) => ({ ...s, isLoadingQRDownload: false }));
        });
    }, 300);
  }

  const linkState = $derived($studentInviteLinkStore);
</script>

<div class="rounded-md border p-4">
  <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
    <div>
      <p class="text-base font-semibold">{$t(`${INVITE_MODAL}.quick_invite_link`)}</p>
      <p class="ui:text-muted-foreground text-sm">{$t(`${INVITE_MODAL}.quick_invite_link_description`)}</p>
    </div>
    <div class="flex items-center gap-2">
      <Button type="button" variant="secondary" onclick={regenerateLink} loading={linkState.isCreating}>
        {$t(`${INVITE_MODAL}.regenerate_link`)}
      </Button>
      <Button type="button" variant="secondary" onclick={copyLink} loading={linkState.isCreating}>
        {$t(`${INVITE_MODAL}.copy_link`)}
      </Button>
    </div>
  </div>

  <div
    class="flex flex-col-reverse items-center justify-between gap-5 rounded-md border p-4 md:flex-row md:items-stretch"
  >
    <div class="flex flex-col items-center justify-between gap-3 md:items-start">
      <span class="text-sm font-medium">{$t(`${INVITE_MODAL}.share_via_qr`)}</span>
      <Button type="button" variant="secondary" loading={linkState.isLoadingQRDownload} onclick={handleQRDownload}>
        {$t(`${INVITE_MODAL}.download_qr`)}
      </Button>
    </div>

    <div class="w-full border-4 border-[#f7f7f7] p-1 md:w-28">
      <img src={linkState.qrImage} alt="link qrcode" class="h-full w-full" />
    </div>
  </div>
</div>

<div class="absolute left-[-1000px] w-160">
  <ShareQrImage qrImage={linkState.qrImage} />
</div>
