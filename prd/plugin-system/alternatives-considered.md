# Alternatives considered

## The manifest + sandbox + registry design

Explored in depth in [PR #781](https://github.com/classroomio/classroomio/pull/781): a
`cio-plugin.json` manifest, three primitives (provide / hook / page), three runtime tiers
(declarative / sandboxed browser / out-of-process server), capability scopes approved at install
time, and a plugin directory with first-party / verified / community review tiers.

That research is worth keeping and this proposal builds on parts of it. It is not the design chosen,
for three reasons.

**It optimises for the wrong problem.** Its design target is untrusted third-party code on
multi-tenant cloud, which is the hardest extensibility problem and the least urgent one. Everything
downstream — the manifest schema, the capability approval flow, the iframe bridge, the review
tiers — follows from that target. None of it makes ClassroomIO more customisable for the developer
who has already cloned the repo, which is the actual mission.

**Nothing is customisable until all of it exists.** Manifest plus SDK plus bridge plus permission
enforcement plus registry is a long build before the first developer feels anything. The design in
[`README.md`](./README.md) ships a visible win in step 1 and the flagship demo in step 2.

**Its UI runtime forbids the flagship use case.** Plugin UI renders in a sandboxed iframe on a
separate origin, communicating only by `postMessage`. An iframe cannot own the app shell, so
"switch the layout from a sidebar to a top navigation" — the single most legible proof of
customisability — is structurally impossible in that model. It also guarantees plugin UI never feels
native, because it never shares the theme.

## What that research got right, and is carried forward here

- **Plugin-scoped storage is the blocking gap.** Its Moodle gap analysis identifies that Attendance,
  Questionnaire, Checklist, Game, Group choice and Level Up XP all store their own learner data and
  therefore cannot be built without it. That conclusion is correct and is why `defineEntity` is a
  first-class primitive here rather than an afterthought.
- **Completion and grade write-back is required.** Without it a plugin activity renders and stores
  but cannot participate in progress, certificates or compliance status. Carried forward as
  `ctx.completion.mark()` / `ctx.grade.set()`.
- **Course formats are a missing extension point.** Tiles, Onetopic and Edwiser are ~42k installs
  with nothing in the original catalog to fill. Carried forward as `course.format`, and promoted
  into the launch five.
- **The existing seams are the foundation.** `@cio/question-types` as registry-plus-contract,
  `apps/embeds` as a sandboxed runtime, and webhooks as the signed event surface. This proposal adds
  `getOrgNavigationGroups()` and `LandingPageThemeBundle` to that list — both already data-driven,
  both cheaper to extend than anything else in the codebase.
- **Trust must be tiered by deployment.** Self-host accepts in-process code; cloud does not. Same
  conclusion, different consequence: this proposal tiers *trust* while keeping *capability*
  maximal, rather than letting the cloud constraint shape the authoring model everywhere.
- **The iframe and signed-server tiers still matter** — for untrusted third-party code on cloud,
  deferred to step 8 and built on this research when demand justifies it.

## Other options weighed

**LTI 1.3 tool provider/consumer.** Worth doing on its own merits for institutional interop, and it
would reuse the OIDC work already done for SSO. It is not the customisability story: LTI lets
external tools embed *inside* ClassroomIO, it does not let anyone change what ClassroomIO *is*.
Should be scoped as its own PRD, not folded into this one.

**Fork-and-maintain, documented properly.** The honest status quo — write a good fork guide and
accept that customers diverge. Rejected because a fork is a customer who can never upgrade, and the
support cost lands on us either way.

**Config file only, no code plugins.** Ship Layer 0 and stop. Genuinely attractive: it is most of
the visible value for a fraction of the work. Rejected as an endpoint rather than a milestone,
because it cannot express a new activity type, and "add a kind of learning that doesn't exist yet"
is the request that decides whether someone picks ClassroomIO over Moodle. It remains step 1.

**Headless-only — expose the API and let people build their own frontend.** Maximum flexibility,
minimum leverage: every customer rebuilds the same dashboard. The `@classroomio/lms` packaging step
gives this option to whoever wants it without making it the only path.
