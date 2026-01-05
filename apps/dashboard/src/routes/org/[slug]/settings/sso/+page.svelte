<script lang="ts">
  import { SsoPage } from '$features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>SSO Settings - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>Single Sign-On (SSO)</Page.Title>
    <Page.Description>
      Configure SSO to allow users to sign in with your organization's identity provider (Okta, Auth0, Google Workspace, Azure AD).
    </Page.Description>
  </Page.HeaderContent>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <SsoPage />
  {/snippet}
</Page.Body>
