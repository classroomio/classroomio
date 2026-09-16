# Supported Plugins

This document lists the official plugins ClassroomIO aims to support. 

Rather than building 50 one-off integrations into the core LMS codebase, ClassroomIO uses plugins to expand platform capabilities for its primary ICP (B2B SaaS companies training customers and partners) and enable persona transformations (University LMS, Employee Compliance).

---

## Plugin Category Conventions

Per the ClassroomIO Plugin Architecture (ADR-001) and `@cio/sdk`, every plugin must declare one of the six approved categories:

* `landing` — Public landing page sections, hero units, and marketing components (`plugins/landing/<slug>/`, ID: `landing_<slug>`).
* `certificate` — Custom certificate themes, renderers, and credential layouts (`plugins/certificate/<slug>/`, ID: `certificate_<slug>`).
* `integration` — Third-party connectors, social sharing, external APIs, and webhook/bot responders (`plugins/integration/<slug>/`, ID: `integration_<slug>`).
* `activity` — Custom learning activity engines, checkers, and submission validators (`plugins/activity/<slug>/`, ID: `activity_<slug>`).
* `block` — Dashboard widgets, progress counters, and companion sidebar content blocks (`plugins/block/<slug>/`, ID: `block_<slug>`).
* `enrollment` — Custom admission, cohort registration, and invitation flows (`plugins/enrollment/<slug>/`, ID: `enrollment_<slug>`).

---

## The Plugins We Hope to Support

### 1. Org Landing Pages Plugin
* **Category**: `landing`
* **Convention Path & ID**: `plugins/landing/landing-org-pages/` (ID: `landing_org_pages`)
* **What it does**: Allows organizations to design, customize, and publish new public-facing academy landing pages directly through a plugin.
* **Key Features**:
  * Custom hero layouts, theme styling, and course catalogs.
  * Lead capture blocks (e.g., collect emails before accessing preview lessons).
  * Customer testimonial sections.
* **Extension Points**: `slots['landing.sections']`, `slots['landing.hero.after']`.

---

### 2. Custom Certificate Templates Plugin
* **Category**: `certificate`
* **Convention Path & ID**: `plugins/certificate/certificate-modern-gold/` (ID: `certificate_modern_gold`)
* **What it does**: Enables organizations to design and issue bespoke certificate templates that reflect their visual identity.
* **Key Features**:
  * Declarative SVG and HTML certificate layouts.
  * Custom typography, organization logos, instructor signatures, and issue dates.
  * Verifiable credential IDs and QR codes.
* **Extension Points**: `slots['certificate.template']`.

---

### 3. LinkedIn Certificate Sharing Plugin
* **Category**: `integration`
* **Convention Path & ID**: `plugins/integration/linkedin-certificate/` (ID: `integration_linkedin_cert`)
* **What it does**: Adds a one-click "Add to Profile" button on earned student certificates to share verified credentials directly on LinkedIn.
* **Key Features**:
  * Pre-populates certificate name, issuing organization ID, issue date, expiration, and verification URL into LinkedIn's certification flow.
  * Generates social share cards for completed courses.
* **Extension Points**: `slots['certificate.actions']`.

---

### 4. Slack Integration & Bot Plugin
* **Category**: `integration`
* **Convention Path & ID**: `plugins/integration/slack-bridge/` (ID: `integration_slack_bridge`)
* **What it does**: Connects ClassroomIO to company Slack workspaces for event notifications and interactive learning bots.
* **Key Features**:
  * **Event Alerts**: Sends notifications to designated channels when courses are published, lessons are completed, or assignments are submitted.
  * **Interactive Q&A Bot**: Students can ask questions directly in Slack channels or threads and receive answers powered by the course AI assistant.
  * **Assignment Reminders**: Pings students with deadline alerts and incomplete lesson reminders.
  * **Mini-Courses in Threads**: Delivers bite-sized lesson cards and interactive multiple-choice quizzes directly within Slack threads.
* **Extension Points**: `on('lesson.completed')`, `on('exercise.graded')`, `defineServerHandler`.

---

