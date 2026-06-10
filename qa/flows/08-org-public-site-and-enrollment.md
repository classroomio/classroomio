# Flow 08 — Org public site, marketing & docs

- **Personas:** Guest / Visitor (unauthenticated)
- **Features covered (FEATURE_AUDIT §2):** 24 Org public site (org-site) · 38 Marketing website · 39 Documentation site
- **Modes:** both (self-host vs cloud routing differs — see audit §5)
- **Map refs:** FEATURE_AUDIT §3.19, Appendix

## Preconditions
- An org with at least one **published** course (and ideally a `PUBLIC` course).
- Org branding/theme configured (optional, to test theming).

## Happy path — org public site
- [ ] **Browse public catalog.** Visit the org public site → published courses listed. _Ref:_ `routes/org-site`, `(org-site)/courses`, mounted `app.ts:217`.
- [ ] **View a course page.** Open a course landing page → details render. _Ref:_ `(org-site)/course`.
- [ ] **Branding/theme applied.** Org theme/branding reflected. _Ref:_ PRD `org-landing-page-theme-picker [DONE]`.
- [ ] **Enroll / sign up from public site** → routes into signup (Flow 01). _Ref:_ §3.19 user flow.
- [ ] **Self-host routing:** org-site → LMS redirect is **skipped** on self-host. _Ref:_ `(org-site)/+layout.server.ts:16`.

## Happy path — marketing & docs
- [ ] **Marketing site loads.** `apps/website` renders landing pages (run `pnpm website:dev`). _Ref:_ Appendix.
- [ ] **Docs site loads.** `apps/docs` renders (run `pnpm docs:dev`). _Ref:_ Appendix.

## Edge cases / probes
- [ ] **Unpublished course** not visible publicly.
- [ ] **Unauthenticated access** to private LMS routes redirects to login.
- [ ] **SEO/meta** on landing pages (recent metadata refactor, commit `f615b06bf`) — confirm correct title/description.

**Coverage:** features 24, 38, 39.
