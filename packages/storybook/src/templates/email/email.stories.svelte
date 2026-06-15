<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { EmailPreview } from '@cio/ui';
  import {
    forgotPasswordHtml,
    welcomeHtml,
    verifyEmailHtml,
    courseWelcomeHtml,
    inviteTeacherHtml,
    newsfeedPostHtml,
    studentJoinedHtml
  } from './fixtures';

  const { Story } = defineMeta({
    title: 'Templates/Email',
    component: EmailPreview.Preview,
    parameters: {
      layout: 'fullscreen'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Auth: Verify Email">
  {#snippet template()}
    <EmailPreview.Preview html={verifyEmailHtml} />
  {/snippet}
</Story>

<Story name="Auth: Forgot Password">
  {#snippet template()}
    <EmailPreview.Preview html={forgotPasswordHtml} />
  {/snippet}
</Story>

<Story name="Auth: Welcome">
  {#snippet template()}
    <EmailPreview.Preview html={welcomeHtml} />
  {/snippet}
</Story>

<Story name="Org: Course Welcome">
  {#snippet template()}
    <EmailPreview.Preview html={courseWelcomeHtml} />
  {/snippet}
</Story>

<Story name="Org: Invite Teacher">
  {#snippet template()}
    <EmailPreview.Preview html={inviteTeacherHtml} />
  {/snippet}
</Story>

<Story name="Org: Newsfeed Post">
  {#snippet template()}
    <EmailPreview.Preview html={newsfeedPostHtml} />
  {/snippet}
</Story>

<Story name="System Notification: Student Joined">
  {#snippet template()}
    <EmailPreview.Preview html={studentJoinedHtml} />
  {/snippet}
</Story>