### 5. Discord Community & Bot Plugin
* **Category**: `integration`
* **Convention Path & ID**: `plugins/integration/discord-bridge/` (ID: `integration_discord_bridge`)
* **What it does**: Connects ClassroomIO courses to Discord servers for developer communities and Web3 academies.
* **Key Features**:
  * **Automated Role Sync**: Automatically grants Discord roles (e.g. `@Certified Developer`) when a student completes a course or track.
  * **Milestone Broadcasts**: Posts celebration announcements to community channels when members earn certificates or reach leaderboard ranks.
  * **Interactive Study Bot**: Runs thread-based study group quizzes, course discussions, and Q&A.
* **Extension Points**: `on('certificate.issued')`, `on('course.completed')`, `defineServerHandler`.

---

### 6. Notion Curriculum & Resource Sync Plugin
* **Category**: `integration`
* **Convention Path & ID**: `plugins/integration/notion-sync/` (ID: `integration_notion_sync`)
* **What it does**: Connects instructors' Notion workspaces directly to ClassroomIO.
* **Key Features**:
  * **Curriculum Sync**: Imports courses, modules, and lessons directly from Notion pages and databases.
  * **Companion Resource Sidebar**: Displays live Notion SOPs, playbooks, or reference docs in a side drawer while a student watches a video or solves an exercise.
* **Extension Points**: `slots['lesson.sidebar']`, `defineServerHandler`.

---

### 7. Plagiarism & AI-Generated Content Checker Plugin
* **Category**: `activity`
* **Convention Path & ID**: `plugins/activity/plagiarism-checker/` (ID: `activity_plagiarism_verify`)
* **What it does**: Analyzes open-ended student submissions for plagiarism and AI-generated text (identified from Moodle's top marketplace category).
* **Key Features**:
  * Integrates with plagiarism APIs and AI content detection tools.
  * Flags suspicious submissions and provides diff highlights to instructors.
  * Injects an integrity score badge into the teacher grading view.
* **Extension Points**: `on('exercise.graded')`, `slots['lesson.after']`.

---

### 8. XP, Streaks & Leaderboard Plugin (Gamification)
* **Category**: `block`
* **Convention Path & ID**: `plugins/block/xp-leaderboard/` (ID: `block_xp_leaderboard`)
* **What it does**: Introduces gamification mechanics to increase course completion rates.
* **Key Features**:
  * Awards customizable XP points on lesson completion and quiz submissions.
  * Tracks consecutive daily learning streaks.
  * Embeds an organization-wide or cohort-specific leaderboard widget on the student dashboard.
* **Extension Points**: `on('lesson.completed')`, `defineEntity('user_xp')`, `slots['dashboard.widgets']`.

---

### 9. University LMS Extension Pack
* **Category**: `activity` & `enrollment` (Multi-Plugin Extension Pack)
* **Convention Path & ID**: 
  * Attendance Engine: `plugins/activity/attendance-roster/` (ID: `activity_attendance_roster`)
  * Term Enrollment: `plugins/enrollment/term-registration/` (ID: `enrollment_term_registration`)
* **What it does**: Transforms ClassroomIO into a university/higher-ed LMS without modifying core code.
* **Key Features**:
  * **Attendance Tracking**: Roll-call rosters, check-in logs, and absent/present session records.
  * **GPA & Weighted Gradebook**: Calculates institutional grade point averages across multiple rubrics.
  * **Academic Terms & Semesters**: Organizes curriculum by academic calendar terms (Fall, Spring, Summer).
* **Extension Points**: `defineEntity('attendance_record')`, `nav.add`, custom routes.

---

### 10. Employee Training & Compliance Pack
* **Category**: `block` & `enrollment` (Multi-Plugin Extension Pack)
* **Convention Path & ID**:
  * Dedication Tracker: `plugins/block/compliance-dedication/` (ID: `block_compliance_dedication`)
  * Recertification Flow: `plugins/enrollment/annual-recertification/` (ID: `enrollment_annual_recertification`)
* **What it does**: Transforms ClassroomIO into an employee compliance and mandatory training platform.
* **Key Features**:
  * **Course Dedication Tracking**: Logs active time spent per slide/lesson to satisfy regulatory minimum training hours.
  * **Automated Recertification**: Automatically resets certifications after 365 days and re-enrolls employees in annual refresher courses.
  * **Compliance Audit Reports**: Generates verifiable PDF and CSV completion reports for auditors.
* **Extension Points**: `defineEntity('dedication_log')`, `defineServerHandler`, `slots['dashboard.widgets']`.
