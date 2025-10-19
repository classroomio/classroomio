<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';
  import { untrack } from 'svelte';
  import copy from 'copy-to-clipboard';
  import { Popover } from 'carbon-components-svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import QRCode from 'qrcode';
  import { toPng } from 'html-to-image';

  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { ROLE } from '$lib/utils/constants/roles';
  import { addGroupMember, fetchGroup } from '$lib/utils/services/courses';
  import { course, setCourse } from '$lib/components/Course/store';
  import { MultiSelect, Loading } from 'carbon-components-svelte';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { getOrgTeam } from '$lib/utils/services/org';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import { qrInviteNodeStore } from './store';
  import { getStudentInviteLink } from '$lib/utils/functions/course';
  import ShareQrImage from './ShareQRImage.svelte';
  import { triggerSendEmail, NOTIFICATION_NAME } from '$lib/utils/services/notification/notification';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { t } from '$lib/utils/functions/translations';

  interface Tutor {
    id: number;
    text: string;
    email: string;
    profileId?: string;
  }

  let tutors: Tutor[] = $state([]);
  let selectedIds: Array<number> = $state([]);
  let selectedTutors: Tutor[] = $state([]);
  let isLoadingTutors = $state(false);
  let copied = $state(false);
  let qrImage = $state('');
  let isLoadingQRDownload = $state(false);

  const addPeopleParm = $derived(new URLSearchParams(page.url.search).get('add'));

  function onSubmit() {
    if (!selectedTutors.length) {
      goto(page.url.pathname);
      return;
    }

    let membersStack: { profile_id?: string; group_id?: string; role_id: number }[] = [];
    console.log(`$course`, $course);

    for (const tutor of selectedTutors) {
      membersStack.push({
        profile_id: tutor.profileId,
        group_id: $course.group?.id,
        role_id: ROLE.TUTOR
      });

      triggerSendEmail(NOTIFICATION_NAME.WELCOME_TEACHER_TO_COURSE, {
        to: tutor.email,
        name: tutor.text,
        orgName: $currentOrg.name,
        orgSiteName: $currentOrg.siteName,
        courseName: $course.title
      });
    }

    addGroupMember(membersStack).then(async () => {
      if (!$course?.group?.id) return;

      const group = await fetchGroup($course?.group?.id);

      setCourse(
        {
          ...$course,
          group: group.data
        },
        false
      );

      goto(page.url.pathname);
    });
  }

  function getTutors(team: OrgTeamMember[]) {
    const existingTutors = $course.group?.tutors || [];
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
      isLoadingTutors = true;

      const { team, error } = await getOrgTeam(orgId);
      if (error) {
        console.error('Error fetching teams', error);
        isLoadingTutors = false;
        return;
      }

      tutors = getTutors(team);

      isLoadingTutors = false;
    });
  }

  function copyLink() {
    if (!$currentOrgDomain) {
      snackbar.error('snackbar.people.error.missing_data');
      console.error('snackbar.people.error.no');
      return;
    }

    const link = getStudentInviteLink($course, $currentOrg.siteName, $currentOrgDomain);
    copy(link);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 1000);
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
          link.download = `${$course.slug}-qr-code.png`;
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
    generateQR(getStudentInviteLink($course, $currentOrg.siteName, $currentOrgDomain));
  });
</script>

<Modal
  onClose={() => closeModal()}
  open={addPeopleParm === 'true'}
  width="w-4/5 md:w-2/5"
  maxWidth="max-w-lg"
  modalHeading={$t('course.navItem.people.invite_modal.title')}
>
  <form onsubmit={preventDefault(onSubmit)}>
    <div class="mb-8">
      <p class="mb-1 text-base font-semibold">{$t('course.navItem.people.invite_modal.invite')}</p>
      <MultiSelect
        disabled={isLoadingTutors}
        label={$t('course.navItem.people.invite_modal.select')}
        bind:selectedIds
        items={tutors}
      />
      {#if isLoadingTutors}
        <span>
          <Loading withOverlay={false} small />
        </span>
      {:else}
        <span>
          {$t('course.navItem.people.invite_modal.to_add')}
          <a href={`/org/${$currentOrg.siteName}/settings/teams`} class="text-primary-600 underline">
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

      <div class="relative">
        <button type="button" onclick={copyLink} class="text-primary-800 cursor-pointer font-bold capitalize underline">
          {$t('course.navItem.people.invite_modal.copy_link')}
        </button>

        <Popover caret open={copied} align="left">
          <div style="padding: 5px">{$t('course.navItem.people.invite_modal.success')}</div>
        </Popover>
      </div>
    </div>

    <div
      class="flex w-full flex-col-reverse items-center justify-between gap-5 rounded-md border p-4 md:flex-row md:items-stretch"
    >
      <div class="flex flex-col items-center justify-between gap-3 md:items-start">
        <span class="text-sm font-medium">
          {$t('course.navItem.people.invite_modal.via_qr')}
        </span>

        <PrimaryButton
          isLoading={isLoadingQRDownload}
          onClick={handleQRDownload}
          label={$t('course.navItem.people.invite_modal.download_qr')}
          className="font-medium"
        />
      </div>

      <div class="w-full border-4 border-[#f7f7f7] p-1 md:w-28">
        <img src={qrImage} alt="link qrcode" class="h-full w-full" />
      </div>
    </div>

    <div class="absolute left-[-1000px] w-160">
      <ShareQrImage {qrImage} course={$course} currentOrg={$currentOrg} />
    </div>

    <div class="mt-5 flex flex-row-reverse items-center">
      <PrimaryButton className="px-6 py-3" label={$t('course.navItem.people.invite_modal.finish')} type="submit" />
    </div>
  </form>
</Modal>
