# Course Templates — Implementation Review

Local `feat/course-templates` working tree (uncommitted), reviewed against `prd/course-templates/README.md` and `prototypes/course-templates/`.

- **Round 1:** 2026-09-26, first review.
- **Round 2:** 2026-09-26, re-check after fixes.
- **Round 3:** 2026-09-27, cross-check after the round-2 fixes. The top of this document reflects round 3; the round-2 sections below are kept for history.

## Verdict (round 3)

**Ready to open the PR.** All nine round-2 must-fix items are resolved, and the full verification passes. What remains are small follow-ups; list them in the PR description:

- a test for create-from (unit linking, lesson `teacherId`/`callUrl` clearing);
- the seeded-template plan-limit count;
- the "can follow" items further down.

### Verification (round 3)

| Check | Result |
| --- | --- |
| `pnpm --filter @cio/api build` | Pass |
| `pnpm --filter @cio/jobs-worker build` | Pass |
| `pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build` | Pass (with `NODE_OPTIONS=--max-old-space-size=8192`). A dashboard-only build fails with a stale `@cio/utils/dist/constants/content` until the deps are rebuilt; that comes from rebasing onto the newer `main`, not from this branch. |
| API tests (full suite) | 751 tests pass. `course-template-integrity.test.ts`: 7 database-backed tests pass against the local database. `add-course-members.test.ts` and `member-progress.test.ts` failed to load in the full run but pass on their own (8/8), so this looks like a flaky interaction between test files, not this branch. |
| Prettier on all changed + new files | Pass (checked per file with `xargs -0`) |
| Migration | Renamed to `0024_course_templates.sql` after `main` added `0023_mcp_certificate_scopes`; `when` 1790552013227 > `main`’s 1790426936572. Still one migration file. Pass. |
| Locale files | +153 lines each, 0 removed (no reordering). No missing keys, placeholders match `en`, `#` spacing correct, `few`/`many` present in ru and pl. The remaining "same as English" strings are cognates or brand names (Logo, Section, ClassroomIO). |

### Round-2 must-fix items

| # | Item | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Seed duplicates / fails on slug | Fixed | New `course.seed_key` (unique partial index, in `0023`). The seed skips when `getCourseBySeedKey` finds the fixture, then `allocateTemplateSlug` picks the first free slug (`insert.ts:68-80,188-215`). Clone never copies `seed_key`, and no validation schema accepts it. |
| 2 | Asset purge of shared prefixes | Fixed | `assetLocationsReferencedElsewhere` also matches thumbnail URLs, thumbnail candidates, source URLs and metadata for each purge prefix (`queries/assets/assets.ts:196-206`); a database test covers thumbnails. |
| 3 | Settings → Template link 404 | Fixed | Own templates link to `/courses/{id}/lessons`, global ones to `…/courses/templates?preview={id}` (`template-settings-section.svelte:71-76`). |
| 4 | Clone offered on templates | Fixed | Clone is hidden when `isTemplate`, and Create course from template is shown to admins (`course-context-menu-content.svelte:177-186`). |
| 5 | Snackbar store left open | Fixed | The action's `onClick` calls `handleClose()`; `onDismiss`/`onAutoClose` are wired (`snackbar.svelte:24-32`); the action type is declared once (`store.ts:5-6`). |
| 6 | Missing `ui:` prefix in the preview | Fixed | No unprefixed theme tokens left in `template-preview-dialog.svelte`. |
| 7 | Translations | Fixed | See Locale files above. `limit_body` now names the template (`{used, plural, one {{title}} other {# templates}}`). |
| 8 | Dead code | Fixed | `getFirstGroupForOrganization` is removed. `ZCourseTemplateParam` validates the `courseId` routes and handlers read `c.req.valid('param')` (`routes/course/course-template.ts:128-175`). Nit: the exported type `TCourseTemplateParam` has no users; drop it or use it. |
| 9 | Database-backed tests | Mostly fixed | `course-template-integrity.test.ts` covers: tutor mutation → 403, student list/preview → 403, param parsing, seed idempotency across a slug change, thumbnail prefix kept, pull rollback, and the free-plan second-template limit plus clone rejection. **Not covered:** create-from linking every unit and clearing lesson `teacherId`/`callUrl` for global templates. Add before or right after the PR. |

### Still open after round 3 (follow-ups)

