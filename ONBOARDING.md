# New Engineer Onboarding Checklist

Welcome! This guide will walk you through every major feature in ClassroomIO so you
build a mental model of how the platform works. Work through each section in order.
By the end you will have touched every core surface of the product.

## Workflow

1. Create a branch from main: `git checkout -b <your-name>/onboarding`
2. Work through each Part below in order.
3. After completing a Part, commit it with a message like `onboard: part 1 - dashboard orientation`.
4. Where you see `📸 Screenshot:`, drop a screenshot into the repo (under a `screenshots/`
   folder on your branch) and reference it in the commit. Screenshots prove you actually
   did the thing — checking a box alone is not enough.
5. When all Parts are done, open a PR for review.

**Before you start:**
- The app should be running locally (dashboard on `http://localhost:5173`, API on `http://localhost:3002`).
- You should be logged in as `admin@test.com` (password `123456`).
- Use the **normal browser profile** for the admin dashboard (no `?org=` query param).
- See `README.md` and `DEV_SETUP_NOTES.md` for environment setup.

---

## Part 1 — Admin Dashboard Orientation

### Read the docs first

Open these pages in a new tab so you understand the product before clicking around:

| Topic | Link |
|---|---|
| What is ClassroomIO | https://classroomio.com/docs |
| Terminology | https://classroomio.com/docs/terminology |
| Quickstart | https://classroomio.com/docs/quickstart/signup |
| Course Types | https://classroomio.com/docs/build-a-course/course-types |
| Organization | https://classroomio.com/docs/core-features/organization |
| Student Dashboard | https://classroomio.com/docs/core-features/student-dashboard |

### Explore the dashboard

- [ ] Log in and land on `/org/[slug]` — note the sidebar groups (Home, Content, People, Automation, Settings).
- [ ] Visit **Dashboard** (`/org/[slug]/dash`) and observe the overview cards.
- [ ] Open **Stats → Analytics** (`/org/[slug]/stats/analytics`) and change the date range picker (7, 30, 90 days). Note the landing page KPIs, country breakdown, and course funnel.
- [ ] Visit **Stats → Compliance** (`/org/[slug]/stats/compliance`) — this is admin-only, so you may not see course data yet. You'll come back after creating a compliance course.
- [ ] Click through every Settings page (Profile, Notifications, Domains, Teams, Customize LMS, Landing Page, Billing, AI Credits, AI Tutor) to get a feel for what lives where.
- 📸 **Screenshot:** The main dashboard page (`/org/[slug]/dash`) with the overview cards visible.

---

## Part 2 — Courses

