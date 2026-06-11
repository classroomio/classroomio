# Flow 10 — Org settings, tags, domains, widgets & analytics

- **Personas:** Admin
- **Features covered (FEATURE_AUDIT §2):** 4 Organizations (settings) · 23 Tags · 25 Custom domains · 26 Course widget embed · 34 Analytics
- **Modes:** both (custom domains/widgets are cloud-leaning; analytics tracking differs by mode)
- **Map refs:** FEATURE_AUDIT §3.4, §3.18, §3.20, §3.21, §3.27, §5

## Preconditions
- Admin with a published course.

## Happy path — settings & tags
- [ ] **Update org settings.** Change name/site/branding/signup policy → saved; reflected on public site. _Ref:_ `routes/organization/organization.ts`, `schema.ts:1949`.
- [ ] **Signup policy.** Toggle `disableSignup` / invite-only → enforced (cross-check Flow 01). _Ref:_ `signup-guard.ts`.
- [ ] **Create tag groups/tags.** Org → Tags → create group + tags. _Ref:_ `routes/organization/tags.ts`, `schema.ts:2158,2188`.
- [ ] **Assign tags to courses + filter.** Tag a course → catalog filter works. _Ref:_ `tagAssignment` `schema.ts:2225`.

## Happy path — domains & widgets
- [ ] **Add a custom domain.** Org settings → add domain → Cloudflare mapping flow. _Ref:_ `routes/domain/domain.ts`, `app.ts:203`, `apps/tenant-router`.
- [ ] **Create a widget.** Widgets → new → choose courses + layout → save. _Ref:_ `routes/widgets`, `(app)/widgets/[widgetId]`, `widget` `schema.ts:2255`.
- [ ] **Publish & embed.** Publish widget → copy embed snippet → renders externally. _Ref:_ `apps/embeds`, `widgetVersion` `schema.ts:2336`.

## Happy path — analytics
- [ ] **Analytics dashboard.** Org → Analytics → login/page/course metrics render. _Ref:_ `routes/dash`, `services/analytics`, `schema.ts:167-285`.
- [ ] **Mode-aware tracking.** Cloud: PostHog/Umami enabled; self-host: disabled. _Ref:_ `appSetup.ts:17-37`, §5.

## Edge cases / probes
- [ ] **Duplicate site name** rejected on settings change.
- [ ] **Custom domain failure/SSL states** surfaced (audit §7.8 — unverified).
- [ ] **Draft vs published widget**; manual vs published course-selection mode. _Ref:_ §3.21.
- [ ] **Self-host:** add-org modal hidden, tracking off. _Ref:_ §5.3.

**Coverage:** features 4(settings), 23, 25, 26, 34.
