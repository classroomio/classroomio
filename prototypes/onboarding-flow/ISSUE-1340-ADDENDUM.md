## Addendum: "Hi, {name}" workspace step, welcome video and AI course builder

The prototype has moved on since this issue was written. It now has a redesigned workspace step and a new final step after Customise. Prototype: `prototypes/onboarding-flow/` (PR #1376). Run it with `cd prototypes/onboarding-flow && python3 serve.py 8899`, then open `http://localhost:8899/flow.html`.

This addendum **replaces the description of step 4 (Create workspace)** above and **adds a step after Customise (step 6, Build your first course)**. Everything else in the issue is unchanged.

Updated journey:

1. Create account
2. Verify email
3. Your business
4. **Hi, {name}: name, organisation and subdomain** (replaces "Create workspace")
5. Generate starter courses (loading screen, not a counted step)
6. Customise academy
7. **Welcome video and AI course builder** (new)
8. Dashboard and guided tour

---

### Step 4. "Hi, {name}": your name, organisation and subdomain

A split-screen step. The form is on the left. The right panel is the same pale blue panel as steps 1 and 2, with a "Trusted by teams at" wall instead of the testimonial carousel.

**Headline.** A large monospace greeting reads `Hi, {{ name }}` with a blinking caret. The braces and the word `name` are placeholders. As the user types their full name, the placeholder is replaced by what they type, and the braces disappear. If the field is emptied, the placeholder returns.

**Fields (top to bottom):**

| Field | Label | Rules |
| --- | --- | --- |
| Full name | "What's your full name?" | Required. At least 5 characters. Errors: `Name required`, `Enter your full name (at least 5 characters).` A "Name required" hint shows under the field until something is typed. |
| Organisation | "What's the name of your organization?" | At least 5 characters, cannot start or end with a hyphen. Errors: `Organization must contain 5 or more characters`, `Organization name cannot start or end with a hyphen`. Prefilled from the website title or business name from step 3 when available. |
| Academy subdomain | "Academy subdomain" | Input with a fixed `.classroomio.com` suffix and the hint "Letters and numbers only". |

**Subdomain behaviour:**

- It follows the organisation name as the user types (lower-cased, spaces become hyphens, anything other than letters, numbers and hyphens is removed) until the user edits it by hand. After that it stops following.
- Rules, with the exact messages: 5 or more characters (`Academy subdomain must contain 5 or more characters`), no leading or trailing hyphen (`Academy subdomain cannot start or end with a hyphen`), not on the reserved list or already taken (`Sitename already exists.`).
- Reserved list (production's blocked names): academy, app, apps, blog, build, campaign, church, cloud, community, conference, course, courses, demo, dev, embed, embeds, forum, group, groups, help, launch, launchweek, mobile, play, prod, production, schools, stage, staging, support, www, mail, api, admin.
- Availability feedback under the field, announced to screen readers (`aria-live="polite"`): a spinner and "Checking availability" while the request runs, then a green "Subdomain available" or a red error banner. The prototype delays the answer by 550 ms to simulate the check.

**Actions:**

- **Continue** (full width, primary). Enter in any field also continues. Validation runs on all three fields, shows each error inline and focuses the first invalid field.
- **Back** returns to step 3 and keeps every answer.

**Right panel.** "Trusted by teams at" followed by a wall of company names. The prototype uses placeholder names and says so on screen.

**Behaviour to build:**

- The availability check must call a real endpoint, debounced, with the same reserved list the API enforces. Production must also re-check on submit, because the name can be taken between the check and the click.
- Continue creates the organisation and starts course generation, as the issue already says for "Create workspace".
- The greeting must not render the typed name as HTML.

**Open points:**

- Real customer logos need permission. Without approved logos, remove the wall rather than ship placeholders.
- Do we keep 5 as the minimum for the full name? Short real names (for example "Wu Li") would be blocked. The production rule for organisation name and subdomain is 5, and the prototype copies it.

---

### Step 7. Welcome video and AI course builder

This step comes after Customise and before the dashboard. It is the first time a new user sees what the product does: a short welcome video and a chat that builds a first course while the user watches it appear.

**Layout.** A top bar, then two columns: the AI chat on the left and a live preview of the course on the right.

**Top bar:**

- ClassroomIO logo and the five-segment progress bar, fully filled, labelled "Build".
- **Back** returns to Customise. **Skip to my courses** finishes onboarding and opens the Courses page.

#### 7a. Welcome video

- On arrival, a card titled "Welcome to ClassroomIO" opens in the centre of the preview area over a dimmed backdrop and starts playing. It is the ClassroomIO welcome video (a YouTube video in the prototype, loaded from `youtube-nocookie.com`, captions on by default).
- Browsers only autoplay muted video, so the video starts muted. If the user has already clicked or pressed a key on the page (they have, by this step), the sound is turned on after it starts. If the browser still blocks it, a **Turn on sound** button appears in the card header.
- When the video ends, the card shrinks and moves to the bottom-right corner of the preview, with a short animation, and stays there until it is closed.
- The card header has two buttons: **Move to the corner** (also Escape, or clicking the backdrop) and **Close** (stops the video and removes the card).
- **Watch intro** in the preview bar reopens it from the start at any time.
- With reduced motion enabled, the move to the corner is instant.

#### 7b. AI chat

The chat mirrors the existing dashboard AI assistant, so users do not learn a second UI.

**Header:** sparkle icon, "Assistant", the course title as a subtitle once a course exists, **New chat** (disabled while empty or working) and **Chat history** (a popover of earlier chats this session, or "No previous chats yet.").

**Empty state:** a sparkle icon and "Ask me to help with your course content: draft lessons, generate questions, or plan a course from a document." Below it:

- A **Suggested for you** card with the first starter prompt and a "Use this prompt" action.
- Five quick-action chips: Upload a document to create a course, Draft a lesson, Generate questions from this lesson, Summarize this lesson, Help me publish this course. "Upload a document" opens the file picker. The others send their text.

**Starter prompts** (all use the organisation name from step 4):

| Starter | Course produced | Lessons |
| --- | --- | --- |
| New customer onboarding (default suggestion) | Getting started with {Org} | 7 (video, readings, an assignment, two quizzes) |
| Product training for support | {Org} product training for support | 6 |
| Feature adoption mini-course | Get more from {Org} | 6 |
| Compliance certification | {Org} compliance training | 6 |

Any free text starting with build, create, make, turn, plan or "generate a course" also builds a course. Its title comes from the text, and it gets a generic six-lesson outline. Free text that is not a build request, sent before a course exists, gets "There is no course in this workspace yet, so I have nothing to work on" with a button to build the suggested starter.

**Composer:**

- Textarea "Ask the AI assistant...". Enter sends, Shift+Enter adds a line.
- **Attach** accepts PDF, DOCX, PPTX and ODT. The file name shows as a removable chip. Sending with only a file asks to "Build a course from {file}".
- **@ mentions.** Typing `@` once a course exists lists its lessons and exercises, filtered as the user types. Arrow keys move, Enter inserts, Escape closes. It is disabled before a course exists.
- **Model picker** with the dashboard's models and cost marks: Kimi K2.6 and Gemini 3.1 Flash Lite are available. GPT-5.4 Mini and Claude Sonnet 4.6 are locked and show a lock. Choosing a locked model shows a toast that it needs a paid plan.
- **Stop** replaces the model picker while a response is running. Stopping posts "Stopped. Nothing was changed. Send another message when you are ready."

**The first build** (prototype timing, about 12 seconds in total):

1. The user message appears. A rotating status line shows "Pondering the question", "Reading your brand settings", "Outlining the lessons", "Drafting lesson content", "Writing the quiz", "Hang tight, nearly there". The right panel switches to the block loader ("Lesson and quiz blocks stacking into your first course").
2. "I'll use starter content so you can see it working. Connect your own material after."
3. Two collapsed rows the user can expand: **Thought for 4 seconds** (why the course is shaped this way) and **Read workspace · 3 items** (brand colour, the theme applied, number of starter courses).
4. A **Building your course** card with a live checklist and an "n of 3 steps complete" counter: `outline.md` (course outline), `lessons/` (lesson drafts), `checks/` (graded items after the key lessons). Each row moves from a spinner to a check.
5. The preview fills with the real public course page for the new course, with the address bar showing `https://{subdomain}.classroomio.com/course/{course-slug}`.
6. Closing message: the course name, lesson count and that it has two sections, followed by "Saving draft: Saved as a draft. Learners cannot see it until you publish."
7. Two suggestion cards:
   - **Connect your content**: Connect a website, Connect Google Drive, Browse integrations.
   - **Add features**: Add a certificate on completion, Add a quiz after each lesson, Add a drip schedule.
   Clicking a suggestion puts its text in the composer rather than sending it.
8. **Publish** becomes enabled and a coach tip points at it: "When you're ready, click Publish. Share the course with your learners and control who has access." with a **Got it** button.

**Follow-up messages** (after a course exists): asking for a certificate, a quiz after each lesson or a drip schedule edits the draft and the preview reloads. Certificate sets a 70% threshold and downloadable certificates. Quiz adds a "Quick check" exercise to every section. Asking to publish points at the Publish button. Questions, summaries and lesson drafts reply that they work on the lesson currently open. Anything else is acknowledged without a change.

**Publish.** The modal "Publish your academy" shows "{Course} goes live at {subdomain}.classroomio.com", a **Who can enrol** select (Anyone with the link, Invited learners only), **Not yet** and **Publish**. Publishing marks onboarding complete, takes the user to the Courses page and starts the product tour. **Skip to my courses** does the same without publishing, and the course stays as an unpublished draft.

**What is simulated in the prototype.** No model is called, and the answers, timings, outlines and lesson lists are scripted. The "course" is built from the starter prompts above and is not saved anywhere beyond local state. The follow-up features are the only edits that apply. The video is a placeholder YouTube embed.

**Behaviour to build:**

- Real generation behind the same chat, using the dashboard assistant's backend, with schema-validated output and a visible failure state with a retry. The issue's rule that AI generation must be real applies here too.
- Streaming of the status line, the collapsed reasoning rows and the checklist. Each row maps to a real step.
- The model picker reflects the plan: locked models open the upgrade prompt, not only a toast.
- The uploaded document is parsed server-side and used as the source for the course. Define limits (file size, page count, formats) and show an error when they are exceeded.
- The new course is saved as an unpublished draft and shows in the Courses page. Publishing goes through the same publish flow as the rest of the dashboard.
- Mentions list lessons from the course being edited, from the real course data.
- The user can leave the step at any time (Back, Skip) without losing the conversation or the draft, and can resume.

**States still to design:**

- Generation failure or a timeout, with retry and "continue without a course".
- Rate limit or credit exhaustion on the free plan.
- Rejected, oversized or unreadable document.
- The video failing to load (blocked, offline).
- Mobile layout. It has not been designed or checked in the prototype. Decide whether mobile shows the chat first with the preview behind a toggle.
- Keyboard and screen-reader behaviour of the video card, the model menu, the mention list and the status line. The video card should move focus when it opens and return it when it closes.

**Open questions:**

- Does the builder add a course to the four or five starter courses already created, or replace them?
- Is this step counted in the progress bar (6 steps) or treated like the loading screen, outside the count? The prototype shows it as the last of six segments.
- Is the step skippable by default, and should we measure how many users skip it?
- Video hosting: a YouTube embed sets third-party cookies. Use `youtube-nocookie.com`, or host the video ourselves? A cookie banner rule may apply.
- Which models are free in onboarding, and what is the generation limit for a new account?

---

### Additional acceptance criteria

- [ ] The workspace step greets the user by name as they type and falls back to the `{{ name }}` placeholder when the field is empty.
- [ ] The organisation name and subdomain follow the production rules, the subdomain follows the organisation name until edited, and availability is checked against a real endpoint with the error messages above.
- [ ] After Customise, the welcome video opens, plays with captions, docks to the corner when it ends, and can be reopened, moved and closed. Sound works or a "Turn on sound" control is shown.
- [ ] The builder chat supports starter prompts, free text, document upload, `@` mentions, the model picker with locked models, Stop, New chat and History.
- [ ] A first course is generated for real, shown in the live preview, saved as an unpublished draft and published from the Publish dialog.
- [ ] Generation failure, rate limit, bad documents and video failure each show a clear message and a way to continue.
- [ ] The step works on mobile and with the keyboard and screen readers, and respects reduced motion.
- [ ] Analytics events cover video opened, video completed, video closed, first prompt sent, starter prompt used, build completed, build failed, course published and step skipped.