Create one course for each course type. For each course, follow the
[Create First Course](https://classroomio.com/docs/get-started/create-first-course) guide,
then complete the type-specific checklist below.

### 2.1 Self-Paced Course

- [ ] Create a new course, choose **Self-Paced**, name it "Test — Self-Paced".
- [ ] Add a **Section** called "Module 1".
- [ ] Add a **Lesson** inside Module 1 — add a title, body text, and upload an image.
- [ ] Add a second lesson with an embedded YouTube video link.
- [ ] Create an **Exercise** inside Module 1 with at least 3 different question types (see Section 3).
- [ ] Go to **Course Settings** and:
  - [ ] Set a slug (custom URL).
  - [ ] Upload a logo and banner image.
  - [ ] Assign a tag to the course.
  - [ ] Toggle lesson download on/off.
  - [ ] Enable course progression and set it to **sequential**.
  - [ ] Preview the course landing page.
- [ ] Go to **People** — invite yourself as a student (use a second email or `student@test.com`).
- [ ] Go to **Analytics** — observe there is no data yet.
- [ ] Go to **Newsfeed** — create a post.
- [ ] Go to **Settings → Certificates** — enable certificate download and preview the template.
- 📸 **Screenshot:** The course content page showing Module 1 with lessons and the exercise.
- 📸 **Screenshot:** The course landing page preview.

### 2.2 Live Class Course

- [ ] Create a new course, choose **Live Class**, name it "Test — Live Class".
- [ ] Add a section with a lesson and an exercise.
- [ ] Go to **Attendance** — verify the attendance tracker is available.
- [ ] Go to **Marks** — verify the grading interface is available.
- [ ] Create a live session from the sidebar (add a join link, date, and time).
- [ ] Go to **People** — invite a student.
- [ ] Go to **Settings** — enable grading, set a passing score.
- 📸 **Screenshot:** The Marks page showing the grading interface.

### 2.3 Compliance Course

- [ ] Create a new course, choose **Compliance**, name it "Test — Compliance".
- [ ] Add a section with a lesson and an exercise (make sure the exercise has auto-gradable questions).
- [ ] Go to **Course Settings → Compliance** and configure:
  - [ ] Passing score.
  - [ ] Due date.
  - [ ] Grace period (days).
  - [ ] Retake interval and max attempts.
  - [ ] Reminder days before deadline.
  - [ ] Mark the course as mandatory.
- [ ] Go to **Compliance** in the course sidebar — verify the compliance dashboard tiles are shown (compliant, non-compliant, in progress, not started, etc.).
- [ ] Go back to **Stats → Compliance** at the org level — confirm this course now appears in the course breakdown table.
- 📸 **Screenshot:** The course compliance dashboard with status tiles.
- 📸 **Screenshot:** The org-level compliance page showing the course in the breakdown table.

### 2.4 Public Course

- [ ] Create a new course, choose **Public**, name it "Test — Public".
- [ ] Add a section and a lesson.
- [ ] Preview the course landing page — verify there is no "Join course" button since it is open content.
- [ ] Log out and visit the course URL as an anonymous visitor — confirm you can see the lesson content without signing in.
- 📸 **Screenshot:** The public course viewed in an incognito window (no login).

---

## Part 3 — Question Types

Create a single exercise called "All Question Types" in your self-paced course and add
one of each question type below. This is how you learn the authoring and grading flow.

### Auto-graded types

- [ ] **Single Answer (Radio)** — add a question with 4 options, mark one correct.
- [ ] **Multiple Answers (Checkbox)** — add a question with 4 options, mark 2 correct. Verify partial credit works.
- [ ] **True / False** — add a true/false question.
- [ ] **Numeric** — add a question with a numeric answer and tolerance range.
- [ ] **Fill in the Blank** — add a question with a sentence containing one or more blanks.
- [ ] **Word Bank** — add a question where students drag/select from a word bank.

### Manually graded types

- [ ] **Paragraph (Textarea)** — add a long-form text question.
- [ ] **Short Answer** — add a short text question.
- [ ] **File Upload** *(premium)* — add a file upload question. Verify the upload dialog works.
- [ ] **Link** *(premium)* — add a question that asks for a URL.
- [ ] **Video Recording** *(premium)* — add a video recording question. Test the camera capture, record, and preview flow.

### Premium types

- [ ] **Ordering** *(premium)* — add an ordering/drag-and-drop question.
- [ ] **Star Rating** *(premium)* — add a star rating question.

### After creating the exercise

- [ ] Preview the exercise as a student would see it.
- [ ] Submit a test response as a student.
- [ ] Go to the **submissions summary** view in the admin — check the charts and aggregate data.
- [ ] Open the **individual submission** view — grade the manually-graded questions.
- [ ] Verify the student's exercise status changes from "Submitted" to "Graded".
- 📸 **Screenshot:** The exercise editor showing multiple question types in the list.
- 📸 **Screenshot:** The submissions summary view with charts.
- 📸 **Screenshot:** The individual submission view with graded answers.

---

## Part 4 — Widgets

Widgets are embeddable course catalogs for external websites.

- [ ] Navigate to **Widgets** (`/org/[slug]/widgets`).
- [ ] Click **Create Widget**.
- [ ] **Select Courses** panel — pick 2–3 courses to include.
- [ ] **Layout** panel — try different layout options.
- [ ] **Design** panel — pick a theme preset, change the primary color, toggle branding options.
- [ ] **Embed** panel — copy the embed code and preview it in a standalone HTML file or CodePen.
- [ ] Publish the widget and verify it renders the live preview correctly.
- [ ] Go back, change a setting, and **rollback** to the previous published version.
- 📸 **Screenshot:** The widget preview rendering in the embed panel.

---

## Part 5 — Tags

Tags are org-level labels for categorizing courses.

- [ ] Navigate to **Tags** (`/org/[slug]/tags`).
- [ ] Create a **Tag Group** (e.g. "Programming Languages").
- [ ] Add 3 tags inside the group (e.g. "JavaScript", "Python", "Go") — give each a color.
- [ ] Create a second tag group (e.g. "Difficulty") with tags like "Beginner", "Intermediate", "Advanced".
- [ ] Go to a course → **Settings** and assign tags from both groups using the tag picker.
- [ ] Verify the tags appear on the course card in the courses list.
- 📸 **Screenshot:** The tags admin page showing both tag groups with their tags.
- 📸 **Screenshot:** A course card in the courses list displaying the assigned tags.

---

## Part 6 — Media

The media manager is the central asset library for the org.

- [ ] Navigate to **Media** (`/org/[slug]/media`).
- [ ] Note the **storage usage summary** at the top.
- [ ] Upload an **image** file — verify it appears in the asset list with kind "image".
- [ ] Upload a **document** (PDF) — verify it appears with kind "document".
- [ ] Upload a **video** — verify it appears with kind "video". After processing, check that it has HLS playback support and auto-generated thumbnails.
- [ ] Use the **YouTube** option to add a video via link.
- [ ] Use the **Embed** option to add a video via embed URL.
- [ ] Filter assets by kind (video, image, document, audio) and verify the filters work.
- [ ] Search for an asset by name.
- [ ] Click an asset to see its detail — view **usage tracking** (which lessons reference it).
- [ ] Edit an asset name, then delete an asset you no longer need.
- [ ] Go to a **Lesson**, open the materials section, and add a video from the **Media Library** picker (not a fresh upload). Verify it embeds in the lesson.
- 📸 **Screenshot:** The media library showing uploaded assets of different kinds with the storage usage summary.

---

## Part 7 — AI Features

### AI Course Assistant

- [ ] Open any course and look for the AI assistant panel (side panel).
- [ ] Use the **Quick Action: "Draft lesson"** — provide a topic and watch it generate a lesson.
- [ ] Use **"Generate questions from lesson"** — pick an existing lesson and have AI create exercise questions.
- [ ] Use **"Summarize lesson"** on a lesson with content.
- [ ] Open the AI assistant chat and ask it to create a new section with two lessons. Observe the step-by-step execution.
- [ ] Check the **conversation history** — rename a conversation, delete one.
- [ ] In the course creation flow, choose **"Create with AI"** and provide a course topic to see the full AI course generation flow.
- 📸 **Screenshot:** The AI assistant side panel mid-generation (showing step-by-step execution or a generated lesson).

### AI Tutor (org settings)

- [ ] Navigate to **Settings → AI Tutor** and review the org-level tutor configuration.
- [ ] Open a course → **Settings** and check the course-level AI tutor toggle.
- [ ] As a student (Part 9), open a lesson and interact with the AI tutor — ask it to explain the content.

---

## Part 8 — Cohorts

Cohorts group learners through a set of courses with goals and communication.

- [ ] Navigate to **Cohorts** (`/org/[slug]/cohorts`).
- [ ] Create a new cohort — name it "Test Cohort", add a description.
- [ ] **Add courses** — search and add 2 courses to the cohort.
- [ ] **Invite members** — go to the People tab, invite `student@test.com` as a student. Optionally send the invite email.
- [ ] Add an org team member as a **tutor**.
- [ ] Go to **Goals** — create a goal of type "Complete all courses" with a deadline 30 days from now.
- [ ] Create a second goal of type "Score" — set a score threshold of 80%.
- [ ] Check the **Goals Overview** tiles — note the on-track/at-risk/overdue counts.
- [ ] Go to **Newsfeed** — create a post with rich text, react to it with an emoji, add a comment. Pin the post.
- 📸 **Screenshot:** The cohort page showing goals with their status tiles.

---

## Part 9 — Community Q&A

- [ ] Navigate to **Community** (`/org/[slug]/community`).
- [ ] Click **Ask a Question** — enter a title, select a course, write a body, and publish.
- [ ] Open the question you just posted — upvote it.
- [ ] Post an **answer** to your own question — upvote the answer.
- [ ] Search for the question by title.
- [ ] Filter questions by a specific course.
- 📸 **Screenshot:** A community question with an answer and upvotes.

---

## Part 10 — Audience

- [ ] Navigate to **Audience** (`/org/[slug]/audience`).
- [ ] Verify the table shows member names, emails, status, and date joined.
- [ ] Search for a member by name or email.
- [ ] Sort the table by "Date Joined".
- [ ] Select multiple members using checkboxes and open the **Assign Courses** bulk action.
- [ ] Click on a member row to view their **user analytics** — check enrolled courses, progress percentage, and average grade.
- [ ] Navigate to **Audience → Import** — paste a list of emails, choose to auto-assign to all courses, and submit.
- 📸 **Screenshot:** The audience table with members listed.
- 📸 **Screenshot:** A member's user analytics showing enrolled courses and progress.

---

## Part 11 — Org Settings

### Profile & Theme

- [ ] Go to **Settings → Profile** — change the org name, upload an avatar, switch between theme colors (blue, rose, green, orange, purple). Try the custom hex color picker.

### Domains

- [ ] Go to **Settings → Domains** — note the subdomain field and custom domain setup.
- [ ] Upload a **favicon** for the org.

### Teams

- [ ] Go to **Settings → Teams** — invite a team member by email with the role **Tutor**.
- [ ] Generate an **invite link** and copy it.
- [ ] Review the existing team members table and their roles.

### Customize LMS

- [ ] Go to **Settings → Customize LMS** — toggle the Community and Exercises features on/off.
- [ ] Upload a **banner image** and set banner text for the student dashboard.
- [ ] Upload a **background image** for the auth page.

### Landing Page

- [ ] Go to **Settings → Landing Page** — browse the available themes.
- [ ] Select a theme and preview it.
- [ ] Edit sections (hero, navigation, links, callout, footer) in the landing page editor.
- 📸 **Screenshot:** The landing page preview after customizing the theme and sections.

### Notifications

- [ ] Go to **Settings → Notifications** — toggle personal email notification preferences for different sections (courses, exercises, newsfeed, etc.).

### Auth

- [ ] Go to **Settings → Auth** — review the General auth settings.
- [ ] Look at the SSO tab (OIDC configuration fields, force SSO policy, auto-join domains, break-glass access).
- [ ] Look at the Token Auth tab — generate a test API secret, review the JWT example, then revoke the secret.

---

## Part 12 — Automation & MCP

These are admin-only pages for integrations. Start with API and Zapier, then spend the
most time on MCP — it's how you create content through an AI agent.

### API

- [ ] Navigate to **API** (`/org/[slug]/api`) — create an API key, note the usage tracking, then revoke it.

### Zapier

- [ ] Navigate to **Zapier** (`/org/[slug]/zapier`) — review the available triggers and actions.

### MCP — Create content with your agent of choice

The MCP server lets you use any MCP-compatible AI agent (Claude Code, Cursor, Codex,
OpenCode, etc.) to create courses, lessons, and exercises through natural language.

**Step 1 — Generate a key**

- [ ] Navigate to **MCP** (`/org/[slug]/mcp`).
- [ ] Click **Generate Key**, give it a label (e.g. "onboarding-test").
- [ ] **Copy the secret immediately** — it is shown only once.
- [ ] Note the usage dashboard: credits used/remaining, active keys, rate limits.

**Step 2 — Connect your agent**

Pick whichever agent you normally use. Add the MCP server using the key you just generated.

<details>
<summary>Claude Code</summary>

```bash
claude mcp add-json classroomio '{
  "command": "npx",
  "args": ["-y", "@classroomio/mcp"],
  "env": {
    "CLASSROOMIO_API_URL": "http://localhost:3002",
    "CLASSROOMIO_API_KEY": "<your-key-here>"
  }
}'
```

</details>

<details>
<summary>Cursor</summary>

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "classroomio": {
      "command": "npx",
      "args": ["-y", "@classroomio/mcp"],
      "env": {
        "CLASSROOMIO_API_URL": "http://localhost:3002",
        "CLASSROOMIO_API_KEY": "<your-key-here>"
      }
    }
  }
}
```

</details>

<details>
<summary>OpenCode</summary>

Add to your `opencode.json`:

```json
{
  "mcp": {
    "classroomio": {
      "type": "local",
      "command": ["npx", "-y", "@classroomio/mcp"],
      "enabled": true,
      "environment": {
        "CLASSROOMIO_API_URL": "http://localhost:3002",
        "CLASSROOMIO_API_KEY": "<your-key-here>"
      }
    }
  }
}
```

</details>

> **Important:** Use `http://localhost:3002` as the API URL (not the production URL)
> since you're running the app locally.

