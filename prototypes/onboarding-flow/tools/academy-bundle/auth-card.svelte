<script lang="ts">
  /*
   * features/ui/auth-ui.svelte with the three contents the org site puts in it: the enrol page
   * ((org-site)/course/[slug]/enroll), sign up ((auth)/signup) and log in ((auth)/login).
   * The page script owns the decisions and passes the result in; this renders the same card.
   */
  import * as Avatar from '@cio/ui/base/avatar';
  import * as Card from '@cio/ui/base/card';
  import * as Field from '@cio/ui/base/field';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Separator } from '@cio/ui/base/separator';
  import { Password } from '@cio/ui/custom/password';
  import { BrandWash } from '@cio/ui/custom/animation';
  import { t } from './copy';

  interface Props {
    mode: 'enroll' | 'signup' | 'login';
    orgName: string;
    logoUrl?: string;
    homeHref: string;
    course?: { title: string; description: string };
    backHref?: string;
    loading?: boolean;
    requiresPayment?: boolean;
    blockedMessage?: string;
    enrollmentError?: string;
    enrolledPendingVerification?: boolean;
    switchHref?: string;
    submitError?: string;
    errors?: Record<string, string>;
    onSubmit?: (fields: Record<string, string>) => void;
    onResend?: () => void;
    onSimulateVerify?: () => void;
    onGoogle?: () => void;
  }

  let {
    mode,
    orgName,
    logoUrl,
    homeHref,
    course,
    backHref = '#',
    loading = false,
    requiresPayment = false,
    blockedMessage = '',
    enrollmentError = '',
    enrolledPendingVerification = false,
    switchHref = '#',
    submitError = '',
    errors = {},
    onSubmit = () => {},
    onResend = () => {},
    onSimulateVerify = () => {},
    onGoogle = () => {}
  }: Props = $props();

  const fields = $state({ email: '', password: '', confirmPassword: '' });
  const showOnlyContent = $derived(mode === 'enroll');
  const confirmError = $derived(
    fields.confirmPassword && fields.confirmPassword !== fields.password ? 'Passwords do not match' : ''
  );
  const disableSubmit = $derived(
    mode === 'signup' ? fields.password.length < 8 || fields.password !== fields.confirmPassword : false
  );

  function submit(event: SubmitEvent) {
    event.preventDefault();
    onSubmit({ ...fields });
  }
</script>

<div
  class="auth-ui-background ui:bg-background relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4"
