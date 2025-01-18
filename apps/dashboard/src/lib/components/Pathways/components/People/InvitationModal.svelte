<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Loading, MultiSelect, Popover } from 'carbon-components-svelte';
  import copy from 'copy-to-clipboard';
  import { toPng } from 'html-to-image';
  import QRCode from 'qrcode';

  import { snackbar } from '$lib/components/Snackbar/store';
  import { ROLE } from '$lib/utils/constants/roles';
  import { getStudentInviteLink } from '$lib/utils/functions/pathway';
  import { t } from '$lib/utils/functions/translations';
  import { addGroupMember, fetchGroup } from '$lib/utils/services/courses';
  import {
    NOTIFICATION_NAME,
    triggerSendEmail
  } from '$lib/utils/services/notification/notification';
  import { getOrgTeam } from '$lib/utils/services/org';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import type { OrgTeamMember } from '$lib/utils/types/org';
  import { pathway, setPathway } from '../../store';
  import { qrInviteNodeStore } from './store';

  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import ShareQrImage from './ShareQRImage.svelte';

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
    console.log(`$pathway`, $pathway);

    for (const tutor of selectedTutors) {
      membersStack.push({
        profile_id: tutor.profileId,
        group_id: $pathway.group?.id,
        role_id: ROLE.TUTOR
      });

      triggerSendEmail(NOTIFICATION_NAME.WELCOME_TEACHER_TO_PATHWAY, {
        to: tutor.email,
        name: tutor.text,
        orgName: $currentOrg.name,
        orgSiteName: $currentOrg.siteName,
        pathwayName: $pathway.title
      });
    }

    addGroupMember(membersStack).then(async (membersAdded) => {
      if (!$pathway?.group?.id) return;

      const group = await fetchGroup($pathway?.group?.id);

      setPathway(
        {
          ...$pathway,
          group: group.data
        },
        false
      );

      goto($page.url.pathname);
    });
  }

  function getTutors(team: OrgTeamMember[]) {
    const existingTutors = $pathway.group?.tutors || [];

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

    console.log('tutors', tutors);

    isLoadingTutors = false;
  }

  function copyLink() {
    if (!$currentOrgDomain) {
      snackbar.error('snackbar.people.error.missing_data');
      console.error('snackbar.people.error.no');
      return;
    }

    const link = getStudentInviteLink($pathway, $currentOrg.siteName, $currentOrgDomain);
    console.log('link', link);

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
          link.download = `${$pathway.slug}-qr-code.png`;
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
  $: generateQR(getStudentInviteLink($pathway, $currentOrg.siteName, $currentOrgDomain));
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
          <a
            href={`/org/${$currentOrg.siteName}/settings/teams`}
            class="text-primary-600 underline"
          >
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
        <button
          type="button"
          on:click={copyLink}
          class="text-primary-800 cursor-pointer font-bold capitalize underline"
        >
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

    <div class="absolute left-[-1000px] w-[40rem]">
      <ShareQrImage {qrImage} pathway={$pathway} currentOrg={$currentOrg} />
    </div>

    <div class="mt-5 flex flex-row-reverse items-center">
      <PrimaryButton
        className="px-6 py-3"
        label={$t('course.navItem.people.invite_modal.finish')}
        type="submit"
      />
    </div>
  </form>
</Modal>