- [ ] Add the MCP server to your agent using the config above (pick your agent).
- [ ] Verify the connection — ask your agent to list the tools it has available. You should
  see `list_org_courses`, `create_course_draft`, `publish_course_draft`, and others.

**Step 3 — Create a course draft**

Ask your agent to create a course using the MCP tools. Try prompts like:

- *"List the courses in my org"* — uses `list_org_courses` (0 credits).
- *"Create a course draft called 'MCP Test Course' about Introduction to Cloud Computing with 2 sections and 4 lessons"* — uses `create_course_draft` (1 credit) + multiple `update_course_draft` calls (1 credit each).
- *"Add exercises to the first lesson with 3 multiple choice questions"* — uses `update_course_draft`.
- *"Tag the draft with relevant tags"* — uses `tag_course_draft` (1 credit).
- *"Publish the draft"* — uses `publish_course_draft` (5 credits).

- [ ] List your org's courses through the agent to confirm the connection works.
- [ ] Create a course draft with at least 2 sections and 4 lessons.
- [ ] Add at least one exercise with questions to a lesson in the draft.
- [ ] Tag the draft.
- [ ] Publish the draft.
- [ ] Go to the dashboard — navigate to **Courses** (`/org/[slug]/courses`) and confirm
  the MCP-created course appears with the correct structure, content, and tags.