>
  <BrandWash />
  <div
    class="relative z-10 w-full max-w-[400px] drop-shadow-[0_10px_20px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
  >
    <Card.Root class="ui:notch-cutout w-full shadow-none">
      <Card.Header class="flex flex-col items-center gap-4">
        <a href={homeHref} class="inline-flex" aria-label={orgName}>
          <Avatar.Root>
            <Avatar.Image src={logoUrl || 'logo-192.png'} alt={orgName} />
            <Avatar.Fallback>{orgName}</Avatar.Fallback>
          </Avatar.Root>
        </a>
        {#if !showOnlyContent}
          <Card.Title class="text-2xl font-normal!">
            {mode === 'login' ? t('login.welcome') : t('login.create_account')}
          </Card.Title>
          {#if mode === 'login'}
            <Card.Description class="text-center">{t('login.sign_in_to_continue')}</Card.Description>
          {/if}
        {/if}
      </Card.Header>

      <Card.Content>
        <form onsubmit={submit}>
          {#if mode === 'enroll' && course}
            <div class="mt-0 w-full">
              <h3 class="mt-0 mb-4 text-center text-lg font-medium">{course.title}</h3>
              <p class="text-center text-sm font-light">{course.description}</p>
              {#if enrolledPendingVerification}
                <p class="ui:text-primary mt-3 text-center text-sm font-medium">
                  {t('course.navItem.landing_page.enroll_page.enrolled_success')}
                </p>
                <p class="ui:text-muted-foreground mt-2 text-center text-sm">
                  {t('course.navItem.landing_page.enroll_page.enrolled_verify_email')}
                </p>
                <div class="mt-4 flex justify-center">
                  <Button type="button" variant="outline" onclick={onResend}>{t('verify_email_modal.resend')}</Button>
                </div>
                <div class="mt-3 flex justify-center">
                  <Button type="button" variant="link" size="sm" onclick={onSimulateVerify}
                    >Prototype: simulate clicking the link in the email</Button
                  >
                </div>
              {:else if requiresPayment}
                <p class="ui:text-muted-foreground mt-3 text-center text-sm">
                  {t('course.navItem.landing_page.enroll_page.requires_payment_or_invite')}
                </p>
                <a href={backHref} class="ui:text-primary mt-3 block text-center text-sm underline">
                  {t('course.navItem.landing_page.enroll_page.back_to_course')}
                </a>
              {:else if enrollmentError}
                <p class="mt-3 text-center text-sm text-red-500">{enrollmentError}</p>
              {:else if blockedMessage}
                <p class="mt-3 text-center text-sm text-red-500">{blockedMessage}</p>
              {/if}
            </div>
            {#if !enrolledPendingVerification}
              <div class="my-4 flex w-full items-center justify-center">
                <Button type="submit" disabled={!!blockedMessage || requiresPayment || loading} {loading}>
                  {t('course.navItem.landing_page.enroll_page.join_course')}
                </Button>
              </div>
            {/if}
          {:else}
            <div class="flex flex-col gap-6">
              <Field.Field>
                <Field.Label for="email">{t(mode === 'login' ? 'login.email' : 'login.fields.email')}</Field.Label>
                <Field.Content>
                  <Input
                    id="email"
                    type="email"
                    bind:value={fields.email}
                    placeholder="you@domain.com"
                    disabled={loading}
                    aria-invalid={errors.email ? 'true' : undefined}
                    autocomplete="email"
                  />
                  {#if errors.email}<Field.Error>{errors.email}</Field.Error>{/if}
                </Field.Content>
              </Field.Field>
              <Field.Field>
                <Field.Label for="password">{t(mode === 'login' ? 'login.password' : 'login.fields.password')}</Field.Label>
                <Field.Content>
                  <Password
                    id="password"
                    bind:value={fields.password}
                    placeholder="************"
                    disabled={loading}
                    aria-invalid={errors.password ? 'true' : undefined}
                  />
                  {#if errors.password}
                    <Field.Error>{errors.password}</Field.Error>
                  {:else if mode === 'signup'}
                    <Field.Description>{t('login.fields.password_helper_message')}</Field.Description>
                  {/if}
                </Field.Content>
              </Field.Field>
              {#if mode === 'signup'}
                <Field.Field>
                  <Field.Label for="confirmPassword">{t('login.fields.confirm_password')}</Field.Label>
                  <Field.Content>
                    <Password id="confirmPassword" bind:value={fields.confirmPassword} placeholder="************" disabled={loading} />
                    {#if confirmError}<Field.Error>{confirmError}</Field.Error>{/if}
                  </Field.Content>
                </Field.Field>
              {/if}
              {#if submitError}
                <p class="ui:text-destructive text-sm">{submitError}</p>
              {/if}
              <Button type="submit" disabled={disableSubmit || loading} {loading} class="w-full">
                {mode === 'login' ? t('login.login') : t('login.create_account')}
              </Button>
            </div>
          {/if}
        </form>

        {#if !showOnlyContent}
          <div class="mt-6 flex flex-col gap-6">
            <div class="relative flex items-center justify-center">
              <Separator />
              <span class="ui:bg-card ui:text-muted-foreground absolute px-2 text-sm">{t('login.continue_with')}</span>
            </div>
            <Button variant="outline" onclick={onGoogle} disabled={loading} class="w-full">
              {mode === 'login' ? t('login.login_with_google') : t('login.signup_with_google')}
            </Button>
          </div>
        {/if}
      </Card.Content>
      {#if !showOnlyContent}
        <Card.Footer class="flex-col gap-2 border-t pt-6">
          <p class="ui:text-muted-foreground text-center text-sm">
            {#if mode === 'login'}
              {t('login.not_registered_yet')}
              <a class="ui:text-primary hover:underline" href={switchHref}>{t('login.signup')}</a>
            {:else}
              {t('login.already_have_account')}
              <a class="ui:text-primary hover:underline" href={switchHref}>{t('login.login')}</a>
            {/if}
          </p>
        </Card.Footer>
      {/if}
    </Card.Root>
  </div>
</div>
