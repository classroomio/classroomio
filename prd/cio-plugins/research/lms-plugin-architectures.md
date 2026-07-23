# How large LMS platforms implement plugins

Research into the dominant plugin/extension models across learning platforms and the broader
software ecosystem: **Moodle** (in-process code plugins), **Canvas / Blackboard** (external
tools via **LTI**), **Open edX** (**XBlocks**), **WordPress** (the canonical hook model), the
**content-packaging standards** (SCORM / xAPI / cmi5), and the **modern SaaS sandbox** pattern
(WASM + iframe, as used by Figma / VS Code / Shopify).

---

## 1. What is a plugin vs. a native feature?

The line is drawn by **who owns the code and where it runs**, not by what the user sees.

- **Native feature** — ships in the core product, written by the core team, runs in the
  trusted process, can touch the database and internal APIs directly, and upgrades with the
  core release cycle. In Moodle even "core" is mostly plugins, but they are _bundled and
  trusted_. In Canvas, the gradebook, quizzes, and Rich Content Editor are native.
- **Plugin / extension** — optional, separately authored and versioned, "plugged in" to
  extend the core _without editing core files_. Moodle's docs define a plugin as "any type of
  code that can be plugged-in to extend" the system, and note that **every** Moodle plugin is
  _optional_ — you can never assume a given plugin exists on a site.

There are two archetypes of plugin across the industry:

|                 | In-process plugin                                     | Out-of-process / external tool                     |
| --------------- | ----------------------------------------------------- | -------------------------------------------------- |
| Examples        | Moodle plugins, WordPress plugins, Open edX XBlocks   | Canvas/Blackboard LTI tools, SCORM/cmi5 content    |
| Code runs       | _Inside_ the LMS server, same language/runtime        | On the **vendor's own server**, embedded via iframe/redirect |
| Power           | Very high (DB, internal APIs)                          | Bounded by a protocol (launch + data services)     |
| Trust required  | High — code review, self-host control                 | Low — LMS never runs the tool's code               |
| Portability     | Locked to the LMS's language/framework                | Portable across any LTI-compliant LMS              |

A developer who tried to extend Canvas summarized the reality: _"Canvas has a plugin mechanism
but there seems to be no practical way to use it… if you want to integrate with Canvas, you're
going to build an app that's launched from Canvas, runs in a Canvas page, and communicates
with Canvas using the standard LTI protocol."_ (blog.jonudell.net). Large commercial/SaaS LMSs
deliberately push third parties to the out-of-process model because they cannot let strangers
run code in their multi-tenant cloud.

---

## 2. The parts of a plugin system

Regardless of model, the same building blocks recur:

1. **Manifest / metadata** — declares identity, version, dependencies, permissions, and _where
   it plugs in_. (Moodle: `version.php`, `lib/components.json`, `db/subplugins.json`;
   WordPress: plugin header comment; LTI: JSON tool configuration / dynamic registration;
   SCORM: `imsmanifest.xml`.)
2. **Extension points / placements** — the named "slots" the host exposes. Moodle has ~40
   plugin types (activity `mod`, `block`, `filter`, `qtype`, `enrol`, `auth`, `theme`,
   `local`, …). Canvas LTI has **placements** (`course_navigation`, `editor_button`,
   `assignment_view`, `top_navigation`, …). WordPress has **hooks**. Open edX has the
   courseware component tree.
3. **The host API / SDK** — the surface the plugin is allowed to call: DB access layer,
   capability checks, rendering helpers, service calls (grades, roster, etc.).
4. **A runtime / execution model** — how and when the plugin's code is invoked (in-process
   function calls, hook dispatch, an iframe launch, a WASM VM).
5. **A registry / installation mechanism** — how plugins are discovered, submitted, reviewed,
   installed, enabled per-tenant, and updated.
6. **A security / trust boundary** — code review, capability/permission model, sandboxing,
   signed tokens.

---

## 3. How each model works

