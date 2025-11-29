<script lang="ts">
  import { goto } from '$app/navigation';
  import { ROUTE } from '$lib/utils/constants/routes';
  import { AuthUI } from '$lib/features/ui';
  import EmailSentIcon from '$lib/components/Icons/EmailSentIcon.svelte';
  import { forgotApi } from '$lib/features/auth/api/forgot.svelte';
  import type { TForgotPasswordForm } from '$lib/features/auth/utils/types';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import * as Card from '@cio/ui/base/card';

  let fields: TForgotPasswordForm = $state({ email: '' });
</script>

<svelte:head>
  <title>Forgot Password - ClassroomIO</title>
</svelte:head>

<AuthUI handleSubmit={() => forgotApi.submit(fields)} showOnlyContent={true} showLogo={!forgotApi.success}>
  {#if forgotApi.success}
    <div class="ui:flex ui:flex-col ui:items-center ui:justify-center ui:gap-4">
      <EmailSentIcon />
      <Card.Title class="ui:text-xl">Email Sent!</Card.Title>
      <p class="ui:text-center ui:text-sm ui:text-muted-foreground">
        We have sent a confirmation email to <span class="ui:text-primary">{fields.email}</span>. Kindly check your
        inbox to reset password or spam to reset your password.
      </p>
    </div>

    <div class="ui:mt-6 ui:flex ui:w-full ui:items-center ui:justify-end">
      <Button type="button" class="ui:w-full" onclick={() => goto(ROUTE.LOGIN)}>Okay</Button>
    </div>
  {:else}
    <div class="ui:flex ui:flex-col ui:gap-6">
      <div>
        <Card.Title class="ui:text-xl">Forgot Password</Card.Title>
        <Card.Description class="ui:mt-2">
          We will send you a reset link to your email
        </Card.Description>
      </div>
      <Field.Field>
        <Field.Label for="email">Your email</Field.Label>
        <Field.Content>
          <Input
            id="email"
            type="email"
            bind:value={fields.email}
            placeholder="you@domain.com"
            disabled={forgotApi.isLoading}
            autofocus
            aria-invalid={forgotApi.errors.email ? 'true' : undefined}
          />
          {#if forgotApi.errors.email}
            <Field.Error>{forgotApi.errors.email}</Field.Error>
          {/if}
        </Field.Content>
      </Field.Field>

      <div class="ui:flex ui:w-full ui:flex-col ui:gap-2">
        <Button type="submit" disabled={forgotApi.isLoading} loading={forgotApi.isLoading} class="ui:w-full">
          Reset Password
        </Button>
        <Button type="button" variant="ghost" class="ui:w-full" onclick={() => goto(ROUTE.LOGIN)}>
          Cancel
        </Button>
      </div>
    </div>
  {/if}
</AuthUI>
