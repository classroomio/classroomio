<script lang="ts">
  import QRCode from 'qrcode';
  import { untrack } from 'svelte';
  import { page } from '$app/state';
  import copy from 'copy-to-clipboard';
  import { toPng } from 'html-to-image';
  import { goto } from '$app/navigation';
  import XIcon from '@lucide/svelte/icons/x';
  import { Badge } from '@cio/ui/base/badge';
  import * as Select from '@cio/ui/base/select';
  import { Spinner } from '@cio/ui/base/spinner';
  import * as Popover from '@cio/ui/base/popover';

  import { qrInviteNodeStore } from './store';
  import { ROLE } from '@cio/utils/constants';
  import { orgApi } from '$features/org/api/org.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import { preventDefault } from '$lib/utils/functions/svelte';
  import { courseApi } from '$features/course/api';
  import { getStudentInviteLink } from '$lib/utils/functions/course';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { peopleApi } from '$features/course/api';

  import ShareQrImage from './share-qr-image.svelte';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';

  interface Tutor {
    id: number;
    text: string;
    email: string;
    profileId?: string;
  }

  let tutors: Tutor[] = $state([]);
  let selectedIds: string[] = $state([]);
  let courseId = $derived(courseApi.course?.id ?? '');

  const selectedTutors = $derived(tutors.filter((tutor) => selectedIds.includes(tutor.id.toString())));
  let qrImage = $state('');
  let isLoadingQRDownload = $state(false);

  const addPeopleParm = $derived(new URLSearchParams(page.url.search).get('add'));

  async function onSubmit() {
    if (!selectedTutors.length) {
      goto(page.url.pathname);
      return;
    }

    // Prepare members array with all required data for email sending
    const members = selectedTutors.map((tutor) => ({
      profileId: tutor.profileId,
      roleId: ROLE.TUTOR,
      email: tutor.email,
      name: tutor.text
    }));

    await peopleApi.add(courseId, members);

    if (peopleApi.success) {
      // Refresh course data to get updated group members
      goto(page.url.pathname);
    }
  }

  function getTutors(team: OrgTeamMember[]) {
    const existingTutors = courseApi?.group?.tutors || [];
    return team
      .filter((teamMember) => teamMember.verified)
      .filter((teamMember) => {
        // filter out teamMembers that have already been added
        return !existingTutors.some((t) => t.id === teamMember.profileId);
      })
      .map((teamMember) => ({
        id: teamMember.id,
        text: teamMember.fullname,
        profileId: teamMember.profileId,
        email: teamMember.email
      }));
  }

  function setTutors(orgId: string | undefined) {
    if (!orgId) return;

    untrack(async () => {
      await orgApi.getOrgTeam();

      if (orgApi.error) {
        console.error('Error fetching teams', orgApi.error);
        return;
      }

      tutors = getTutors(orgApi.teamMembers);
    });
  }

  function copyLink() {
    if (!courseApi.course) return;

    if (!$currentOrgDomain) {
      snackbar.error('snackbar.people.error.missing_data');
      console.error('snackbar.people.error.no');
      return;
    }

    const link = getStudentInviteLink(courseApi.course, $currentOrg.siteName!, $currentOrgDomain);
    copy(link);
  }

  function closeModal() {
    goto(page.url.pathname);
  }

  function handleQRDownload() {
    if (!$qrInviteNodeStore) {
      console.error('Node is not defined');
      return;
    }

    isLoadingQRDownload = true;
    setTimeout(() => {
      toPng($qrInviteNodeStore)
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `${courseApi.course?.slug}-qr-code.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((error) => {
          isLoadingQRDownload = false;
          console.error('Oops, something went wrong!', error);
        })
        .finally(() => {
          isLoadingQRDownload = false;
        });
    }, 300);
  }

  async function generateQR(text) {
    try {
      const image = await QRCode.toDataURL(text);
      untrack(() => {
        qrImage = image;
      });
    } catch (err) {
      console.error(err);
    }
  }

  $effect(() => {
    setTutors($currentOrg.id);
  });

  $effect(() => {
    if (!courseApi.course) return;

    generateQR(getStudentInviteLink(courseApi.course, $currentOrg.siteName!, $currentOrgDomain));
  });
</script>

<Dialog.Root
  open={addPeopleParm === 'true'}
  onOpenChange={(isOpen) => {
    if (!isOpen) closeModal();
  }}
>
  <Dialog.Content class="w-4/5 max-w-lg md:w-2/5">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.people.invite_modal.title')}</Dialog.Title>
    </Dialog.Header>
    <form onsubmit={preventDefault(onSubmit)}>
      <div class="mb-8">
        <p class="mb-1 text-base font-semibold">{$t('course.navItem.people.invite_modal.invite')}</p>
        <Select.Root type="multiple" bind:value={selectedIds} disabled={orgApi.isLoading}>
          <Select.Trigger class="w-full">
            <div>
              {#if selectedTutors.length > 0}
                <div class="flex flex-wrap gap-1">
                  {#each selectedTutors as tutor}
                    <Badge variant="secondary" class="flex items-center gap-1">
                      {tutor.text}
                      <button
                        type="button"
                        onclick={(e) => {
                          e.stopPropagation();
                          selectedIds = selectedIds.filter((id) => id !== tutor.id.toString());
                        }}
                        class="rounded-sm hover:bg-gray-200"
                      >
                        <XIcon size={14} />
                      </button>
                    </Badge>
                  {/each}
                </div>
              {:else}
                {$t('course.navItem.people.invite_modal.select')}
              {/if}
            </div>
          </Select.Trigger>
          <Select.Content>
            {#each tutors as tutor}
              <Select.Item value={tutor.id.toString()}>
                {tutor.text}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        {#if orgApi.isLoading}
          <div class="mt-2 flex items-center gap-2">
            <Spinner class="h-4 w-4" />
            <span class="text-sm">Loading...</span>
          </div>
        {:else}
          <span class="mt-2 block text-sm">
            {$t('course.navItem.people.invite_modal.to_add')}
            <a href={`/org/${$currentOrg.siteName}/settings/teams`} class="ui:text-primary underline">
              {$t('course.navItem.people.invite_modal.go_to')}
            </a>
          </span>
        {/if}
      </div>

      <div class="mb-8 flex w-full items-center justify-between">
        <div class="w-3/5">
          <p class="mb-1 text-base font-semibold">
            {$t('course.navItem.people.invite_modal.invite_students')}
          </p>
          <p class=" text-sm">{$t('course.navItem.people.invite_modal.via_link')}</p>
        </div>

        <Popover.Root>
          <Popover.Trigger>
            <button type="button" onclick={copyLink} class="text-primary-800 cursor-pointer capitalize underline">
              {$t('course.navItem.people.invite_modal.copy_link')}
            </button>
          </Popover.Trigger>
          <Popover.Content align="start" class="w-auto">
            <div class="p-1 text-sm">{$t('course.navItem.people.invite_modal.success')}</div>
          </Popover.Content>
        </Popover.Root>
      </div>

      <div
        class="flex w-full flex-col-reverse items-center justify-between gap-5 rounded-md border p-4 md:flex-row md:items-stretch"
      >
        <div class="flex flex-col items-center justify-between gap-3 md:items-start">
          <span class="text-sm font-medium">
            {$t('course.navItem.people.invite_modal.via_qr')}
          </span>

          <Button variant="outline" loading={isLoadingQRDownload} onclick={handleQRDownload}>
            {$t('course.navItem.people.invite_modal.download_qr')}
          </Button>
        </div>

        <div class="w-full border-4 border-[#f7f7f7] p-1 md:w-28">
          <img src={qrImage} alt="link qrcode" class="h-full w-full" />
        </div>
      </div>

      <div class="absolute left-[-1000px] w-160">
        <ShareQrImage {qrImage} />
      </div>

      <div class="mt-5 flex flex-row-reverse items-center">
        <Button variant="secondary" type="submit">
          {$t('course.navItem.people.invite_modal.finish')}
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