### A. Moodle — in-process, hook-driven code plugins

- Plugins are folders of PHP dropped into type-specific directories (`/mod`, `/blocks`,
  `/filter`, …). A stock Moodle ships 370+ plugins; all are technically optional.
- They extend core two ways: **callbacks** (legacy `lib.php` functions) and the modern
  **Hooks API (PSR-14 dispatcher)**, plus autoloaded classes in a `classes/` dir.
- **Subplugins**: some plugin types (activity modules, editors, admin tools, `local`) can host
  their own sub-plugins — a two-level extensibility tree. A subplugin may call its parent
  directly but must assume nothing about unrelated plugins.
- **What they can do**: essentially anything — new activity types, question types, enrolment
  methods, auth methods, repositories, themes, reports. Full DB and internal-API access.

### B. Canvas / Blackboard — external tools via LTI

This is the most important model for a cloud/SaaS LMS, and it is an **open 1EdTech standard**,
not a product.

- **LTI 1.1 (legacy)**: browser POSTs launch data, signed with **OAuth 1.0a + a shared
  secret**. Simpler but weaker.
- **LTI 1.3 (current) + LTI Advantage**: rebuilt on the **1EdTech Security Framework = OAuth
  2.0 + OpenID Connect + signed JWTs + asymmetric keys**.

**How a launch works (1.3):**

1. User clicks an embedded tool link in the LMS.
2. LMS (acting as an **OpenID Provider**) starts an **OIDC third-party-initiated login** — a
   redirect handshake that prevents CSRF.
3. LMS sends the tool a signed **`id_token` JWT** containing the user's identity, roles, and
   course context (unknown claims must be ignored, for forward-compat).
4. The tool renders its UI (typically in an iframe) on **its own servers**.

**LTI Advantage services** (server-to-server APIs the tool calls _after_ launch):

- **AGS** (Assignment & Grade Services) — create gradebook columns / post grades back.
- **NRPS** (Names & Role Provisioning) — read the course roster/roles.
- **Deep Linking 2.0** — teacher picks content inside the tool; the tool returns a signed JWT
  of selected items the LMS stores as resource links. Canvas's `editor_button` placement uses
  this.

To call these services the tool signs a JWT with its **private key**, trades it at the LMS's
authorization server for an **OAuth 2.0 access token** scoped to specific permissions. Keys are
exchanged via **JWKS endpoints** (`jwks_uri`) so they can rotate without reconfiguration.
Canvas models this internally as `Lti::Registration` (the tool registry) + `ContextExternalTool`
(an installed instance with privacy level + placements) + `ResourceLink` records.

### C. Open edX — XBlocks (in-process Python components)

- An **XBlock is a self-contained Python component** — "a mini web application" — that stores
  its own state, renders via view methods, and handles AJAX via handler methods. Courseware is
  a **hierarchical tree of XBlocks** (video, problem, HTML, drag-and-drop, plus compound
  sequences).
- A **runtime** hosts them (manages the tree, storage, services). Any web app implementing the
  XBlock API can be a runtime, so XBlocks are portable across runtimes.
- Open edX contrasts itself with LTI explicitly: _"XBlocks is a Python language-level API… The
  core reason to write an XBlock is that it is deployable. You give us the code and we embed
  it. LTI would require you to give us a virtual machine image."_ (XBlock = you trust and run
  their code; LTI = you don't.)
- **Security**: XBlocks can be **sandboxed in client-side JS with no cookie access**, so
  handler calls are authenticated with **time-windowed secure tokens** (HMAC of
  user+block+rounded-timestamp, valid 2–4 days) embedded in handler URLs, and untrusted
  rendering is isolated in **iframes / null-origin sandboxes**.

### D. WordPress — the canonical hook model

- Plugins are PHP files that **tap into the core at predefined points via hooks**, without
  editing core. Two hook kinds:
  - **Actions** (`do_action` / `add_action`) — "something happened, go do work" (side effects,
    no return).
  - **Filters** (`apply_filters` / `add_filter`) — "here's a value, transform and return it."
