# What plugins popular open-source projects have

The plugin catalogs of popular open-source projects — both LMS and the broader tools that set
the standards for plugin ecosystems — organized by project, with the concrete plugin _types_
each defines and real examples, followed by the patterns that recur everywhere.

---

## LMS / e-learning

### Moodle — ~40 formal plugin _types_, 2,000+ in the directory

Moodle is the gold standard: it defines a fixed set of **plugin types**, each with its own
directory and extension role.

| Plugin type                              | Dir                         | What it adds                | Examples                                                            |
| ---------------------------------------- | --------------------------- | --------------------------- | ------------------------------------------------------------------ |
| **Activity modules** (`mod`)             | `/mod`                      | New course activities       | Forum, Quiz, Assignment, **H5P** (interactive), **BigBlueButton**  |
| **Blocks** (`block`)                     | `/blocks`                   | Sidebar widgets             | Calendar, Recent items, **Completion Progress**, **Level Up! XP**  |
| **Question types** (`qtype`)             | `/question/type`            | New quiz question kinds     | Multiple-choice, drag-and-drop, essay                              |
| **Question behaviours / formats**        | `/question/*`               | How questions run / import  | Deferred feedback, GIFT import                                     |
| **Authentication** (`auth`)              | `/auth`                     | External login sources      | LDAP, OAuth2, SAML                                                 |
| **Enrolment** (`enrol`)                  | `/enrol`                    | Who gets into a course      | Self-enrolment, cohort sync, payment                              |
| **Course formats** (`format`)            | `/course/format`            | Course layout               | Topics, Weekly, Grid, Tiles                                        |
| **Text filters** (`filter`)              | `/filter`                   | Transform posted text       | Glossary auto-link, MathJax, multimedia embed                     |
| **Editors / Atto plugins**               | `/lib/editor`               | Rich-text editing           | TinyMCE, Atto button add-ons                                      |
| **Themes** (`theme`)                     | `/theme`                    | Look & feel                 | Boost, Classic                                                     |
| **Reports** (`report`)                   | `/report`                   | Data views                  | **Configurable Reports**, IntelliBoard analytics                 |
| **Admin tools** (`tool`)                 | `/admin/tool`               | Site maintenance utilities  | Bulk user actions, DB cleanup                                     |
| **Repositories / Portfolios**            | `/repository`, `/portfolio` | File in/out                 | Google Drive, OneDrive                                            |
| **Log stores** (`logstore`)              | `/admin/tool/log/store`     | Event log back-ends         | Standard log, external DB                                        |
| **Message outputs** (`message`)          | `/message/output`           | Notification channels       | Email, SMS, mobile push                                          |
| **Availability conditions**              | `/availability/condition`   | Access restrictions         | By grade, date, group                                            |
| Plus                                     |                             |                             | plagiarism, gradebook exports, calendar types, MFA factors, profile fields |

A popular real-world stack (2026): H5P + Level Up! XP + Completion Progress (engagement), Safe
Exam Browser + plagiarism checks (integrity), BigBlueButton (live class), Configurable
Reports/IntelliBoard (analytics).

### Open edX — XBlocks

Courseware components: **Video**, **HTML**, **Problem/CAPA**, **Drag-and-Drop**, **LTI
Consumer**, **Open Response Assessment (peer grading)**, **Poll/Survey**, plus compound
sequences.

### Canvas / Blackboard — LTI tools (not code plugins)

The "plugins" are external tools: publisher content (Pearson, McGraw Hill, Cengage), proctoring
(Respondus, Proctorio), plagiarism (Turnitin), video (Kaltura, Panopto), web annotation
(Hypothesis), conferencing (Zoom). All connect via LTI placements.

---

## The broader ecosystems that define plugin design

### WordPress — categorized by _job_, 60,000+ plugins

The clearest example of user-facing plugin categories:

- **SEO**: Yoast SEO (10M+ installs), Rank Math, All in One SEO
- **E-commerce**: WooCommerce (5M+)
- **Page builders**: Elementor (10M+)
- **Forms**: Contact Form 7, WPForms
- **Security / anti-spam**: Wordfence, Akismet, Really Simple Security
- **Performance / caching**: WP Rocket, LiteSpeed Cache, W3 Total Cache
- **Backup / migration**: UpdraftPlus, Duplicator
- **All-in-one utility**: Jetpack

### VS Code — 100,000+ extensions, categorized by capability

