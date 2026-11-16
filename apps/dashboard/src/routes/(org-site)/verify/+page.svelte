<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { LandingThemeScope, OrgLandingPageFooter } from '@cio/ui/custom/org-landing-page';

  import { appInitApi } from '$features/app/init.svelte';
  import { resolveOrgLandingAuthAction } from '$features/org/utils/org-landing-auth-action';
  import { resolveOrgLandingLearnerAccount } from '$features/org/utils/org-landing-learner-account';
  import { user, profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';

  let { data } = $props();

  const NavComponent = $derived(data.NavComponent);

  const authAction = $derived(
    resolveOrgLandingAuthAction({
      org: data.org,
      locals: data.locals,
      user: $user,
      appInitApi
    })
  );

  const learnerAccount = $derived(
    resolveOrgLandingLearnerAccount({
      org: data.org,
      locals: data.locals,
      user: $user,
      profile: $profile,
      appInitApi
    })
  );

  let code = $state(data.code ?? '');

  $effect(() => {
    code = data.code ?? '';
  });

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const normalized = code.trim();
    if (!normalized) {
      try {
        await goto(resolve('/verify'));
      } catch {
        snackbar.error('verify.snackbar_failed');
      }

      return;
    }

    try {
      await goto(`${resolve('/verify')}?code=${encodeURIComponent(normalized)}`);
    } catch {
      snackbar.error('verify.snackbar_failed');
    }
  }

  const status = $derived(data.verify?.status ?? null);
  const isValid = $derived(status === 'valid');
  const isExpired = $derived(status === 'expired');
  const isRevoked = $derived(status === 'revoked');
  const titleText = $derived(
    data.verify ? `${data.verify.status} certificate` : data.code ? 'Certificate not found' : 'Verify a certificate'
  );
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
  <title>{titleText} · {data.org?.name ?? 'ClassroomIO'}</title>
</svelte:head>