- Callbacks are registered with a **priority** and run in queue order; plugins can even
  remove/override each other's hooks. Core itself uses **thousands of hooks in 700+
  locations**. Plugins define their _own_ hooks so others can extend them.
- Lifecycle hooks: `register_activation_hook`, `register_deactivation_hook`,
  `register_uninstall_hook`.

### E. Content-packaging standards (a different kind of plugin: content, not code)

These let third-party _learning content_ plug in and report progress back — the LMS runs the
content but not arbitrary server logic.

- **SCORM**: a ZIP with an `imsmanifest.xml`; content runs in an **iframe** and talks to the
  LMS via a **JavaScript API object it discovers by walking the window tree**. Tracks
  score/completion/time. Rigid iframe sizing, permanent JS connection, same-origin.
- **xAPI**: general statement format ("actor–verb–object") posted to a **Learning Record Store
  (LRS)** over HTTP; content can live anywhere, even off-browser/mobile.
- **cmi5**: an **xAPI profile** that adds the missing launch/session protocol. The LMS
  generates a **secure launch URL** with query params (`endpoint`, `fetch` token URL, `actor`,
  `registration`, `activityId`); content calls the one-time **fetch URL** to get an auth token,
  then posts xAPI statements to the LRS. No iframe/permanent connection required; supports
  offline + cross-domain.

### F. Modern SaaS sandbox (Figma / VS Code / Shopify / Extism)

For a multi-tenant cloud app that _does_ want to run third-party logic client-side, the 2026
consensus is **two layers of isolation**:

