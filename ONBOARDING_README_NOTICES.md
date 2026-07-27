# README Updates for Onboarding Task Flow

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

Update the instructions to use the correct navigation path:

```md
- [ ] Open the compliance course.
- [ ] Navigate to **Certificate** from the course sidebar.
- [ ] Open the **Settings** tab within the Certificate page.
- [ ] Configure:
  - [ ] Minimum completion / passing score.
  - [ ] Due date.
  - [ ] Grace period.
  - [ ] Retake interval and maximum attempts.
  - [ ] Reminder days before the deadline.
  - [ ] Mark the course as mandatory (if applicable).
```

This reflects the current location of the compliance configuration options.

---

## 2. Part 4 - Widgets

### Issue

Following the documented widget creation flow does not produce a working widget.

### Current Behavior

After completing all the documented steps:

- Creating a widget
- Selecting courses
- Configuring the layout and design
- Copying the embed code
- Clicking **Publish**

the widget does **not** render or load when the generated HTML/embed code is used.

### Recommendation

The README should either:

- document any additional required steps if they exist, or
- note that widget publishing is currently not functioning as expected until the issue is resolved.
- or instruct to run any application that includes the ability for widgets to run.

---

## 3. Part 6 - Media

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

Media assets are uploaded while creating course content rather than directly from the Media page.

Update the onboarding instructions to reflect the following workflow:

```md
- [ ] Open a course.
- [ ] Create a **Section**.
- [ ] Create a **Lesson** within the section.
- [ ] Add lesson materials such as:
  - [ ] Images
  - [ ] PDFs
  - [ ] Videos
  - [ ] Links
- [ ] Navigate to **Media** (`/org/[slug]/media`) to verify that the uploaded assets appear in the Media Library.
- [ ] Continue testing filtering, searching, editing, and reusing media assets from the Media Library.
```

The Media Library serves as a centralized repository for assets uploaded through course and lesson creation, rather than as the primary location for uploading new media.