<LandingThemeScope theme={data.theme}>
  {#if NavComponent}
    <NavComponent
      orgName={data.org?.name ?? 'ClassroomIO'}
      logoUrl={data.org?.avatarUrl ?? undefined}
      navItems={data.navItems}
      {authAction}
      {learnerAccount}
    />
  {/if}
  <div class="mx-auto max-w-[680px] px-5 py-14">
    {#if data.code}
      {#if data.notFound || !data.verify}
        <div class="ui:bg-card ui:border-border bg-card mb-6 rounded-xl border">
          <div class="flex items-center gap-4 border-b px-7 py-6">
            <div class="ui:bg-muted flex size-12 items-center justify-center rounded-full">🔍</div>
            <div>
              <h1 class="text-[22px] font-semibold tracking-tight">{$t('verify.not_found_title')}</h1>
              <p class="ui:text-muted-foreground text-sm">{$t('verify.not_found_subtitle')}</p>
            </div>
          </div>
          <div class="px-7 py-4">
            <p class="ui:text-muted-foreground text-[13px]">{$t('verify.not_found_hint')}</p>
          </div>
        </div>
      {:else}
        <div class="ui:bg-card ui:border-border bg-card mb-6 overflow-hidden rounded-xl border">
          <div
            class="flex items-center gap-4 border-b px-7 py-6"
            class:bg-emerald-50={isValid}
            class:bg-amber-50={isExpired}
            class:bg-red-50={isRevoked}
          >
            <div
              class="flex size-12 items-center justify-center rounded-full"
              class:bg-emerald-100={isValid}
              class:text-emerald-600={isValid}
              class:bg-amber-100={isExpired}
              class:text-amber-700={isExpired}
              class:bg-red-100={isRevoked}
              class:text-red-600={isRevoked}
            >
              {#if isValid}✓{:else if isExpired}◷{:else}✕{/if}
            </div>
            <div>
              {#if isValid}
                <h1 class="text-[22px] font-semibold text-emerald-700">{$t('verify.valid_title')}</h1>
                <p class="ui:text-muted-foreground text-sm">
                  {$t('verify.valid_subtitle', { orgName: data.verify.orgName })}
                </p>
              {:else if isExpired}
                <h1 class="text-[22px] font-semibold text-amber-700">
                  {$t('verify.expired_title', {
                    date: new Date(data.verify.expiresAt ?? '').toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  })}
                </h1>
                <p class="ui:text-muted-foreground text-sm">{$t('verify.expired_subtitle')}</p>
              {:else if isRevoked}
                <h1 class="text-[22px] font-semibold text-red-700">
                  {$t('verify.revoked_title', {
                    date: new Date(data.verify.revokedAt ?? '').toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  })}
                </h1>
                <p class="ui:text-muted-foreground text-sm">
                  {$t('verify.revoked_subtitle', { orgName: data.verify.orgName })}
                </p>
              {/if}
            </div>
          </div>

          <div class="px-7 pt-7">
            <div class="ui:text-muted-foreground text-[13px]">{$t('verify.certifies_that')}</div>
            <div class="text-[28px] font-semibold tracking-tight">{data.verify.recipientName}</div>
            <p class="mt-2 text-[16px] font-medium">
              {$t('verify.completed', { courseTitle: data.verify.courseTitle })}
            </p>
            <div class="ui:text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <span class="ui:bg-muted flex size-[22px] items-center justify-center rounded-full text-[11px]"
                >{data.verify.orgName.charAt(0)}</span
              >
              {$t('verify.issued_by', { orgName: data.verify.orgName })}
            </div>
          </div>

          <dl class="mx-7 mt-5 grid grid-cols-2 gap-0 border-t">
            <div class="border-b py-3.5">
              <dt class="ui:text-muted-foreground text-[12px] font-semibold tracking-[0.06em] uppercase">
                {$t('verify.issued')}
              </dt>
              <dd class="text-[15px] font-medium">
                {new Date(data.verify.issuedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </dd>
            </div>
            <div class="border-b py-3.5">
              {#if isRevoked}
                <dt class="ui:text-muted-foreground text-[12px] font-semibold tracking-[0.06em] uppercase">
                  {$t('verify.revoked_on')}
                </dt>
                <dd class="text-[15px] font-medium">
                  {new Date(data.verify.revokedAt ?? '').toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </dd>
              {:else if isExpired}
                <dt class="ui:text-muted-foreground text-[12px] font-semibold tracking-[0.06em] uppercase">
                  {$t('verify.expired_on')}
                </dt>
                <dd class="text-[15px] font-medium">
                  {new Date(data.verify.expiresAt ?? '').toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </dd>
              {:else}
                <dt class="ui:text-muted-foreground text-[12px] font-semibold tracking-[0.06em] uppercase">
                  {$t('verify.expires')}
                </dt>
                <dd class="text-[15px] font-medium">
                  {data.verify.expiresAt
                    ? new Date(data.verify.expiresAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : $t('verify.does_not_expire')}
                </dd>
              {/if}
            </div>
            <div class="col-span-2 border-b py-3.5">
              <dt class="ui:text-muted-foreground text-[12px] font-semibold tracking-[0.06em] uppercase">
                {$t('verify.certificate_code')}
              </dt>
              <dd class="font-mono text-[15px] font-semibold tracking-[0.08em]">{data.verify.certificateCode}</dd>
            </div>
          </dl>

          <div class="ui:text-muted-foreground flex items-center justify-between gap-4 px-7 py-5 text-[12.5px]">
            <span>{$t('verify.page_disclaimer', { orgName: data.verify.orgName })}</span>
            {#if data.verify.orgLogoUrl}
              <img src={data.verify.orgLogoUrl} alt={data.verify.orgName} class="h-6 w-auto" />
            {/if}
          </div>
        </div>
      {/if}
    {/if}

    <div class="ui:bg-card ui:border-border bg-card rounded-xl border p-7">
      <h1 class="text-2xl font-semibold tracking-tight">{$t('verify.verify_title')}</h1>
      <p class="ui:text-muted-foreground mt-2 text-[15px]">
        {$t('verify.verify_subtitle', { orgName: data.org?.name ?? $t('verify.certificate_fallback') })}
      </p>
      <form class="mt-5 flex gap-2" onsubmit={handleSubmit}>
        <Input
          bind:value={code}
          placeholder={$t('verify.placeholder')}
          aria-label={$t('verify.aria_label')}
          class="font-mono text-[17px] tracking-[0.08em] uppercase"
          autocomplete="off"
          autofocus={!data.code}
        />
        <Button type="submit" variant="default">{$t('verify.button')}</Button>
      </form>
    </div>
  </div>
  <OrgLandingPageFooter
    orgName={data.org?.name ?? ''}
    logoUrl={data.org?.avatarUrl ?? null}
    footer={data.footer}
    variant={data.theme}
  />
</LandingThemeScope>