- **Plan limit counts seeded templates:** `countOrgTemplates` (`queries/course/course-template.ts:8-22`) still counts `public_for_all` rows, so the seed-data org can hit its own limit. Add `eq(schema.course.publicForAll, false)`.
- **Seed key across org changes:** `getCourseBySeedKey` is global, so pointing `PLATFORM_TEMPLATES_ORG_ID` at a different org later won't seed there while the old org still holds the keys. That's fine if intended (seed once, ever); otherwise scope the lookup to the org.
- **Unchanged from round 2 (see below):**
  - `deleteExerciseSection` doesn't touch the parent exercise;
  - convert calls the db `updateCourse` directly;
  - `templateId` isn't `.uuid()`;
  - the clone behavior changes aren't documented;
  - the org-row lock scope;
  - the seed lock doesn't verify its owner before `del`;
  - asset delete does a full scan;
  - `template-access.ts` sits in the queries layer;
  - the three un-awaited try/catch returns;
  - the Template card flash on pull (`updatesCourseId = null`);
  - the preview has no `Dialog.Title` while loading;
  - `type SyncUnit` is outside `utils/types.ts`;
  - the fixed `w-44` cards;
  - duplicate `list()` calls;
  - the delete check lives in the route;
  - the clone route's gating;
  - the PRD wording on "section moves".

---

## Round 2 (history)

### Verdict (round 2)

**Close. A short list of fixes before opening the PR.** (All resolved in round 3; see above.)