1. **Logic isolation** — run plugin code in a **WebAssembly VM** (commonly
   **QuickJS-compiled-to-WASM**, Figma's model). The module starts with **zero I/O** — no
   `window`, `document`, `fetch`. This is **capability-based security**: the host hand-writes
   explicit "bridge" functions to expose _only_ what's needed.
2. **UI isolation** — render plugin UI in a **sandboxed iframe on a separate/opaque origin**,
   communicating only via `postMessage`; crucially **not** `allow-same-origin`, so the plugin
   cannot escape.

Supply-chain trust is **tiered** by author: first-party (audited, full API), verified partner
(signed images, restricted API), and **customer-uploaded (sandbox + minimal API + per-tenant
quotas + static analysis + a sandbox-test phase before going live)**.

---

## 4. How they do security (summary across models)

- **Don't run their code at all (LTI/cmi5)** — the strongest boundary. The LMS only exchanges
  **signed JWTs / OAuth 2.0 tokens over HTTPS/TLS**, uses **OIDC to stop CSRF**, **asymmetric
  keys via JWKS** for rotation, and **scoped access tokens** for callback APIs. Annual
  **conformance certification** by 1EdTech.
- **Run their code but review it hard (Moodle/WordPress)** — mandatory **code review before
  listing** (Moodle: automated checks every version + manual review on first submission by
  named "Plugins Guardians"; WordPress: manual review). Enforced coding rules: never trust user
  input (`required_param`/`optional_param`, no raw `$_GET/$_POST`), **parameterized SQL only**,
  **capability checks** (`require_capability`/`current_user_can`) before every sensitive
  action, **CSRF tokens** (`sesskey`/nonces), `require_login`, `MOODLE_INTERNAL` guards, and
  **banned dangerous functions** (`eval`, `call_user_func`, `unserialize` on user data).
  Security flaws close a plugin until fixed; repeat offenders get banned.
- **Permission / capability model** — Moodle's **capabilities/roles/contexts** gate what a
  plugin can do per user per context; LTI's **privacy levels + scopes** limit what data a tool
  receives; WASM's **capability whitelist** limits host calls.
- **Sandbox the runtime (Open edX / modern SaaS)** — iframes with null origins, WASM VMs with
  no default I/O, time-limited HMAC handler tokens, per-tenant quotas.

---

## 5. How they accept plugins (governance & distribution)

- **Moodle Plugins Directory** — developer uploads a single ZIP (one root folder + `version.php`)
  → automated validation → manual QA + code review by Guardians → approved plugins are
  installable from the Moodle admin web UI and auto-registered for translation. Many
  institutions refuse to install unapproved plugins.
- **WordPress.org Directory** — submit → manual review against detailed guidelines (security,
  GPL-compatible, no tracking without consent, no shipping executable code from third-party
  systems, don't duplicate core).
- **Canvas / LTI** — no code submission; tools are **registered** (dynamic self-registration or
  admin adds config), then **enabled per account/course**. Institutions increasingly require an
  accessibility + security review before enabling a vendor.
- **Enablement scope** — plugins/tools are turned on **per-tenant/per-course**, often behind
  **feature flags** (Canvas has a first-class feature-flag system for gradual rollout).

---

## 6. How they run it inside the LMS + what plugins can do

- **In-process (Moodle/WordPress/XBlock)** — invoked by direct function calls / hook dispatch /
  runtime render during the request. **Can do a lot** — new activities, question types, blocks,
  filters, auth & enrolment methods, reports, themes, storage. Bounded only by capability
  checks and review.
- **Embedded external tool (LTI)** — launched via redirect/iframe into the LMS page; the tool's
  UI appears in a **placement**. **Can**: authenticate the user via launch, read roster/roles
  (NRPS), write grades (AGS), inject selected content (Deep Linking). **Cannot**: touch the LMS
  DB or run server code inside the LMS.
- **Content package (SCORM/cmi5)** — runs as launched content; **can** report
  score/completion/progress/xAPI statements; **cannot** alter LMS behavior.
- **Sandboxed SaaS plugin (WASM+iframe)** — runs client-side in isolation; **can** do only what
  the host's bridge/API exposes.

---

## 7. How this maps to ClassroomIO

ClassroomIO already has most of the "out-of-process" extension surfaces that big cloud LMSs
rely on, which matters because it is a **multi-tenant Node/SvelteKit SaaS** — the same
constraint that pushed Canvas to LTI-first applies here (running tenant-uploaded server code
in-process is not safe):

- **Public REST API** (`prd/public-api`, `apps/api`) — the integration backbone.
- **Outbound webhooks** (`prd/webhooks`) — the "actions/events" half of extensibility; already
  inventories trigger points in services (invites, enrollments, submissions, payments, lesson
  completion).
- **Zapier** (`prd/zapier`) and **MCP** (`packages/mcp`, `prd/mcp-course-authoring`) — no-code
  + AI-agent automation surfaces.
- **Embeds/widgets** (`apps/embeds`, `prd/course-widget-embed`, `prd/walkthrough-widget`) — the
  iframe UI-injection pattern.
- **SCORM support** (`prd/scorm-support`) — the _content-package_ plugin model (import ZIP,
  launch, track completion), explicitly phased to avoid full SCORM-2004 sequencing in v1.
- **Enterprise SSO** (`prd/enterprise-sso`) — OIDC/SAML foundations that overlap with LTI
  1.3's security stack.

**The natural extension ladder for a stack like ClassroomIO**, from lowest to highest
trust/effort: (1) public API + **webhooks** (event-driven, safest), (2) **iframe
embeds/widgets** with `postMessage` for UI injection, (3) an **LTI 1.3 tool provider/consumer**
for standards-based interop (reuses the OIDC/OAuth work), (4) **SCORM/cmi5** for content
packages, and only much later (5) a **WASM-sandboxed** in-app plugin runtime if it ever wants
to run third-party _logic_ client-side. The consistent lesson from every large LMS:
**prefer protocol-based, out-of-process extension (LTI/webhooks/API) over running third-party
code in your process**, and if you must run their code, **review it (Moodle/WordPress) or
sandbox it (XBlock/WASM+iframe)** — never both untrusted and unbounded.
