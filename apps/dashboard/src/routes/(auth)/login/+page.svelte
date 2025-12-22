<script lang="ts">
  import { AuthUI } from '$features/ui';
  import { LOGIN_FIELDS } from '$lib/utils/constants/authentication';
  import { t } from '$lib/utils/functions/translations';
  import { authValidation } from '$lib/utils/functions/validator';
  import { currentOrg } from '$lib/utils/store/org';
  import { authClient } from '$lib/utils/services/auth/client';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { globalStore } from '$lib/utils/store/app';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Password } from '@cio/ui/custom/password';
  import { Button } from '@cio/ui/base/button';

  let fields = $state(Object.assign({}, LOGIN_FIELDS));
  let submitError: string | undefined = $state();
  let loading = $state(false);
  let errors = $state(Object.assign({}, LOGIN_FIELDS));

  async function handleSubmit() {
    const validationRes = authValidation(fields);
    console.log('validationRes', validationRes);

    if (Object.keys(validationRes).length) {
      errors = Object.assign(errors, validationRes);
      return;
    }

    try {
      loading = true;

      const { data, error } = await authClient.signIn.email(
        {
          email: fields.email,
          password: fields.password
        },
        {
          onSuccess: () => {
            capturePosthogEvent('login', {
              email: fields.email
            });

            if ($globalStore.isOrgSite) {
              capturePosthogEvent('student_login', {
                email: fields.email
              });
            }

            window.location.href = '/';
          }
        }
      );

      console.log('data', data);

      if (error) throw error;
    } catch (error: any) {
      submitError = error.error_description || error.message;
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Welcome back to {$currentOrg.name || 'ClassroomIO'}</title>
</svelte:head>

<AuthUI isLogin={true} {handleSubmit} isLoading={loading}>
  <div class="ui:flex ui:flex-col ui:gap-6">
    <Field.Field>
      <Field.Label for="email">{$t('login.email')}</Field.Label>
      <Field.Content>
        <Input
          id="email"
          type="email"
          bind:value={fields.email}
          placeholder="you@domain.com"
          disabled={loading}
          autofocus
          aria-invalid={errors.email ? 'true' : undefined}
          autocomplete="username"
        />
        {#if errors.email}
          <Field.Error>{$t(errors.email)}</Field.Error>
        {/if}
      </Field.Content>
    </Field.Field>

    <Field.Field>
      <div class="ui:flex ui:items-center ui:justify-between">
        <Field.Label for="password">{$t('login.password')}</Field.Label>
        <a class="ui:text-sm ui:text-primary ui:hover:underline" href="/forgot">
          {$t('login.forgot')}
        </a>
      </div>
      <Field.Content>
        <Password
          id="password"
          bind:value={fields.password}
          placeholder="************"
          disabled={loading}
          aria-invalid={errors.password ? 'true' : undefined}
          autocomplete="current-password"
        />
        {#if errors.password}
          <Field.Error>{$t(errors.password)}</Field.Error>
        {/if}
      </Field.Content>
    </Field.Field>

    {#if submitError}
      <p class="ui:text-sm ui:text-destructive">{submitError}</p>
    {/if}

    <Button type="submit" disabled={loading} {loading} class="ui:w-full">
      {$t('login.login')}
    </Button>
  </div>
</AuthUI>
