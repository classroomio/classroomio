# README Updates for Onboarding Task flow

The following updates should be made to the onboarding README to reflect the current application behavior.

---

## 1. Part 2.3 - Compliance Course

### Issue

The onboarding guide references an incorrect navigation path for configuring course compliance settings.

### Current README

```md
- [ ] Go to **Course Settings → Compliance** and configure:
  - [ ] Passing score.
  - [ ] Due date.
  - [ ] Grace period (days).
  - [ ] Retake interval and max attempts.
  - [ ] Reminder days before deadline.
  - [ ] Mark the course as mandatory.
```

### Required Change

Update the navigation path to the correct location where the Compliance settings are currently found.

---

## 2. Part 4: Widgets

### Issue

Following the documented widget creation flow does not produce a working widget.

### Current Behavior

After completing all the documented steps:

* Creating a widget
* Selecting courses
* Configuring the layout and design
* Copying the embed code
* Clicking **Publish**

the widget does **not** render or load when the generated HTML/embed code is used.

### Recommendation

The README should either:

* document any additional required steps if they exist, or
* note that widget publishing is currently not functioning as expected until the issue is resolved.

---

## 3. Part 6: Media

### Issue

The current onboarding guide implies that assets should be uploaded directly from the **Media** page.

### Current README

```md
- [ ] Navigate to **Media** (`/org/[slug]/media`).
- [ ] Upload an image file.
- [ ] Upload a document (PDF).
- [ ] Upload a video.
```

### Required Change

Clarify that media assets are **not uploaded directly from the Media page**.

Instead:

* Images
* PDFs
* Videos

are added while creating or editing courses and lessons.

The **Media Library** acts as a centralized asset repository that automatically contains media uploaded through course creation and editing workflows.

The onboarding instructions should therefore explain that users should first upload media while creating course content, then navigate to the **Media** page to verify, manage, search, filter, and reuse those assets.

These notes are ready to include in your PR description or commit alongside the README updates.