- [ ] Open the course and verify sections, lessons, and exercises were created correctly.
- [ ] Check the **MCP page** usage dashboard — confirm the credits used matches your activity.
- 📸 **Screenshot:** Your agent mid-conversation showing it calling an MCP tool (e.g. creating a course draft).
- 📸 **Screenshot:** The MCP page usage dashboard showing credits used after your session.

**Step 4 — Update an existing course**

- [ ] Ask your agent to list courses, pick the one you just created, and add a new section
  to it using `create_course_draft_from_course` + `publish_course_draft_to_existing_course`.
- [ ] Verify the new section appears in the dashboard.

> **Note:** Each write tool call costs 1 credit, publish costs 5. The basic plan gives
> 20 credits/month. If you run out, rotate/revoke the key and generate a new one (or
> upgrade the org plan in Settings → Billing).

---

## Part 13 — Analytics

- [ ] Go to **Stats → Analytics** at the org level — review landing page KPIs, country breakdown, course funnel, popular course types, and trend charts. Change the date range and refresh the data.
- [ ] Go to a specific course → **Analytics** — review enrollment count, completion rate, average score, and per-student progress table.
- [ ] Go to a specific course → **Exercise** → open the submissions view — review the summary charts and individual student submissions.
- [ ] If you created a compliance course (Part 2.3), go to **Stats → Compliance** and review the status tiles, course breakdown, and learner table with status filters.
- 📸 **Screenshot:** The org-level analytics page with KPIs and charts populated with data.
- 📸 **Screenshot:** A course analytics page showing enrollment and progress data.

