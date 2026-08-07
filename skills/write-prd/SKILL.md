---
name: write-prd
description: Write a product PRD for ClassroomIO the house way — clarify all features with the user first, research the codebase, write the PRD under prd/<feature>/, then build clickable HTML prototypes under prototypes/<feature>/ that become the UX source of truth. Use when the user asks to "write a PRD", "spec a feature", "plan a new product/feature", or "prototype a feature end to end".
---

# Write a PRD

A PRD here is two artifacts that ship together:

1. `prd/<feature>/README.md` — the written spec.
2. `prototypes/<feature>/` — clickable HTML prototypes of every surface, with an `index.html` map. **The prototypes are the UX source of truth**; when prose and prototype disagree on a UI detail, the prototype wins, and the PRD must say so.

Work in this order. Do not write the PRD before the decisions are locked, and do not build prototypes before the PRD scope is clear.

## Phase 1 — Get clear on all the features first

Never start writing from a one-line request. Close every open fork with the user via `AskUserQuestion` (option-based, 3–4 questions per round, 2–3 rounds max):

- **Relationship to existing features** — new entity vs extension of something shipped? (Check `prd/` for overlapping PRDs first; e.g. "learning paths" nearly collided with the shipped Programs feature.)
- **Who touches it** — enumerate the personas and confirm each surface: public visitor (org landing site), learner (LMS), teacher/admin (dashboard). Most features need all three; ask which are in scope.
- **The business mechanics** — pricing, enrollment/self-serve vs admin-managed, gating/completion rules, certificates, statuses (Active/Draft/Archived).
- **Scope cuts** — what's explicitly v1 vs later. Every "maybe" becomes a Non-Goal or a decision.
- **References** — if the user points at a competitor page or screenshot, fetch/read it and mirror its structure deliberately.

Every answer becomes a numbered entry in the PRD's **Confirmed Decisions** section. If the user answers with a note instead of an option, treat it as a lead to chase (fetch the URL, read the screenshot), not a checkbox.

## Phase 2 — Research the codebase before writing

- Read the closest existing PRD in `prd/` and match its format.
- Audit current state: what tables, services, routes, and UI patterns already exist that this feature reuses or must not break. Capture it as a **Current-State Audit** table (capability → current state → notes).
- Find the real UI patterns to mirror (use an Explore agent for breadth): the component primitives in `packages/ui`, the sibling feature's routes/sidebar/pages, the landing-page theme system. Name the actual files in the PRD.

## Phase 3 — Write the PRD

Location: `prd/<feature>/README.md`. House structure (match `prd/programs [DONE]/README.md`):

1. **Status** — Draft / In review / Done.
2. **Prototypes — the UX source of truth** — state that UX comes from the prototype folder, show the start page in a code block (`prototypes/<feature>/index.html`), and include a surface → files table.
3. **Purpose** — one paragraph; name the reference experience if there is one.
4. **Problem Statement** — bullets of what's impossible or painful today.
5. **Confirmed Decisions** — numbered; this is the contract from Phase 1.
6. **Current-State Audit** — the table from Phase 2.
7. **Product Goals** / **Non-Goals (v1)**.
8. **Functional Requirements** — one subsection per surface (public / learner / teacher), each referencing its prototype file and describing states, not just happy paths (locked, empty, draft…).
9. **Technical Design** — data model as schema code blocks (follow repo rules: no relational IDs in jsonb, computed values never stored), core logic in pseudocode, an API route table, and a frontend plan that follows CLAUDE.md layering (validation → queries → services → routes → feature types/API classes).
10. **Implementation Order** — numbered phases an engineer can execute top to bottom, with build verification commands.
11. **Acceptance Criteria** — testable, numbered; always include a "zero regression on existing features" criterion and "all copy uses translation keys".
12. **Risks and Mitigations** — each risk paired with a concrete mitigation.

Keep it scannable: tables for routes and audits, code blocks for schemas, prose only where judgment is needed.

## Phase 4 — Build the prototypes

Location: `prototypes/<feature>/` — standalone HTML files, one per screen, plus shared CSS:

- **Use the real design tokens, not invented ones.** App screens: a shared `app-theme.css` mirroring `packages/ui/src/index.css` (OKLCH vars, Geist, radii, shadows, Button/Badge/Item/Progress recipes, `.dark` class). Public screens: a `landing-theme.css` mirroring the default org-landing theme (`--landing-*` vars). Read the actual component variants (`tv()` blocks) before styling.
- **Match shipped UI, don't redesign it.** If a screen wraps an existing view (course page, setup checklist, settings form), replicate that view's real structure — sidebar, header, states — and add only the feature-specific chrome. Screenshots from the user override everything.
- **`index.html` is the start page**: a map of every screen grouped by persona/journey, each card linking in. All pages cross-link so each journey clicks through end to end.
- Every page: light/dark toggle, realistic data (no lorem), all states shown (done / in progress / locked / empty / draft). Small vanilla-JS interactions (drag reorder, accordions, tabs) are worth the effort — they sell the flow.
- Open pages with `open <file>` as you finish them so the user can react early; iterate on their feedback per screen. Expect header/sidebar nitpicks — fidelity to the real app is the bar.

## Phase 5 — Close the loop

- Re-check the PRD against the final prototypes (files renamed? screens added/removed? decisions changed mid-build?) and fix drift.
- Tell the user the start page path and the PRD path in your summary.
- Flag the one or two product calls you made without an explicit answer so they can veto them.
