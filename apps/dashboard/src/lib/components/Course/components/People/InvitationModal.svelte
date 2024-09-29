<script lang="ts">
  import copy from 'copy-to-clipboard';
  import { Popover } from 'carbon-components-svelte';
  import { page } from '$app/stores';
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
  import {
    triggerSendEmail,
    NOTIFICATION_NAME
  } from '$lib/utils/services/notification/notification';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { t } from '$lib/utils/functions/translations';

  export let batch;

  $: console.log('current batch', batch);

  interface Tutor {
    id: number;
    text: string;
    email: string;
    profileId?: string;
  }

  let addPeopleParm;
  let tutors: Tutor[] = [];
  let selectedIds: Array<number> = [];
  let selectedTutors: Tutor[] = [];
  let isLoadingTutors = false;
  let copied = false;
  let qrImage = '';
  let isLoadingQRDownload = false;

  function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
  }
  const formatSelected = (i: Array<number>): Tutor[] =>
    i.length === 0 ? [] : i.map((id) => tutors.find((tutor) => tutor.id === id)).filter(notEmpty);

  function onSubmit() {
    if (!selectedTutors.length) {
      goto($page.url.pathname);
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

    addGroupMember(membersStack).then(async (membersAdded) => {
      if (!$course?.group?.id) return;

      const group = await fetchGroup($course?.group?.id);

      setCourse(
        {
          ...$course,
          group: group.data
        },
        false
      );

      goto($page.url.pathname);
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

  async function setTutors(orgId: string | undefined) {
    if (!orgId) return;

    isLoadingTutors = true;
    const { team, error } = await getOrgTeam(orgId);
    if (error) {
      console.error('Error fetching teams', error);
      isLoadingTutors = false;
      return;
    }

    tutors = getTutors(team);

    isLoadingTutors = false;
  }

  function copyLink() {
    if (!$currentOrgDomain) {
      snackbar.error('snackbar.people.error.missing_data');
      console.error('snackbar.people.error.no');
      return;
    }

    const link = getStudentInviteLink(batch, $course, $currentOrg.siteName, $currentOrgDomain);
    copy(link);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 1000);
  }

  function closeModal() {
    goto($page.url.pathname);
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
      qrImage = await QRCode.toDataURL(text);
    } catch (err) {
      console.error(err);
    }
  }

  $: {
    selectedTutors = formatSelected(selectedIds);
    const query = new URLSearchParams($page.url.search);
    addPeopleParm = query.get('add');
  }

  $: setTutors($currentOrg.id);
  $: generateQR(getStudentInviteLink($course, $currentOrg.siteName, $currentOrgDomain));
</script>

<Modal
  onClose={() => closeModal()}
  open={addPeopleParm === 'true'}
  width="w-4/5 md:w-2/5"
  maxWidth="max-w-lg"
  modalHeading={$t('course.navItem.people.invite_modal.title')}
>
  <form on:submit|preventDefault={onSubmit}>
    <div class="mb-8">
      <p class="text-base mb-1 font-semibold">{$t('course.navItem.people.invite_modal.invite')}</p>
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
          <a
            href={`/org/${$currentOrg.siteName}/settings/teams`}
            class="underline text-primary-600"
          >
            {$t('course.navItem.people.invite_modal.go_to')}
          </a>
        </span>
      {/if}
    </div>

    <div class="mb-8 w-full flex justify-between items-center">
      <div class="w-3/5">
        <p class="text-base mb-1 font-semibold">
          {$t('course.navItem.people.invite_modal.invite_students')}
        </p>
        <p class=" text-sm">{$t('course.navItem.people.invite_modal.via_link')}</p>
      </div>

      <div class="relative">
        <button
          type="button"
          on:click={copyLink}
          class="underline text-primary-800 font-bold cursor-pointer capitalize"
        >
          {$t('course.navItem.people.invite_modal.copy_link')}
        </button>

        <Popover caret open={copied} align="left">
          <div style="padding: 5px">{$t('course.navItem.people.invite_modal.success')}</div>
        </Popover>
      </div>
    </div>

    <div
      class="flex gap-5 flex-col-reverse md:flex-row justify-between items-center md:items-stretch p-4 w-full border rounded-md"
    >
      <div class="flex flex-col gap-3 items-center md:items-start justify-between">
        <span class="font-medium text-sm">
          {$t('course.navItem.people.invite_modal.via_qr')}
        </span>

        <PrimaryButton
          isLoading={isLoadingQRDownload}
          onClick={handleQRDownload}
          label={$t('course.navItem.people.invite_modal.download_qr')}
          className="font-medium"
        />
      </div>

      <div class="w-full md:w-28 border-4 p-1 border-[#f7f7f7]">
        <img src={qrImage} alt="link qrcode" class="w-full h-full" />
      </div>
    </div>

    <div class="absolute left-[-1000px] w-[40rem]">
      <ShareQrImage {qrImage} course={$course} currentOrg={$currentOrg} />
    </div>

    <div class="mt-5 flex items-center flex-row-reverse">
      <PrimaryButton
        className="px-6 py-3"
        label={$t('course.navItem.people.invite_modal.finish')}
        type="submit"
      />
    </div>
  </form>
</Modal>