Microsoft's own taxonomy (2025 marketplace counts): **36,000 language extensions**, 19,000
snippet packs, 13,000 formatters, 13,000 linters, 9,400 debuggers, 8,700 themes.

- **Language support**: Python, C/C++, Java (syntax, IntelliSense)
- **Linters/formatters**: ESLint, Prettier, Biome
- **Git tooling**: GitLens, GitHub Pull Requests, Git Graph
- **AI assistants**: GitHub Copilot (72M+), Continue, Cline, Codeium
- **Themes/icons**: One Dark Pro, Material Icon Theme
- **Debuggers**: Debugger for Chrome, Python Debugger
- **Framework tooling**: Tailwind CSS IntelliSense, Prisma
- **Workflow**: REST Client/Thunder Client, Live Server, Remote-SSH

### Jenkins — 1,800+ plugins, categorized by pipeline role

CI/CD is _almost entirely_ plugins; even core steps ship this way:

- **SCM**: Git, GitHub Branch Source, GitLab, Bitbucket
- **Pipeline**: workflow-aggregator (Jenkinsfile engine), Blue Ocean, Pipeline Stage View
- **Credentials/security**: Credentials, Credentials Binding, Matrix Authorization (RBAC)
- **Infrastructure/agents**: Docker Pipeline, Kubernetes, SSH agents
- **Notifications**: Slack, Email Extension
- **Reporting**: JUnit, coverage, OWASP Dependency-Check
- **Build triggers**: SCM polling, parameterized/downstream triggers, webhooks

### Grafana — exactly 3 clean plugin types

A great minimal taxonomy:

- **Data source plugins** — connect to a backend (Prometheus, MySQL, MongoDB, BigQuery, Datadog)
- **Panel (visualization) plugins** — new chart/widget types (time series, Polystat, text)
- **App plugins** — bundle data sources + panels + custom pages + UI extensions (Kubernetes
  monitoring, Zabbix, Redis); can nest other plugins

### Obsidian — community plugins, categorized by note-taking need

- **Query/data engine**: Dataview (query your vault like a DB)
- **Task management**: Tasks, Tasks Calendar
- **Calendar/scheduling**: Full Calendar (CalDAV/Google two-way sync), Prisma Calendar
- **Sync**, **themes**, **editor enhancements**, **graph/visualization**

---

## The patterns that recur across all of them

Despite different domains, the _kinds_ of plugins converge into a small set of recurring
categories:

1. **New content / object types** — Moodle activities & question types, XBlocks, Grafana
   panels, VS Code languages. ("Add a new thing users create/see.")
2. **Data connectors / integrations** — Grafana data sources, Jenkins SCM, Moodle repositories
   & auth, WooCommerce payment gateways. ("Connect to an external system.")
3. **Authentication & identity** — Moodle `auth`, Jenkins credentials, WordPress security.
   (Almost every extensible platform makes auth pluggable.)
4. **Visualization / UI & theming** — Grafana panels, VS Code themes, Moodle themes & course
   formats, WordPress page builders.
5. **Processing / transformation** — Moodle text filters, VS Code linters/formatters, WordPress
   SEO/caching. (Intercept and transform data in the pipeline.)
6. **Notifications / output channels** — Moodle message outputs, Jenkins Slack/email.
7. **Reporting / analytics / export** — Moodle reports & data formats, Jenkins JUnit,
   IntelliBoard.
8. **Admin / lifecycle / automation** — Moodle admin tools, Jenkins build triggers, WordPress
   backup/migration.
9. **"App" bundles** — Grafana apps, Moodle local plugins, VS Code extension packs: a package
   that _combines_ several of the above into an out-of-the-box solution.

Two cross-cutting facts relevant to ClassroomIO:

- **The richest ecosystems make almost everything pluggable** (Moodle: "even core is plugins";
  Jenkins: CI is plugins), but they earn that by either **reviewing code** (Moodle/WordPress
  directories) or **defining tight extension-point contracts** (Grafana's 3 types, LTI
  placements).
- **Categories map directly to existing ClassroomIO surfaces**: data connectors ≈ public API +
  Zapier, notifications/automation ≈ webhooks (`prd/webhooks`), content types ≈ SCORM/cmi5 +
  question types (`packages/question-types`, `prd/scorm-support`), and UI injection ≈
  embeds/widgets (`apps/embeds`). A future ClassroomIO plugin taxonomy would most naturally
  start with **content/question types, data & notification integrations, auth providers, and
  reporting/analytics** — the same four buckets every mature LMS exposes first.