**Correction to round 1:** the "15 files unformatted" finding was wrong. The Prettier check passed every file path as one argument (zsh doesn't word-split variables), and the `[error]` lines were `ENAMETOOLONG` failures, not formatting problems. Re-run correctly, every changed and new file passes `prettier --list-different`.

### Verification (round 2)

| Check | Result |
| --- | --- |
| `pnpm --filter @cio/api build` | Pass |
| `pnpm --filter @cio/jobs-worker build` | Pass (the round-1 TypeScript errors are fixed) |
| `pnpm --filter @cio/dashboard build` | Pass with `NODE_OPTIONS=--max-old-space-size=8192`; still OOMs at the default heap (check `main`). |
| Template tests | 20/20 pass (5 + 5 + 10). Two new unit tests: self-enrollment default, lesson-parent inclusion. |
| Prettier on all changed + new files | Pass |
| `ui:` prefix (template-card) | Pass |
| Migration journal | Pass (single `0021`, `when` > `main`) |
| Locale key order | Fixed: +125 keys per locale, 0 removed, existing order unchanged. |

### Round-2 must-fix list (all resolved in round 3)

1. **The seed can duplicate a template or fail on every boot (verified).** `resolveTemplateSlug` (`packages/db/src/utils/seed/platform-templates/insert.ts:68-80`) has two problems:
   - **Duplicate seeding.** It checks the platform org for the preferred slug, and only checks the `-classroomio` fallback when the preferred slug is taken globally. So if a template was seeded under the fallback (another org owned the preferred slug) and that org later frees the slug, the next boot sees the preferred slug as free and **seeds the template again**. Renaming a seeded template's slug in the dashboard also causes a re-seed.
   - **Permanent failure.** If another org already owns the fallback slug, the insert hits the global unique index `course_slug_key` (`schema.ts:823`), and that template fails and logs on every boot.
   - Fix: don't identify seeded templates by slug. Store the fixture key on the course (for example a `seed_key` column, or a row in a small `platform_template_seed` table), skip when it exists, and generate a unique slug on insert.
2. **Deleting an asset can still purge files that copies use (B5, partial).** `assetLocationsReferencedElsewhere` (`packages/db/src/queries/assets/assets.ts:174-233`) now protects `storageKey`, `hlsManifestKey` and `hlsAudioKey` that other rows share. The `thumbnails/<id>/`, `audio/<id>/` and `transcripts/<id>/` prefixes (`packages/core/src/services/assets/assets.ts:675-678`) are still purged even when a copy points at them. Copies also record no `asset_usages`.
3. **The Template section's name link 404s (verified).** `template-settings-section.svelte:71` links to `{$currentOrgPath}/courses/{id}/lessons`, but course pages live at `/courses/[id]/lessons`. For a global template it would also open a course the org can't access, and the updates payload has no `global` flag to tell them apart. Fix: link own templates to `/courses/{id}/lessons` and global ones to the gallery preview (`/org/{slug}/courses/templates?preview={id}`).
4. **Clone is still offered on templates.** `course-context-menu-content.svelte:183` shows Clone for templates, but the clone route now returns 403 for them ("Templates are copied with Use template"), so the user gets an error toast. Hide Clone for templates; Duplicate and Create course from template cover it.
5. **The snackbar action leaves the store open.** svelte-sonner's action click calls `deleteToast()` without `onDismiss`, so `handleClose` never runs and `snackbarStore` stays `open: true` with the action (`ui/snackbar/snackbar.svelte:26`). The `$effect` at `:50-54` reads `$t`, so a later locale switch re-shows "Template saved / View templates". Close the store in the action handler. The action type `{ label; onClick }` is also repeated three times (`store.ts:12,23,39`); name it once in the snackbar types.
6. **Theme tokens without the `ui:` prefix (verified).** `template-preview-dialog.svelte:67,70,82,88,110,118,134` use `text-muted-foreground` and `bg-muted/40`. CLAUDE.md requires `ui:text-muted-foreground`, `ui:bg-muted/40` and so on in dashboard code, so these colors won't apply.
7. **Translations:**
   - ru: `course_templates.row.heading` is still English, and `sync.locked` drops its `other` text.
   - pl: `few`/`many` forms are missing on `save.limit_title`, `sync.available_detail`, `sync.sections_count`, `sync.settings_count`, `sync.selected` and `sync.pulled`.
   - da: `sync.available_detail`, `sections_count`, `settings_count` and `selected` are English. de: `sync.selected` is English.
   - en: `limit_body` still doesn't name the existing template (the prototype says "You already have ‹Template›").
8. **Remove dead code (verified: no callers).**
   - `getFirstGroupForOrganization` (`packages/db/src/queries/group/group.ts:19-32`): left over from the first seed, and it still picks an arbitrary group. Delete it.
   - `ZCourseTemplateParam` / `TCourseTemplateParam` (`packages/utils/src/validation/course/course-template.ts:23-26`): exported but used by no route. Either use it with `zValidator('param', …)` on the `courseId` template routes (which currently read `c.req.param` unvalidated, see "Validation" below) or delete it. No unused exports ship.
9. **Database-backed tests are still missing.** The spec (implementation step 6 and the transactions rules) asks for:
   - a failed pull leaves nothing pulled (rollback);
   - 403 on mutating template routes and the clone route for non-admins and other orgs; list and preview allowed for tutors;
   - running the seed twice creates each template once and never overwrites (this would have caught item 1);
   - deleting an asset used by a copy or a global template doesn't purge its storage;
   - create-from links every unit and clears lesson `teacherId`/`callUrl` for global templates;
   - a free-plan org hits the limit on its second template.

### Round-2 follow-ups

- **Structural change detection (Major 15, partial):** moves and reorders are now consistently structural (no bump), but `deleteExerciseSection` (`exercise-section.ts:75-85`) still doesn't touch the parent exercise, so deleting a section in a template exercise is never detected. The PRD still says section moves bump (`README.md` implementation step 1); update it to "moves and reorders are not synced".
- **Convert bypasses the core service (Major 16, partial):** it calls the db `updateCourse` directly (`course-template.ts:204`). Cache invalidation after pull is fixed.
- **Validation:** `templateId` is `z.string().min(1)`, not `.uuid()` (`validation/course-template.ts:9`), and `courseId` params are read with `c.req.param` without validation (`course-template.ts:125,140,155,171`). `ZCourseTemplateParam` exists but nothing uses it.
- **Clone behavior changes (partial):** reviews are now stripped. Three changes remain undocumented: lesson `isComplete` is always false (`clone.ts:283`), `isTemplate` isn't inherited (`:219`), and lesson and exercise slugs are copied (`:293,336`). Confirm each is intended and note it in the PR.
- **Plan limit counts seeded templates:** `countOrgTemplates` includes the platform org's seeded templates (`course-template.ts:8-27`), so the platform/seed-data org can hit its own limit before saving anything. Exclude `public_for_all` rows from the count.
- **Lock scope:** the `FOR UPDATE` org-row lock is held for the whole clone and asset copy (`course-template.ts:159-174`), which blocks any concurrent write to that organization row. Lock only around the count-and-insert, or use an advisory lock keyed on the org.
- **Seed lock ownership:** `redis.del` in `finally` (`seed.ts:36-38`) doesn't check the lock is still ours, so a seed running past the 120 s TTL deletes another worker's lock. Compare the stored pid before deleting. Fixture media upload is still not implemented; fine while fixtures have no images.
- **Asset delete cost:** every asset delete now runs an OR of `LIKE`/`IN` filters on unindexed `asset` columns (`queries/assets/assets.ts:193-201`), which is a full table scan. Add indexes or match exact keys.
- **Layering and dead try/catch:** `template-access.ts` still lives in `packages/db/src/queries`. `course.ts:1469`, `lesson.ts:21` and `lesson.ts:413` still `return` a query without `await`, so their `catch` blocks never run.
- **Asset guard gaps (partial):** exercise-section descriptions and option labels aren't checked by `assetReferencedByGlobalTemplate`.
- **Dashboard:**
  - Pulling still sets `updatesCourseId = null` (`course-template.svelte.ts:281`), which unmounts and flashes the Template card and sheet until the reload finishes.
  - The preview's loading and failed-load branches have no `Dialog.Title` (`template-preview-dialog.svelte:66-67`).
  - Settings rows humanize only progression and booleans; descriptions and URLs print raw.
  - `type SyncUnit` is still declared in `utils/template-updates.ts:1` instead of `utils/types.ts`.
  - Template cards are a fixed `w-44`.
  - `confirmDelete`/`duplicate` call `list()` again after the API method already did (`templates/+page.svelte:88,94`).
  - The URL→search effect can overwrite fast typing (`templates/+page.svelte:115-121`, low confidence).
- **Delete-template check lives in the route:** it checks org ownership and admin role from the session (`course.ts:414-422`); move that business logic into the service.
- **Clone route gating (pre-existing):** `POST /course/:courseId/clone` is still behind `orgMemberMiddleware` only, so a student member can clone their org's courses. It now checks org ownership and rejects templates; consider requiring the admin or tutor role too.

### Resolved in round 2

| Round-1 item | Resolution |
| --- | --- |
| B1 seed creates orgs | Seed looks the org up, logs `platform-templates: no org to fill (PLATFORM_TEMPLATES_ORG_ID=…)` and does nothing if it's missing. Default id kept as the seed-data org. |
| B2 shared group | A fresh group per template (`insert.ts:192-202`). |
| B3 seed transaction / global slug check | One transaction per fixture; the slug check is org-scoped (but see open item 1). |
| B4 jobs build | Compiles. |
| B6 clone route bypass | Source course must be in the caller's org; templates rejected with 403. |
| B7 formatting | Not an issue (see the correction above). |
| 8 transactions | `cloneCourse` is transactional or uses the caller's tx; save and convert lock, check the limit and write in one tx. |
| 9 pull writes outside tx | Asset copy helpers take the tx everywhere. |
| 10 foreign asset ids | `getAssetsByIds` is scoped to the source org. |
| 11 learner-surface leaks | `getEnrolledCourses` and the four public-course slug queries exclude templates; the agent publish path rejects templates. |
| 12 deleted state unreachable | `canReadLinkedTemplate` ignores status, so the deleted branch renders. |
| 13 final exercise | Remapped through the exercise map. |
| 14 self-enrollment default | Uses `isSelfEnrollmentAllowed`; covered by a test. |
| 24 permissions | Decision: tutors may list and preview templates; all mutating routes are admin-only. The current `assertTeacher` on list/preview matches. |
| Parent auto-inclusion, concurrency, caller-controlled `updatedAt`, platform duplicates | Fixed (lesson parent preferred; `lockCourseForUpdate`; `updatedAt` stripped; dedup in the service). |
| 17–19, 21–23 dashboard state | Convert refreshes the course and nav count; the row re-lists after mutations; the plan limit shows a snackbar; no publish prompt on templates; request-id guard on `loadUpdates`; preview width fixed. |
| 20 shared `isLoading` | Separate flags; the spinner only shows while creating (title gap listed above). |
| Frontend conventions | `onOpenChange` handlers; `Label` instead of native labels; `loadedId` guard stops the extra preview fetch. |
| Empty state, a11y, testIds, stories | Filtered-empty handled; Browse hidden from tutors; card hover/focus; gallery link is an `<a>` with a chevron; dark amber; sheet loading; `testId`s added; stories fixed and extended. |
| i18n plurals and key order | The `#` spacing is fixed in all locales, fr is translated, ru is almost complete (open item 7), and key order is stable. |
| en copy | `has_students` pluralized; `also_adds` includes the kind. |
| Prototype deviations | Card border, hover and primary plus; secondary Template badge; Settings paragraph, button beside the name and Alert titles; sheet title, description, Cancel, icons and "Nothing selected"; preview spinner, Copying line and checks; save toast link; gallery ⋯ on hover, Blank card in My templates, ClassroomIO empty message. |

### Suggested order (round 2)

1. Open items 1–2: seed identity and asset-purge prefixes (data integrity).
2. Open items 3–6: dashboard bugs (small, user-visible).
3. Open item 7: translations.
4. Open item 8: remove dead code.
5. Open item 9: database-backed tests, including seed idempotency.
6. Then open the PR, listing the "can follow" items in its description.
