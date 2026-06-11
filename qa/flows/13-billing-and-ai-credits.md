# Flow 13 — Billing & AI credits

- **Personas:** Admin
- **Features covered (FEATURE_AUDIT §2):** 33 Billing (Polar) · 20 AI credits / token billing
- **Modes:** **cloud only** (Polar). On self-host these are inactive (plan = selfhosted ENTERPRISE).
- **Map refs:** FEATURE_AUDIT §3.15, §3.26, §5, §6E

## Preconditions
- Cloud mode (`PUBLIC_IS_SELFHOSTED` ≠ `true`).
- Polar test/sandbox configured (`POLAR_WEBHOOK_SECRET` set). Ability to trigger Polar webhooks.

## Happy path — subscriptions
- [ ] **Upgrade.** Upgrade → Polar checkout → on `subscription.created`, org plan activates. _Ref:_ `routes/api/polar/subscribe`, `webhook/+server.ts:30-168`, `organizationPlan` `schema.ts:1667`, plan enum `schema.ts:28`.
- [ ] **Update/cancel.** `subscription.updated` / cancel → plan updates / `cancelOrgPlan`.
- [ ] **Customer portal.** Manage subscription via portal. _Ref:_ `routes/api/polar/portal`.

## Happy path — AI token packs
- [ ] **Buy tokens.** `/api/polar/buy-tokens` → checkout → on `order.paid`, credits added. _Ref:_ `recordPurchase`, `aiCreditBalance` `schema.ts:2950`, `aiCreditPurchase` `schema.ts:2974`.
- [ ] **Balance reflects purchase.** Org balance increases by `TOKEN_PACK.TOKENS_PER_UNIT × qty`. _Ref:_ `@cio/utils/plans:53`.
- [ ] **Usage decrements.** AI usage records in `aiTokenUsage` `schema.ts:2919` and draws down balance.

## Edge cases / probes
- [ ] **Webhook signature invalid** → rejected (no credit). _Ref:_ `POLAR_WEBHOOK_SECRET`.
- [ ] **Malformed quantity/metadata** parsed safely; `triggeredBy` UUID validated. _Ref:_ `webhook/+server.ts:61-66`.
- [ ] **Self-host:** billing UI absent; plan is selfhosted ENTERPRISE. _Ref:_ §5.3.
- [ ] **Out-of-credits** behavior in AI features is graceful.

**Coverage:** features 20, 33.
