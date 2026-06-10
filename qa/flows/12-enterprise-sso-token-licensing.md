# Flow 12 — Enterprise SSO, token auth & licensing

- **Personas:** Admin (self-host enterprise)
- **Features covered (FEATURE_AUDIT §2):** 30 Enterprise SSO · 31 Token auth · 32 Licensing
- **Modes:** **self-host** (license-gated). On cloud, `requireLicense` is a no-op — spot-check that these are always allowed.
- **Map refs:** FEATURE_AUDIT §3.24, §3.25, §5

## Preconditions
- Self-host instance (`PUBLIC_IS_SELFHOSTED=true`).
- A test OIDC IdP (Okta / Google Workspace / Auth0) for SSO.
- A valid `LICENSE_KEY` for the licensed-on path, and a run **without** it for the gated path.

## Happy path — licensing gate
- [ ] **No license → features gated.** Without `LICENSE_KEY`, SSO/token-auth are blocked. Confirm whether UI is **hidden** vs returns **403** (audit §7.7 — verify exact UX). _Ref:_ `middlewares/license.ts:15-22`, `routes/license.ts`, `lib/features/license`.
- [ ] **Set license → features unlock.** Add `LICENSE_KEY` → `sso`/`token-auth`/`no-tracking` available. _Ref:_ `services/license.ts` `isFeatureLicensed`, `license/constants.ts:8-10`.

## Happy path — SSO
- [ ] **Register IdP.** Org → SSO settings → register provider; discovery fetches `.well-known/openid-configuration`. _Ref:_ `routes/organization/sso.ts`, `routes/sso/discovery.ts`, `organizationSsoConfig` `schema.ts:2479`.
- [ ] **Sign in via IdP.** User signs in through the IdP → session established. _Ref:_ §3.24.
- [ ] **JIT provisioning.** Email-domain match provisions org membership. _Ref:_ `sso-provisioning` hook.

## Happy path — token auth
- [ ] **Configure token auth policy.** Set policy → enforced. _Ref:_ `routes/organization/token-auth.ts`, `organizationTokenAuth` `schema.ts:2513`.

## Edge cases / probes
- [ ] **Untrusted OIDC origin** rejected. _Ref:_ `packages/db/src/constants.ts:14-24`.
- [ ] **Cloud:** SSO/token-auth available with **no** license. _Ref:_ `license.ts:15-19`.
- [ ] **`no-tracking` license** suppresses analytics. _Ref:_ `appSetup.ts:29-37`.

**Coverage:** features 30, 31, 32.