---

## Part 14 — Student / LMS Side

Now switch hats and experience the platform as a student.

### Why use a separate browser profile?

The admin dashboard and the student LMS use different URL paths (`/org/[slug]` vs `/lms`).
On localhost, the `?org=<siteName>` query param sets the `_orgSiteName` cookie which
activates the org-site/student experience. If you visit `?org=` in the same profile where
you use the admin dashboard, the cookie will redirect admin routes to the LMS.

**Use an incognito/private window** (or a completely separate browser profile) for all
student-side testing. This keeps the admin session clean.

### Getting started

1. Open an **incognito window**.
2. Go to `http://localhost:5173/?org=udemy-test` (this sets the org context).
3. Log in as `student@test.com` (password `123456`).
4. You should land on the LMS dashboard at `/lms`.

### Read the docs

| Topic | Link |
|---|---|
| Student Dashboard | https://classroomio.com/docs/core-features/student-dashboard |
| Course Enrollment | https://classroomio.com/docs/enrollment-and-students/course-enrollment |
| Welcome Email | https://classroomio.com/docs/enrollment-and-students/welcome-email |
| Invite Students | https://classroomio.com/docs/enrollment-and-students/invite-students |

### LMS Checklist

- [ ] **Home** (`/lms`) — review the dashboard: enrolled courses, progress summary, upcoming sessions, login streak, compliance score, highlighted courses, recommended courses.
- [ ] **Explore** (`/lms/explore`) — browse the public course catalog. Search for a course. Sort the results. Click a course card to preview its details. Enroll in a course.
- [ ] **My Learning** (`/lms/mylearning`) — check the In Progress and Complete tabs. Confirm the courses you enrolled in appear here.
- [ ] Open a course from My Learning — navigate through lessons, mark lessons as complete, verify sequential progression (if enabled).
- [ ] **Course progression** (requires switching between incognito and normal browser):
  1. As admin (normal browser): set the self-paced course to **sequential** in settings.
  2. As student (incognito): open the course — confirm lesson 2 is locked until lesson 1 is completed.
  3. As admin: switch progression back to **free**.
  4. As student: confirm all lessons are now accessible.
