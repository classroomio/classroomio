<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { LandingThemeScope, OrgLandingPageFooter } from '@cio/ui/custom/org-landing-page';

  import { appInitApi } from '$features/app/init.svelte';
  import { resolveOrgLandingAuthAction } from '$features/org/utils/org-landing-auth-action';
  import { resolveOrgLandingLearnerAccount } from '$features/org/utils/org-landing-learner-account';
  import { user, profile } from '$lib/utils/store/user';

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

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const normalized = code.trim();
    if (!normalized) {
      goto('/verify');
      return;
    }
    goto(`/verify?code=${encodeURIComponent(normalized)}`);
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
              <h1 class="text-[22px] font-semibold tracking-tight">We couldn't find that certificate</h1>
              <p class="ui:text-muted-foreground text-sm">Check the code printed on the certificate and try again.</p>
            </div>
          </div>
          <div class="px-7 py-4">
            <p class="ui:text-muted-foreground text-[13px]">
              Codes have 8 characters and are not case-sensitive. They never contain the letters I, L, O or the digits
              0, 1.
            </p>
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
                <h1 class="text-[22px] font-semibold text-emerald-700">Valid certificate</h1>
                <p class="ui:text-muted-foreground text-sm">
                  This certificate was issued by {data.verify.orgName} and is currently valid.
                </p>
              {:else if isExpired}
                <h1 class="text-[22px] font-semibold text-amber-700">
                  Expired on {new Date(data.verify.expiresAt ?? '').toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h1>
                <p class="ui:text-muted-foreground text-sm">
                  This certificate was genuine, but its validity period has ended.
                </p>
              {:else if isRevoked}
                <h1 class="text-[22px] font-semibold text-red-700">
                  Revoked on {new Date(data.verify.revokedAt ?? '').toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h1>
                <p class="ui:text-muted-foreground text-sm">
                  {data.verify.orgName} has withdrawn this certificate. It should no longer be relied on.
                </p>
              {/if}
            </div>
          </div>

          <div class="px-7 pt-7">
            <div class="ui:text-muted-foreground text-[13px]">This certifies that</div>
            <div class="text-[28px] font-semibold tracking-tight">{data.verify.recipientName}</div>
            <p class="mt-2 text-[16px] font-medium">completed <b>{data.verify.courseTitle}</b></p>
            <div class="ui:text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <span class="ui:bg-muted flex size-[22px] items-center justify-center rounded-full text-[11px]"
                >{data.verify.orgName.charAt(0)}</span
              >
              Issued by {data.verify.orgName}
            </div>
          </div>

          <dl class="mx-7 mt-5 grid grid-cols-2 gap-0 border-t">
            <div class="border-b py-3.5">
              <dt class="ui:text-muted-foreground text-[12px] font-semibold tracking-[0.06em] uppercase">Issued</dt>
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
                  Revoked on
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
                  Expired on
                </dt>
                <dd class="text-[15px] font-medium">
                  {new Date(data.verify.expiresAt ?? '').toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </dd>
              {:else}
                <dt class="ui:text-muted-foreground text-[12px] font-semibold tracking-[0.06em] uppercase">Expires</dt>
                <dd class="text-[15px] font-medium">
                  {data.verify.expiresAt
                    ? new Date(data.verify.expiresAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'Does not expire'}
                </dd>
              {/if}
            </div>
            <div class="col-span-2 border-b py-3.5">
              <dt class="ui:text-muted-foreground text-[12px] font-semibold tracking-[0.06em] uppercase">
                Certificate code
              </dt>
              <dd class="font-mono text-[15px] font-semibold tracking-[0.08em]">{data.verify.certificateCode}</dd>
            </div>
          </dl>

          <div class="ui:text-muted-foreground flex items-center justify-between gap-4 px-7 py-5 text-[12.5px]">
            <span
              >This page confirms that {data.verify.orgName} issued this certificate. It does not say whether the course
              is accredited by any outside body.</span
            >
            {#if data.verify.orgLogoUrl}
              <img src={data.verify.orgLogoUrl} alt={data.verify.orgName} class="h-6 w-auto" />
            {/if}
          </div>
        </div>
      {/if}
    {/if}

    <div class="ui:bg-card ui:border-border bg-card rounded-xl border p-7">
      <h1 class="text-2xl font-semibold tracking-tight">Verify a certificate</h1>
      <p class="ui:text-muted-foreground mt-2 text-[15px]">
        Enter the code printed under the QR code on a {data.org?.name ?? 'certificate'}, or scan the QR code to open its
        page directly.
      </p>
      <form class="mt-5 flex gap-2" onsubmit={handleSubmit}>
        <Input
          bind:value={code}
          placeholder="Enter a code, e.g. 7KQM-4XH2"
          aria-label="Certificate code"
          class="font-mono text-[17px] tracking-[0.08em] uppercase"
          autocomplete="off"
          autofocus={!data.code}
        />
        <Button type="submit" variant="default">Verify</Button>
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
