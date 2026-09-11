<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { LearnerMenu, LandingThemeScope, LandingButton, LandingNavCta } from '@cio/ui/custom/org-landing-page';
  import type { LandingLearnerAccount, OrgLandingPageTheme } from '@cio/ui/custom/org-landing-page/types';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/LandingLearnerMenu',
    component: LearnerMenu,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onThemeChange: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  type NavAuthAction = {
    label: string;
    href: string;
    loading?: boolean;
    disabled?: boolean;
  };

  const sampleAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces';
  const sampleAvatar2 = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces';

  const memberAccount: LandingLearnerAccount = {
    fullname: 'John Doe',
    email: 'john@northwind.com',
    avatarUrl: sampleAvatar,
    items: [
      { key: 'myCourses', label: 'My Courses', href: '/lms' },
      { key: 'myCertificates', label: 'My Certificates', href: '/lms/certificates' },
      { key: 'accountSettings', label: 'Account Settings', href: '/lms/settings' }
    ],
    logoutLabel: 'Log Out',
    logoutHref: '/logout',
    themeLabel: 'Theme',
    triggerLabel: 'Account menu, signed in as rotimi@northwind.com'
  };

  const nonMemberOpenAccount: LandingLearnerAccount = {
    fullname: 'Mark Clark',
    email: 'mark@contoso.com',
    avatarUrl: sampleAvatar2,
    items: [{ key: 'accountSettings', label: 'Account Settings', href: '/lms/settings' }],
    note: 'Not enrolled in this academy yet — learner destinations appear after joining.',
    logoutLabel: 'Log Out',
    logoutHref: '/logout',
    themeLabel: 'Theme',
    triggerLabel: 'Account menu, signed in as dayo@contoso.com'
  };

  const nonMemberInviteOnlyAccount: LandingLearnerAccount = {
    fullname: 'Edison Michael',
    email: 'edison@contoso.com',
    avatarUrl: sampleAvatar2,
    items: [{ key: 'accountSettings', label: 'Account Settings', href: '/lms/settings' }],
    logoutLabel: 'Log Out',
    logoutHref: '/logout',
    themeLabel: 'Theme',
    triggerLabel: 'Account menu, signed in as dayo@contoso.com'
  };

  const loadingAccount: LandingLearnerAccount = {
    fullname: '',
    email: '',
    items: [],
    logoutLabel: 'Log Out',
    logoutHref: '/logout',
    themeLabel: 'Theme',
    triggerLabel: 'Account menu',
    loading: true
  };

  const fallbackAccount: LandingLearnerAccount = {
    fullname: '',
    email: 'linda.k@verylongcompanydomainname.example',
    items: [
      { key: 'myCourses', label: 'My Courses', href: '/lms' },
      { key: 'myCertificates', label: 'My Certificates', href: '/lms/certificates' },
      { key: 'accountSettings', label: 'Account Settings', href: '/lms/settings' }
    ],
    logoutLabel: 'Log Out',
    logoutHref: '/logout',
    themeLabel: 'Theme',
    triggerLabel: 'Account menu, signed in as linda.k@verylongcompanydomainname.example'
  };

  const inertAccount: LandingLearnerAccount = {
    ...memberAccount,
    inert: true
  };

  const memberAuthAction: NavAuthAction = {
    label: 'Continue Learning',
    href: '/lms'
  };

  const joinAcademyAuthAction: NavAuthAction = {
    label: 'Join Academy',
    href: '/join-academy'
  };

  const allThemes: OrgLandingPageTheme[] = [
    'quartz',
    'bold',
    'classic',
    'saas',
    'tech',
    'studio',
    'corporate',
    'terminal',
    'editorial',
    'vibrant',
    'minimal'
  ];

  const THEME_NAV_BUTTON_CONFIG: Record<OrgLandingPageTheme, { variant: 'primary' | 'secondary'; class?: string }> = {
    minimal: { variant: 'secondary', class: 'ui:rounded-full' },
    bold: { variant: 'secondary', class: 'ui:rounded-xl ui:font-bold' },
    classic: {
      variant: 'secondary',
      class:
        'ui:bg-transparent ui:text-[var(--landing-bg)] ui:border-[var(--landing-bg)]/40 ui:hover:bg-[var(--landing-bg)]/10 ui:hover:text-[var(--landing-bg)] ui:hover:border-[var(--landing-bg)]/60'
    },
    saas: { variant: 'primary', class: 'ui:rounded-full ui:px-4' },
    tech: { variant: 'secondary', class: 'ui:rounded-none ui:font-semibold' },
    studio: { variant: 'primary', class: 'ui:rounded-md ui:px-3.5' },
    corporate: { variant: 'primary', class: 'ui:rounded-none ui:px-4 ui:font-medium' },
    terminal: { variant: 'secondary', class: 'ui:rounded-full ui:px-4 ui:font-medium' },
    editorial: { variant: 'primary', class: 'ui:rounded-full ui:px-4 ui:font-medium' },
    vibrant: { variant: 'primary', class: 'ui:rounded-md ui:px-4 ui:font-medium' },
    quartz: { variant: 'primary', class: '' }
  };