- [ ] Open an exercise — answer all question types you created in Part 3, submit the exercise, and check that the status changes to "Submitted".
- [ ] Check if the exercise was graded (if the admin graded it in Part 3) — verify the score and feedback are visible.
- [ ] **Certificates** (`/lms/certificates`) — check if you have earned any certificates (requires completing a course with certificates enabled).
- [ ] **Cohorts** (`/lms/cohorts`) — if you were invited to a cohort in Part 8, verify it appears here. View the cohort goals and newsfeed.
- [ ] **Exercises** (`/lms/exercises`) — view the centralized exercises list (if enabled in org customization). Filter by course.
- [ ] **Community** (`/lms/community`) — view the Q&A questions posted by the admin in Part 9. Post an answer to a question.
- [ ] **Settings** (`/lms/settings`) — update your profile, toggle notification preferences, check integrations (Telegram).
- [ ] **AI Tutor** — open a lesson and interact with the AI tutor. Ask it to explain a concept from the lesson or quiz you on the material.
- [ ] **AI Assistant (student quick actions)** — open the AI assistant and use student-specific quick actions: "Explain lesson", "Quiz me", "Summarize section", "What to review next".
- 📸 **Screenshot:** The LMS home dashboard showing enrolled courses and progress.
- 📸 **Screenshot:** An exercise submission confirmation showing "Submitted" status.

---

## Part 15 — End-to-End Flow (Full Loop)

Tie everything together by running through a complete teacher → student loop:

1. **As admin** (normal browser): create a new self-paced course called "E2E Test Course" with 2 sections, 3 lessons (mix of text and video), and 1 exercise with 5 different question types. Enable certificates. Invite `student@test.com`.
2. **As student** (incognito): accept the invite, go to My Learning, open the course, complete all lessons, submit the exercise.
3. **As admin**: go to the course analytics, verify the student's progress and score appear. Grade any manually-graded questions.
4. **As student**: check the graded exercise, view your certificate.
5. **As admin**: check the org analytics and compliance dashboards to confirm data flows through.
- 📸 **Screenshot:** The E2E course analytics showing the student's enrollment, completion, and grade.
- 📸 **Screenshot:** The student's certificate (if earned).

---

## Quick Reference — Demo Accounts

| Role | Email | Password | Org |
|---|---|---|---|
| Admin | `admin@test.com` | `123456` | Udemy Test (`udemy-test`) |
| Student | `student@test.com` | `123456` | Udemy Test (`udemy-test`) |
| Admin | `enterprise@test.com` | `123456` | Coursera Test (`coursera-test`) |
| Student | `enterprise-student@test.com` | `123456` | Coursera Test (`coursera-test`) |
| Admin | `early-adopter@test.com` | `123456` | Skillshare Test (`skillshare-test`) |
| Student | `early-adopter-student@test.com` | `123456` | Skillshare Test (`skillshare-test`) |

To visit a specific org's public catalog: `http://localhost:5173/?org=<siteName>`
(e.g. `?org=coursera-test`).

---

## Done?

Once you have checked every box above, you will have hands-on experience with every
core feature in ClassroomIO. If you find something that feels broken or confusing, open
an issue — fresh eyes are the best QA.
