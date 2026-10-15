/*
 * model.js — what every page after onboarding shares: the route table, the org identity and the
 * course model. Pages never hard-code a file name; they ask `model.R` so a link has one place to change.
 *
 * Production routes the files stand in for are noted beside each entry. Query parameters carry the
 * context a route segment would (course id, tab, lesson), so a link always lands on the same state.
 */
(function () {
  const P = window.proto;

  const q = (params) =>
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

  const R = {
    home: 'site.html', // the org site root: the landing page
    dashboard: 'dashboard.html', // /org/[slug]/dash
    setup: 'setup.html', // /org/[slug]/setup (Get Started)
    courses: (params = {}) => `courses.html${q(params) ? `?${q(params)}` : ''}`, // /org/[slug]/courses
    courseCreate: 'courses.html?create=true',
    templates: 'templates.html', // /org/[slug]/courses/templates
    template: (id) => `template.html?${q({ id })}`,
    course: (id, tab = 'lessons', extra = {}) => `course.html?${q({ id, tab, ...extra })}`, // /courses/[id]/<tab>
    lesson: (id, lessonId, extra = {}) => `course.html?${q({ id, tab: 'lesson', lesson: lessonId, ...extra })}`, // /courses/[id]/lessons/[lessonId]
    courseSettings: (id, section) => `course.html?${q({ id, tab: 'settings', highlight: section })}`,
    publicCatalog: 'public-courses.html', // (org-site)/courses
    publicCourse: (id) => `public-course.html?${q({ course: id })}`, // (org-site)/course/[slug]
    enroll: (id) => `enroll.html?${q({ course: id })}`, // (org-site)/course/[slug]/enroll
    learn: (id, itemId) => `learn.html?${q({ course: id, item: itemId })}`, // (org-site)/course/[slug]/lesson/[itemSlug]
    landingEditor: (section) => `landing-editor.html${section ? `?section=${section}` : ''}`, // /org/[slug]/landingpage/edit
    customize: 'customize.html', // the onboarding theme and brand step
    accountSettings: 'settings.html', // /org/[slug]/settings (profile)
    orgSettings: 'org-settings.html', // /org/[slug]/settings/org
    audience: 'audience.html', // /org/[slug]/audience
    onboarding: 'flow.html?resume=1'
  };

  function orgSlug(state) {
    return P.slugify(P.brandNameOf(state)) || 'your-academy';
  }

  function orgInfo(state) {
    return {
      name: P.brandNameOf(state),
      siteName: state.siteName || orgSlug(state),
      url: `https://${state.siteName || orgSlug(state)}.classroomio.com`,
      owner: (state.fullname || '').trim()
    };
  }

  let idCounter = 0;

  function newId(prefix) {
    idCounter += 1;

    return `${prefix}-${Date.now().toString(36)}${idCounter}`;
  }

  /* The drafted outline is placeholder structure, not generated content; this gives every course
   * real sections and lessons so the lesson list, the editor and the player all read one shape. */
  function ensureCourse(course) {
    if (Array.isArray(course.sections)) return course;

    if (typeof course.lessons === 'number') delete course.lessons;

    const outline = course.outline ?? [
      { title: 'Get oriented', lessons: ['Welcome', 'What you will learn', 'How this course works'] },
      { title: 'Core skills', lessons: ['The key ideas', 'A worked example', 'Common mistakes'] },
      { title: 'Put it into practice', lessons: ['Try it yourself', 'Check your understanding', 'Next steps'] }
    ];

    course.sections = outline.map((section, sectionIndex) => ({
      id: `${course.id}-s${sectionIndex + 1}`,
      title: section.title,
      lessons: section.lessons.map((title, lessonIndex) => ({
        id: `${course.id}-s${sectionIndex + 1}-l${lessonIndex + 1}`,
        kind: 'lesson',
        title: typeof title === 'string' ? title : title.title,
        html: '',
        published: true
      }))
    }));
    course.slug = course.slug || P.slugify(course.title) || course.id;
    course.visibility = course.visibility ?? (course.published ? 'public' : 'private');
    delete course.outline;

    return course;
  }

  function courses(state) {
    state.courses.forEach(ensureCourse);

    return state.courses;
  }

  function findCourse(state, id) {
    return courses(state).find((course) => course.id === id) ?? null;
  }

  function lessonsOf(course) {
    return ensureCourse(course).sections.flatMap((section) => section.lessons);
  }

  function findLesson(course, lessonId) {
    return lessonsOf(course).find((lesson) => lesson.id === lessonId) ?? null;
  }

  function createCourse(state, fields) {
    const course = ensureCourse({
      id: newId('course'),
      title: fields.title.trim(),
      desc: (fields.desc ?? '').trim(),
      type: fields.type ?? 'SELF_PACED',
      published: false,
      origin: fields.origin ?? 'blank',
      templateId: fields.templateId ?? null,
      sections: fields.sections
    });

    state.courses.unshift(course);

    return course;
  }

  function setPublished(state, id, published) {
    const course = findCourse(state, id);

    if (!course) return null;

    course.published = published;
    course.visibility = published ? 'public' : 'private';

    return course;
  }

  function deleteCourse(state, id) {
    state.courses = state.courses.filter((course) => course.id !== id);
  }

  function counts(course) {
    const lessons = lessonsOf(course);

    return {
      lessons: lessons.filter((lesson) => lesson.kind !== 'exercise').length,
      exercises: lessons.filter((lesson) => lesson.kind === 'exercise').length
    };
  }

  /* Production's Get Started checklist (features/setup): six steps, in this order, each with the
   * destination setup-navigation.ts sends it to. `done` is derived from the data, as production derives it from the
   * database: a course exists, a lesson exists, an exercise exists, a course is published. Only the two profile
   * steps use flags (`state.steps.profile`, `state.steps.organization`, plus the logo) set by the settings pages. */
  function setupSteps(state) {
    const list = courses(state);
    const first = list[0];
    const firstLesson = first ? lessonsOf(first)[0] : null;

    return [
      {
        id: 'profile',
        cta: 'Update Profile',
        title: 'Upload a profile picture and update username',
        desc: 'Personalize and add a human touch making interactions more personal and memorable',
        done: Boolean(state.steps?.profile),
        href: R.accountSettings
      },
      {
        id: 'organization',
        cta: 'Update Org Profile',
        title: 'Update organisation profile picture',
        desc: 'Establish a professional and recognizable identity for your organization',
        done: Boolean(state.logoDataUrl) || Boolean(state.steps?.organization),
        href: R.orgSettings
      },
      {
        id: 'course',
        cta: 'Create Course',
        title: 'Create Course',
        desc: 'Create a course that you will share with your students',
        done: list.length > 0,
        href: R.courseCreate
      },
      {
        id: 'lesson',
        cta: 'Create Lesson',
        title: 'Create a lesson',
        desc: 'Break your course into lesson that your students can easily understand',
        done: list.some((course) => lessonsOf(course).some((lesson) => lesson.kind !== 'exercise')),
        href: first ? R.course(first.id, 'lessons') : R.courseCreate
      },
      {
        id: 'exercise',
        cta: 'Create Assignment',
        title: 'Create an exercise',
        desc: 'Test your students allow them to demonstarte their understanding of the subject matter',
        done: list.some((course) => lessonsOf(course).some((lesson) => lesson.kind === 'exercise')),
        href: first && firstLesson ? R.lesson(first.id, firstLesson.id) : R.courseCreate
      },
      {
        id: 'publish',
        cta: 'Publish Course',
        title: 'Publish a course',
        desc: 'Make your course public and purchaseable',
        done: list.some((course) => course.published),
        href: first ? R.courseSettings(first.id, 'publish') : R.courseCreate
      }
    ];
  }

  window.model = {
    R,
    orgInfo,
    orgSlug,
    newId,
    ensureCourse,
    courses,
    findCourse,
    lessonsOf,
    findLesson,
    createCourse,
    setPublished,
    deleteCourse,
    counts,
    setupSteps
  };
})();
