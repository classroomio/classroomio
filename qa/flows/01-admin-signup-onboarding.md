# Flow 01 — Admin signup & onboarding

- **Personas:** new Admin (org owner)
- **Features covered (FEATURE_AUDIT §2):** 1 Auth & sessions · 2 Signup gating · 3 Onboarding & org creation · 4 Organizations (creation) · 35 Email (welcome, observed)
- **Modes:** cloud **and** self-host (high divergence — walk both)
- **Map refs:** FEATURE_AUDIT §3.1, §3.2, §3.3, §5, §6A

## Preconditions
- App running (`pnpm dev`), Postgres/Redis up (`pnpm docker:start`).
- For **cloud** run: `PUBLIC_IS_SELFHOSTED` ≠ `true`.
- For **self-host bootstrap** run: `PUBLIC_IS_SELFHOSTED=true` **and an empty `organization` table** (first-signup path).
- Have a fresh email you can receive mail at (to verify the welcome email / verification).

## Happy path — cloud

- [ ] **Open signup.** Go to `/signup` → form renders. _Ref:_ `apps/dashboard/src/routes/(auth)/signup`. _Watch for:_ broken layout, missing OAuth (Google) button.
- [ ] **Sign up with email/password.** Submit valid email + password → account created, no error. _Ref:_ `app.ts:106` (signupGuard), `auth.ts` (Better Auth), `create-profile.ts:39`. _Watch for:_ weak-password handling, duplicate-email message.
- [ ] **Profile auto-created.** A `profile` row exists for the user (username = email-prefix + timestamp). _Ref:_ `create-profile.ts:67-81`.
- [ ] **Email verification.** Verification email sent; clicking the link verifies. _Ref:_ `auth.ts:53-56`. _Watch for:_ link host correctness behind proxy.
- [ ] **Onboarding — metadata.** Land on `(auth)/onboarding`; enter name/goal/source → saved. _Ref:_ `onboarding.ts:22-33` (`/update-metadata`).
- [ ] **Onboarding — create org.** Enter org name + site name → org + admin member created, redirect to dashboard. _Ref:_ `services/onboarding.ts:19-98` (`createOrganizationWithOwner`), `/onboarding/create-org`.
- [ ] **Duplicate site name rejected.** Retry org creation with an existing site name → `409 SITENAME_EXISTS`, friendly message. _Ref:_ `onboarding.ts:36-40, 93-95`.
- [ ] **Welcome email.** `/onboarding/complete` fires → welcome email queued/received. _Ref:_ `onboarding.ts:121-134`.
- [ ] **Session works.** Reload dashboard → still logged in; `/session` returns user. _Ref:_ `app.ts:189-199`. _Watch for:_ session dropped on refresh, cookie domain issues.
- [ ] **OAuth signup (Google).** Sign up via Google → returns to dashboard logged in. _Ref:_ `auth.ts:57-64`. _Watch for:_ callback redirect failures (the oauth-handoff token swap, `app.ts:146-173`).

## Happy path — self-hosted (bootstrap)

- [ ] **First signup allowed.** With no org yet, sign up → allowed (bootstrap). _Ref:_ `signup-guard.ts:80-83`.
- [ ] **Email auto-verified.** First self-host user is auto-verified (no verification email needed). _Ref:_ `create-profile.ts:26-59`.
- [ ] **Create the one org.** Onboarding creates the org + assigns **ENTERPRISE/selfhosted** plan. _Ref:_ `services/onboarding.ts:64-77`.
- [ ] **Second org blocked.** Attempt to create another org → `403` "single organization". _Ref:_ `services/onboarding.ts:28-33`. _Watch for:_ "add org" UI should be **hidden** (`+layout.svelte:29-31`).

## Edge cases / probes (file a bug if any misbehave)

- [ ] **Self-host, org exists, no `cio-org-id`, email not a member** → `400 ORG_CONTEXT_REQUIRED`. _Ref:_ `signup-guard.ts:85-90`.
- [ ] **Invite-only org without invite** → `403 INVITE_REQUIRED`. _Ref:_ `signup-guard.ts:97-113`.
- [ ] **Disabled signup org** → `403 SIGNUP_DISABLED`. _Ref:_ `signup-guard.ts:148-149`.
- [ ] **Unparseable signup body** → `400 INVALID_REQUEST`. _Ref:_ `signup-guard.ts:100-101`.
- [ ] **`getSession` failure** falls through as anonymous (no crash). _Ref:_ `app.ts:71-84`.

**Coverage:** features 1, 2, 3, 4(create), 35(welcome email).