</script>

{#snippet navRow(
  account: LandingLearnerAccount,
  authAction?: NavAuthAction,
  theme: OrgLandingPageTheme = 'quartz',
  inert = false
)}
  <div class="w-[500px] rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    {#if inert}
      <p class="mb-2 text-xs text-gray-500">Inert (Preview Mode — trigger not clickable)</p>
    {/if}
    <LandingThemeScope
      {theme}
      class="ui:min-h-0 ui:bg-transparent flex items-center justify-between {inert
        ? 'rounded border border-dashed border-gray-300 p-3'
        : ''}"
    >
      <div class="flex items-center gap-2.5">
        <span
          class="flex size-6 items-center justify-center rounded bg-[var(--landing-fg)] text-xs font-bold text-[var(--landing-bg)]"
          >C</span
        >
        <span class="text-sm font-semibold text-[var(--landing-fg)]">ClassroomIO</span>
      </div>
      <div class="flex items-center gap-3">
        {#if authAction}
          <LandingNavCta {authAction} {theme} />
        {/if}
        <LearnerMenu {account} {authAction} {theme} />
      </div>
    </LandingThemeScope>
  </div>
{/snippet}

<Story name="Member">
  {#snippet template()}
    {@render navRow(memberAccount, memberAuthAction)}
  {/snippet}
</Story>

<Story name="NonMemberOpen">
  {#snippet template()}
    {@render navRow(nonMemberOpenAccount, joinAcademyAuthAction)}
  {/snippet}
</Story>

<Story name="NonMemberInviteOnly">
  {#snippet template()}
    {@render navRow(nonMemberInviteOnlyAccount)}
  {/snippet}
</Story>

<Story name="Loading">
  {#snippet template()}
    {@render navRow(loadingAccount, { label: 'Continue Learning', href: '#', loading: true })}
  {/snippet}
</Story>

<Story name="NoAvatarNoFullName">
  {#snippet template()}
    {@render navRow(fallbackAccount, memberAuthAction)}
  {/snippet}
</Story>

<Story name="Inert">
  {#snippet template()}
    {@render navRow(inertAccount, memberAuthAction, 'quartz', true)}
  {/snippet}
</Story>

<Story name="AllThemes">
  {#snippet template()}
    <div class="grid grid-cols-2 gap-6 p-6 md:grid-cols-3">
      {#each allThemes as t (t)}
        <LandingThemeScope
          theme={t}
          class="ui:min-h-0 flex flex-col items-end gap-3 rounded-lg border border-gray-200 p-6 shadow-sm"
        >
          <span class="self-start font-mono text-xs tracking-wider uppercase">{t}</span>
          <div class="flex items-center gap-3">
            <LandingNavCta authAction={memberAuthAction} theme={t} />
            <LearnerMenu account={memberAccount} authAction={memberAuthAction} theme={t} />
          </div>
        </LandingThemeScope>
      {/each}
    </div>
  {/snippet}
</Story>
