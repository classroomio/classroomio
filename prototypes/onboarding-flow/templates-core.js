/*
 * templates-core.js — what the courses list, the template gallery and the template page share:
 * the template data model, the dialog host, the new-course and "start from template" flows, the
 * clone / save-as-template / delete dialogs, and the TemplateCard markup. Loaded after
 * templates-data.js and before the page file; exposes `window.CIOCourseUI`.
 *
 * Production sources mirrored:
 *   features/course/components/{template-row,template-preview-dialog,save-as-template-dialog,
 *     copy-course-modal,new-course-modal,course-context-menu-content}.svelte
 *   features/course/utils/template-display.ts, features/course/api/{course,course-template}.svelte.ts
 *   apps/api/src/services/course/course-template.ts (preview shape and settings rows)
 *   packages/ui/src/custom/{template-card,course-card}, packages/ui/src/base/dialog
 *
 * Optional fields this slice adds to a course (the model in model.js is unchanged):
 *   createdAt / updatedAt : ISO strings, set on create and clone
 *   bannerImage           : url (templates carry a real banner; blank courses fall back to course-banner.jpg)
 *   templateId, origin    : 'template' | 'blank' | 'clone' (templateId is a template id, never a course id)
 *   templateTitle         : the template's title at the time it was used
 *   templatePulledAt      : ISO string, set when the course is created from a template
 *   templateData          : { metadata, certificate, compliance, callout, settings } straight from the fixture
 *   certificate           : boolean (kept compatible with the starter courses)
 *   lesson items may also carry: videos [{youtubeId,title}], final (bool), questions [...] and exerciseSections [...]
 *     for kind 'exercise' (questions use the fixture shape {type,title,options:[{label,correct}],template})
 * Organisation templates live in S.orgTemplates (the platform ones are read-only fixtures).
 */
(function () {
  const P = window.proto;
  const M = window.model;
  const esc = P.escapeHtml;

  const PATHS = {
    chevronsUpDown: '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
    filter:
      '<path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/>',
    grid: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 12h18"/><path d="M12 3v18"/>',
    list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
    dotsv: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    circleDot: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/>',
    shieldCheck:
      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    trendingUp: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    bookOpen:
      '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    listChecks:
      '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    libraryBig:
      '<rect width="8" height="18" x="3" y="3" rx="1"/><path d="M7 3v18"/><path d="M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z"/>',
    lesson:
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    exercise:
      '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    video:
      '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    layers:
      '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
    template:
      '<rect width="18" height="7" x="3" y="3" rx="1"/><rect width="9" height="7" x="3" y="14" rx="1"/><rect width="5" height="7" x="16" y="14" rx="1"/>',
    trash:
      '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>'
  };

  function icon(name, size = 16) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:${size}px;height:${size}px;flex-shrink:0" aria-hidden="true">${PATHS[name] ?? P.ICONS?.[name] ?? ''}</svg>`;
  }

  /* ---------- copy: en.json verbatim ---------- */
  const TYPE_BADGES = {
    SELF_PACED: { icon: 'user', label: 'Self paced', tone: 'primary' },
    LIVE_CLASS: { icon: 'circleDot', label: 'Live class', tone: 'red' },
    COMPLIANCE: { icon: 'shieldCheck', label: 'Compliance', tone: 'green' },
    SPECIALIZATION: { icon: 'trendingUp', label: 'Specialization', tone: '' },
    PUBLIC: { icon: 'globe', label: 'Public', tone: 'primary' }
  };

  const COURSE_TYPES = [
    { value: 'SELF_PACED', id: 'self-paced', label: 'Self Paced', description: 'Best for courses where students can take lessons at their own pace' },
    { value: 'LIVE_CLASS', id: 'live-class', label: 'Live Class', description: 'Ideal for bootcamps where lessons are time based' },
    { value: 'COMPLIANCE', id: 'compliance', label: 'Compliance', description: 'Recurring training with retakes, reminders, and renewal tracking' },
    { value: 'PUBLIC', id: 'public', label: 'Public', description: 'Free, no-signup course pages you can share publicly — great for lead gen' }
  ];

  /* en.json: course.navItem... exercise question_types */
  const QUESTION_TYPES = {
    RADIO: 'Single answer',
    CHECKBOX: 'Multiple answers',
    TEXTAREA: 'Paragraph',
    TRUE_FALSE: 'True/False',
    THUMBS: 'Thumbs up/down',
    SHORT_ANSWER: 'Short answer',
    NUMERIC: 'Numeric answer',
    FILL_BLANK: 'Fill in the blank',
    FILE_UPLOAD: 'File upload',
    MATCHING: 'Matching',
    ORDERING: 'Ordering',
    HOTSPOT: 'Hotspot',
    LINK: 'Links',
    WORD_BANK: 'Word bank',
    STAR: 'Star rating',
    VIDEO_RECORDING: 'Video recording'
  };

  function typeBadge(type) {
    return TYPE_BADGES[type] ?? null;
  }

  function typeBadgeHTML(type, extraClass = '') {
    const badge = typeBadge(type);

    if (!badge) return '';

    return `<span class="cx-badge cx-badge-secondary cx-typebadge ${extraClass}"><span class="cx-tone-${badge.tone || 'none'}">${icon(badge.icon, 12)}</span>${esc(badge.label)}</span>`;
  }

  function plural(count, one, other) {
    return `${count} ${count === 1 ? one : other}`;
  }

  const FALLBACK_BANNER = 'course-banner.jpg';

  function bannerImg(url, attrs = '') {
    return `<img src="${esc(url || FALLBACK_BANNER)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_BANNER}'" ${attrs} />`;
  }

  function formatShortDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
  }

  /* ---------- templates: fixtures to the preview shape the API returns ---------- */
  function questionCountOf(exercise) {
    const direct = exercise.questions?.length ?? 0;
    const grouped = (exercise.sections ?? []).reduce((total, section) => total + section.questions.length, 0);

    return direct + grouped;
  }

  function settingsFromFixture(fixture) {
    const certificate = fixture.certificate ?? {};
    const metadata = fixture.metadata ?? {};
    const certificateOn = certificate.isDownloadable === true;
    const finalExercise = fixture.sections.flatMap((section) => section.exercises).find((exercise) => exercise.final);
    const score = typeof certificate.exerciseMinScorePercent === 'number' ? certificate.exerciseMinScorePercent : 100;

    return {
      certificate: certificateOn,
      deadline: certificate.deadline ?? null,
      threshold: certificateOn ? (typeof certificate.threshold === 'number' ? certificate.threshold : 100) : null,
      finalExercise: finalExercise ? { title: finalExercise.title, score } : null,
      sequential: metadata.progressionMode === 'sequential',
      grading: metadata.grading === true,
      commentsOff: metadata.commentsEnabled === false,
      lessonDownload: metadata.lessonDownload === true,
      selfEnrollment: metadata.allowSelfEnrollment ?? metadata.allowNewStudent ?? true,
      aiTutor: metadata.aiTutor?.enabled === true,
      compliance:
        fixture.type === 'COMPLIANCE' && fixture.compliance
          ? { months: fixture.compliance.retakeIntervalMonths, mandatory: fixture.compliance.isMandatory === true }
          : null
    };
  }

  function outlineFromFixture(fixture) {
    return fixture.sections.map((section, sectionIndex) => ({
      id: `${fixture.id}-s${sectionIndex + 1}`,
      title: section.title,
      lessons: section.lessons.map((lesson, lessonIndex) => ({
        id: `${fixture.id}-s${sectionIndex + 1}-l${lessonIndex + 1}`,
        title: lesson.title,
        html: lesson.content,
        videos: lesson.videos ?? []
      })),
      exercises: section.exercises.map((exercise, exerciseIndex) => ({
        id: `${fixture.id}-s${sectionIndex + 1}-e${exerciseIndex + 1}`,
        title: exercise.title,
        html: exercise.description ?? '',
        final: exercise.final === true,
        questions: exercise.questions ?? [],
        exerciseSections: exercise.sections ?? [],
        questionCount: questionCountOf(exercise)
      }))
    }));
  }

  function fromFixture(fixture) {
    return {
      id: fixture.id,
      global: true,
      curated: true,
      title: fixture.title,
      description: fixture.description,
      type: fixture.type,
      bannerImage: fixture.bannerImage,
      lastUsedAt: null,
      settings: settingsFromFixture(fixture),
      highlights: fixture.highlights ?? [],
      outline: outlineFromFixture(fixture),
      meta: {
        metadata: fixture.metadata,
        certificate: fixture.certificate,
        compliance: fixture.compliance,
        callout: fixture.callout
      }
    };
  }

  const GLOBAL_TEMPLATES = (window.CIO_TEMPLATE_FIXTURES ?? []).map(fromFixture);

  function orgTemplates(state) {
    if (!Array.isArray(state.orgTemplates)) state.orgTemplates = [];

    return state.orgTemplates;
  }

  /* The API's list endpoint: org templates first, then the curated ones. */
  function cards(state) {
    return { org: orgTemplates(state), global: GLOBAL_TEMPLATES };
  }

  function findTemplate(state, id) {
    return orgTemplates(state).find((template) => template.id === id) ?? GLOBAL_TEMPLATES.find((template) => template.id === id) ?? null;
  }

  function countsOf(template) {
    return {
      sections: template.outline.length,
      lessons: template.outline.reduce((total, section) => total + section.lessons.length, 0),
      exercises: template.outline.reduce((total, section) => total + section.exercises.length, 0)
    };
  }

  function templateSubtitle(template) {
    if (template.global) return 'Curated template';
    if (!template.lastUsedAt) return 'Your template';

    const date = formatShortDate(template.lastUsedAt);

    return date ? `Your template · Used ${date}` : 'Your template';
  }

  /* template-display.ts › templatePreviewSettingRows, same order and wording. */
  function settingRows(settings) {
    const rows = [];

    if (settings.certificate) rows.push('Certificate enabled');

    if (settings.deadline) {
      const date = formatShortDate(settings.deadline);

      if (date) rows.push(`Deadline ${date}`);
    }

    if (settings.threshold !== null && settings.threshold !== undefined) {
      rows.push(`Complete ${settings.threshold}% of the course`);
    }

    if (settings.finalExercise) rows.push(`Pass “${settings.finalExercise.title}” at ${settings.finalExercise.score}%`);
    if (settings.sequential) rows.push('Lessons unlock in order');
    if (settings.grading) rows.push('A tutor grades submissions');
    if (settings.commentsOff) rows.push('Lesson comments are off');
    if (settings.lessonDownload) rows.push('Learners can download lessons');
    if (settings.selfEnrollment) rows.push('Learners can join themselves');
    if (settings.aiTutor) rows.push('AI tutor is on');

    if (settings.compliance) {
      rows.push(`Retake every ${plural(settings.compliance.months, 'month', 'months')}`);
      if (settings.compliance.mandatory) rows.push('Mandatory');
    }

    return rows;
  }

  /* ---------- plan limit on templates (packages/utils/src/plans: Free includes one) ---------- */
  function templateLimit(state) {
    return state.plan === 'FREE' || !state.plan ? 1 : null;
  }

  function templateAtLimit(state) {
    const limit = templateLimit(state);

    return limit !== null && orgTemplates(state).length >= limit;
  }

  /* ---------- course creation ---------- */
  function uniqueSlug(state, title) {
    const base = P.slugify(title) || 'course';
    const taken = new Set(M.courses(state).map((course) => course.slug));

    if (!taken.has(base)) return base;

    let suffix = 2;

    while (taken.has(`${base}-${suffix}`)) suffix += 1;

    return `${base}-${suffix}`;
  }

  function finishCourse(state, course) {
    const now = new Date().toISOString();

    course.slug = uniqueSlug({ courses: state.courses.filter((other) => other !== course) }, course.title);
    course.visibility = 'private';
    course.createdAt = now;
    course.updatedAt = now;

    return course;
  }

  /* Validation as ZCourseCreate: title and description are both required (min 1); messages are the
   * generic ones production maps (validations.generic.too_small). */
  const TOO_SMALL = 'Value is too small. Minimum 1';

  function validateCourse({ title, description }) {
    const errors = {};

    if (!String(title ?? '').trim()) errors.title = TOO_SMALL;
    if (!String(description ?? '').trim()) errors.description = TOO_SMALL;

    return errors;
  }

  /* A blank course starts with no sections or lessons, as in production. */
  function createBlankCourse(state, { title, description, type }) {
    const course = M.createCourse(state, { title, desc: description, type, origin: 'blank', sections: [] });

    finishCourse(state, course);
    P.saveState(state);

    return course;
  }

  function sectionsFromTemplate(template) {
    return template.outline.map((section) => ({
      id: M.newId('section'),
      title: section.title ?? '',
      lessons: [
        ...section.lessons.map((lesson) => ({
          id: M.newId('lesson'),
          kind: 'lesson',
          title: lesson.title,
          html: lesson.html ?? '',
          published: true,
          ...(lesson.videos?.length ? { videos: structuredClone(lesson.videos) } : {})
        })),
        ...section.exercises.map((exercise) => ({
          id: M.newId('exercise'),
          kind: 'exercise',
          title: exercise.title,
          html: exercise.html ?? '',
          published: true,
          final: exercise.final === true,
          questions: structuredClone(exercise.questions ?? []),
          exerciseSections: structuredClone(exercise.exerciseSections ?? [])
        }))
      ]
    }));
  }

  /* classroomio.course.template[':templateId'].course.$post: copies the template into a new course. */
  function createCourseFromTemplate(state, template, title) {
    const now = new Date().toISOString();
    const course = M.createCourse(state, {
      title,
      desc: template.description ?? '',
      type: template.type,
      origin: 'template',
      templateId: template.id,
      sections: sectionsFromTemplate(template)
    });

    finishCourse(state, course);
    course.bannerImage = template.bannerImage || '';
    course.templateTitle = template.title;
    course.templatePulledAt = now;
    course.certificate = template.settings.certificate;
    course.templateData = { ...structuredClone(template.meta ?? {}), settings: structuredClone(template.settings) };

    if (!template.global) template.lastUsedAt = now;

    P.saveState(state);

    return course;
  }

  /* The preview dialog and the template page both end here: show "Copying…", create, tell the next page, go. */
  function useTemplate(state, template, title, { onBusy, delayMs = 900 }) {
    onBusy?.();
    setTimeout(() => {
      const course = createCourseFromTemplate(state, template, title.trim());

      flash(`Course created from ${template.title}`);
      window.location.href = M.R.course(course.id, 'lessons');
    }, delayMs);
  }

  function cloneCourse(state, source, { title, description }) {
    const now = new Date().toISOString();
    const copy = structuredClone(M.ensureCourse(source));

    copy.id = M.newId('course');
    copy.title = title.trim();
    copy.desc = (description ?? '').trim();
    copy.published = false;
    copy.origin = 'clone';
    copy.sections.forEach((section) => {
      section.id = M.newId('section');
      section.lessons.forEach((lesson) => {
        lesson.id = M.newId(lesson.kind === 'exercise' ? 'exercise' : 'lesson');
      });
    });

    state.courses.unshift(copy);
    finishCourse(state, copy);
    copy.updatedAt = now;
    P.saveState(state);

    return copy;
  }

  function studentCountOf(course) {
    if (Array.isArray(course.students)) return course.students.length;
    if (Array.isArray(course.people)) return course.people.filter((person) => person.role === 'student' || person.role === 'STUDENT').length;

    return 0;
  }

  /* classroomio.course[':courseId'].template.$post (copy) and .convert.$post */
  function templateFromCourse(state, course, title) {
    const sections = M.ensureCourse(course).sections;

    return {
      id: M.newId('template'),
      global: false,
      curated: false,
      title,
      description: course.desc ?? '',
      type: course.type ?? 'SELF_PACED',
      bannerImage: course.bannerImage ?? '',
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
      sourceCourseId: course.id,
      settings: course.templateData?.settings ?? {
        certificate: Boolean(course.certificate),
        deadline: null,
        threshold: course.certificate ? 100 : null,
        finalExercise: null,
        sequential: false,
        grading: false,
        commentsOff: false,
        lessonDownload: false,
        selfEnrollment: true,
        aiTutor: false,
        compliance: null
      },
      highlights: [],
      outline: sections.map((section) => ({
        id: M.newId('section'),
        title: section.title,
        lessons: section.lessons
          .filter((lesson) => lesson.kind !== 'exercise')
          .map((lesson) => ({ id: M.newId('lesson'), title: lesson.title, html: lesson.html ?? '', videos: lesson.videos ?? [] })),
        exercises: section.lessons
          .filter((lesson) => lesson.kind === 'exercise')
          .map((exercise) => ({
            id: M.newId('exercise'),
            title: exercise.title,
            html: exercise.html ?? '',
            final: exercise.final === true,
            questions: exercise.questions ?? [],
            exerciseSections: exercise.exerciseSections ?? [],
            questionCount: questionCountOf({ questions: exercise.questions, sections: exercise.exerciseSections })
          }))
      })),
      meta: course.templateData
        ? { metadata: course.templateData.metadata, certificate: course.templateData.certificate, compliance: course.templateData.compliance, callout: course.templateData.callout }
        : {}
    };
  }

  function saveCourseAsTemplate(state, course, title) {
    const template = templateFromCourse(state, course, title.trim());

    orgTemplates(state).unshift(template);
    P.saveState(state);

    return template;
  }

  function convertCourseToTemplate(state, course) {
    const template = templateFromCourse(state, course, course.title);

    orgTemplates(state).unshift(template);
    M.deleteCourse(state, course.id);
    P.saveState(state);

    return template;
  }

  function duplicateTemplate(state, template) {
    const copy = structuredClone(template);

    copy.id = M.newId('template');
    copy.global = false;
    copy.curated = false;
    copy.lastUsedAt = null;
    copy.createdAt = new Date().toISOString();
    copy.title = template.title;
    orgTemplates(state).unshift(copy);
    P.saveState(state);

    return copy;
  }

  function deleteTemplate(state, id) {
    state.orgTemplates = orgTemplates(state).filter((template) => template.id !== id);
    P.saveState(state);
  }

  /* ---------- dialog host (base/dialog) ---------- */
  let activeClose = null;

  function closeDialog() {
    if (activeClose) activeClose();
  }

  /**
   * Opens a dialog in #modal-host. `render(api)` returns the inner markup; `wire(root, api)` attaches
   * listeners. `api.rerender()` repaints in place; `api.close()` closes. Escape and a click on the
   * overlay close it, as base/dialog does.
   */
  function openDialog({ label, className = '', render, wire, onClose, dismissible = true }) {
    closeDialog();

    const host = document.querySelector('#modal-host');
    const restoreFocus = document.activeElement;
    const api = {
      root: null,
      close,
      rerender: paint
    };

    function onKey(event) {
      if (event.key === 'Escape' && dismissible) close();
    }

    function close() {
      if (activeClose !== close) return;

      activeClose = null;
      host.innerHTML = '';
      document.removeEventListener('keydown', onKey);
      onClose?.();
      if (restoreFocus && typeof restoreFocus.focus === 'function' && document.contains(restoreFocus)) restoreFocus.focus();
    }

    function paint() {
      const focusedId = document.activeElement?.id;
      const selection = document.activeElement?.selectionStart;

      host.innerHTML = `
        <div class="cx-scrim" data-cx-scrim>
          <div class="cx-dialog ${className}" role="dialog" aria-modal="true" aria-label="${esc(label)}">
            ${render(api)}
            ${dismissible ? `<button class="cx-dialog-x" type="button" data-cx-close aria-label="Close">${icon('x', 16)}</button>` : ''}
          </div>
        </div>`;
      api.root = host.querySelector('.cx-dialog');
      host.querySelector('[data-cx-scrim]').addEventListener('mousedown', (event) => {
        if (event.target.matches('[data-cx-scrim]') && dismissible) close();
      });
      host.querySelector('[data-cx-close]')?.addEventListener('click', close);
      wire?.(api.root, api);

      if (focusedId) {
        const again = api.root.querySelector(`#${focusedId}`);

        if (again) {
          again.focus();
          if (typeof selection === 'number' && again.setSelectionRange) again.setSelectionRange(selection, selection);
        }
      }
    }

    activeClose = close;
    document.addEventListener('keydown', onKey);
    paint();

    return api;
  }

  /* DeleteModal: "Delete" / "Are you sure?" / No / Yes. */
  function confirmDelete({ onDelete, delayMs = 450 }) {
    let loading = false;

    openDialog({
      label: 'Delete',
      className: 'cx-dialog-narrow',
      dismissible: true,
      render: () => `
        <div class="cx-dialog-head cx-pad"><h2 class="cx-dialog-title">Delete</h2></div>
        <p class="cx-sure">Are you sure?</p>
        <div class="cx-del-actions">
          <button class="btn btn-outline" type="button" data-no ${loading ? 'disabled' : ''}>No</button>
          <button class="btn btn-destructive" type="button" data-yes ${loading ? 'disabled' : ''}>${loading ? '<span class="cx-spin"></span>' : ''}Yes</button>
        </div>`,
      wire: (root, api) => {
        root.querySelector('[data-no]').addEventListener('click', api.close);
        root.querySelector('[data-yes]').addEventListener('click', () => {
          loading = true;
          api.rerender();
          setTimeout(() => {
            api.close();
            onDelete();
          }, delayMs);
        });
      }
    });
  }

  /* ---------- the Create a Course dialog (new-course-modal.svelte) ---------- */
  function openNewCourseDialog({ onClose, onCreated } = {}) {
    const form = { step: 0, type: 'SELF_PACED', title: '', description: '', errors: {}, loading: false };

    openDialog({
      label: 'Create a Course',
      onClose,
      render: () => {
        const head = `<div class="cx-dialog-head"><h2 class="cx-dialog-title">Create a Course</h2></div>`;

        if (form.step === 0) {
          return `
            ${head}
            <div class="cx-newbody">
              <p class="cx-fdesc">What type of course are you looking at?</p>
              <div class="cx-radios" role="radiogroup" aria-label="Course type">
                ${COURSE_TYPES.map(
                  (option) => `
                  <label class="cx-radio${form.type === option.value ? ' on' : ''}" for="ct-${option.id}">
                    <span class="cx-radio-tx"><b>${esc(option.label)}</b><span>${esc(option.description)}</span></span>
                    <input class="cx-sr" type="radio" name="course-type" id="ct-${option.id}" value="${option.value}" ${form.type === option.value ? 'checked' : ''} />
                    <span class="cx-radio-dot" aria-hidden="true"></span>
                  </label>`
                ).join('')}
              </div>
              <div class="cx-dialog-foot"><button class="btn btn-primary" type="button" data-next ${form.type ? '' : 'disabled'}>Next</button></div>
            </div>`;
        }

        return `
          ${head}
          <form class="cx-newform" novalidate>
            <div class="cx-field">
              <label class="cx-label" for="nc-title">Course name <span class="cx-req">*</span></label>
              <input class="input${form.errors.title ? ' bad' : ''}" id="nc-title" autocomplete="off" placeholder="Your course name" value="${esc(form.title)}" ${form.errors.title ? 'aria-invalid="true"' : ''} />
              ${form.errors.title ? `<p class="cx-err" role="alert">${esc(form.errors.title)}</p>` : ''}
            </div>
            <div class="cx-field">
              <label class="cx-label" for="nc-desc">Short Description <span class="cx-req">*</span></label>
              <textarea class="textarea${form.errors.description ? ' bad' : ''}" id="nc-desc" rows="4" placeholder="A little description about this course" ${form.errors.description ? 'aria-invalid="true"' : ''}>${esc(form.description)}</textarea>
              ${form.errors.description ? `<p class="cx-err" role="alert">${esc(form.errors.description)}</p>` : ''}
            </div>
            <div class="cx-dialog-foot">
              <button class="btn btn-outline" type="button" data-back ${form.loading ? 'disabled' : ''}>Back</button>
              <button class="btn btn-primary" type="submit" ${form.loading ? 'disabled' : ''}>${form.loading ? '<span class="cx-spin"></span>' : ''}Finish</button>
            </div>
          </form>`;
      },
      wire: (root, api) => {
        if (form.step === 0) {
          root.querySelectorAll('input[name="course-type"]').forEach((input) =>
            input.addEventListener('change', () => {
              form.type = input.value;
              api.rerender();
              api.root.querySelector(`#ct-${COURSE_TYPES.find((option) => option.value === form.type).id}`)?.focus();
            })
          );
          root.querySelector('[data-next]').addEventListener('click', () => {
            form.step = 1;
            api.rerender();
            api.root.querySelector('#nc-title')?.focus();
          });
          root.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' || event.target.tagName === 'BUTTON') return;

            event.preventDefault();
            root.querySelector('[data-next]').click();
          });
          root.querySelector('input[name="course-type"]:checked')?.focus();

          return;
        }

        const title = root.querySelector('#nc-title');
        const description = root.querySelector('#nc-desc');

        title.addEventListener('input', () => {
          form.title = title.value;

          if (form.errors.title) {
            delete form.errors.title;
            title.classList.remove('bad');
            title.removeAttribute('aria-invalid');
            title.parentElement.querySelector('.cx-err')?.remove();
          }
        });
        description.addEventListener('input', () => {
          form.description = description.value;

          if (form.errors.description) {
            delete form.errors.description;
            description.classList.remove('bad');
            description.removeAttribute('aria-invalid');
            description.parentElement.querySelector('.cx-err')?.remove();
          }
        });
        root.querySelector('[data-back]').addEventListener('click', () => {
          form.step = 0;
          api.rerender();
        });
        root.querySelector('form').addEventListener('submit', (event) => {
          event.preventDefault();

          if (form.loading) return;

          form.errors = validateCourse(form);

          if (Object.keys(form.errors).length) {
            api.rerender();
            api.root.querySelector(form.errors.title ? '#nc-title' : '#nc-desc')?.focus();

            return;
          }

          form.loading = true;
          api.rerender();
          setTimeout(() => onCreated?.({ title: form.title, description: form.description, type: form.type }, api), 500);
        });
        if (!title.value) title.focus();
      }
    });
  }

  /* ---------- copy-course-modal.svelte ---------- */
  function openCloneDialog({ course, onCloned }) {
    const form = { title: course.title, description: course.desc ?? '', errors: {}, loading: false };

    openDialog({
      label: 'Create a Course',
      className: 'cx-dialog-sm',
      render: () => `
        <div class="cx-dialog-head"><h2 class="cx-dialog-title">Create a Course</h2></div>
        <form class="cx-newform" novalidate>
          <div class="cx-field">
            <label class="cx-label" for="cc-title">Course name <span class="cx-req">*</span></label>
            <input class="input${form.errors.title ? ' bad' : ''}" id="cc-title" autocomplete="off" placeholder="Your course name" value="${esc(form.title)}" />
            ${form.errors.title ? `<p class="cx-err" role="alert">${esc(form.errors.title)}</p>` : ''}
          </div>
          <div class="cx-field">
            <label class="cx-label" for="cc-desc">Course description</label>
            <textarea class="textarea" id="cc-desc" rows="4" placeholder="Enter a description for your course">${esc(form.description)}</textarea>
          </div>
          <div class="cx-dialog-foot cx-rev"><button class="btn btn-primary" type="submit" ${form.loading ? 'disabled' : ''}>${form.loading ? '<span class="cx-spin"></span>' : ''}Create</button></div>
        </form>`,
      wire: (root, api) => {
        const title = root.querySelector('#cc-title');
        const description = root.querySelector('#cc-desc');

        title.addEventListener('input', () => {
          form.title = title.value;
          if (form.errors.title) {
            delete form.errors.title;
            title.classList.remove('bad');
            title.parentElement.querySelector('.cx-err')?.remove();
          }
        });
        description.addEventListener('input', () => (form.description = description.value));
        root.querySelector('form').addEventListener('submit', (event) => {
          event.preventDefault();

          if (form.loading) return;

          if (!form.title.trim()) {
            form.errors.title = TOO_SMALL;
            api.rerender();
            api.root.querySelector('#cc-title')?.focus();

            return;
          }

          form.loading = true;
          api.rerender();
          setTimeout(() => {
            api.close();
            onCloned({ title: form.title, description: form.description });
          }, 500);
        });
        title.focus();
        title.select();
      }
    });
  }

  /* ---------- save-as-template-dialog.svelte ---------- */
  function openSaveTemplateDialog({ state, course, onSaved, goTemplates, goUpgrade }) {
    const students = studentCountOf(course);
    const form = { mode: 'copy', name: course.title, error: '', loading: false };
    const limit = templateLimit(state);

    if (templateAtLimit(state)) {
      const existing = orgTemplates(state)[0];

      openDialog({
        label: 'Save as template',
        className: 'cx-dialog-sm',
        render: () => `
          <div class="cx-dialog-head">
            <h2 class="cx-dialog-title">Your plan includes ${plural(limit, 'template', 'templates')}</h2>
            <p class="cx-dialog-desc">You already have ${esc(existing?.title ?? 'Your template')}. Upgrade for more templates, or delete one you have.</p>
          </div>
          <div class="cx-dialog-foot">
            <button class="btn btn-secondary btn-sm cx-ml-auto-first" type="button" data-manage>Manage templates</button>
            <button class="btn btn-outline btn-sm" type="button" data-cancel>Cancel</button>
            <button class="btn btn-primary btn-sm" type="button" data-upgrade>Upgrade</button>
          </div>`,
        wire: (root, api) => {
          root.querySelector('[data-manage]').addEventListener('click', () => {
            api.close();
            goTemplates();
          });
          root.querySelector('[data-cancel]').addEventListener('click', api.close);
          root.querySelector('[data-upgrade]').addEventListener('click', () => {
            api.close();
            goUpgrade();
          });
        }
      });

      return;
    }

    openDialog({
      label: 'Save as template',
      className: 'cx-dialog-sm',
      render: () => `
        <div class="cx-dialog-head">
          <h2 class="cx-dialog-title">Save as template</h2>
          <p class="cx-dialog-desc">${esc(course.title)}</p>
        </div>
        <div class="cx-choices" role="radiogroup" aria-label="Save as template">
          <label class="cx-choice" for="st-copy">
            <input type="radio" name="st-mode" id="st-copy" value="copy" ${form.mode === 'copy' ? 'checked' : ''} />
            <span><b>Save a copy as template</b><small>The course stays as it is.</small></span>
          </label>
          <label class="cx-choice${students > 0 ? ' off' : ''}" for="st-convert">
            <input type="radio" name="st-mode" id="st-convert" value="convert" ${form.mode === 'convert' ? 'checked' : ''} ${students > 0 ? 'disabled' : ''} />
            <span><b>Convert this course</b><small>${
              students > 0
                ? `Has ${plural(students, 'student', 'students')} — save a copy instead.`
                : "The course becomes a template. It can't be published or have students."
            }</small>${course.published && students === 0 ? '<small>Converting unpublishes this course.</small>' : ''}</span>
          </label>
        </div>
        ${
          form.mode === 'copy'
            ? `<div class="cx-field cx-mt"><label class="cx-label" for="st-name">Template name</label><input class="input${form.error ? ' bad' : ''}" id="st-name" autocomplete="off" value="${esc(form.name)}" />${form.error ? `<p class="cx-err" role="alert">${esc(form.error)}</p>` : ''}</div>`
            : ''
        }
        <div class="cx-dialog-foot">
          <button class="btn btn-outline btn-sm" type="button" data-cancel>Cancel</button>
          <button class="btn btn-primary btn-sm" type="button" data-save ${form.loading || (form.mode === 'copy' ? !form.name.trim() : students > 0) ? 'disabled' : ''}>${form.loading ? '<span class="cx-spin"></span>' : ''}${form.mode === 'convert' ? 'Convert to template' : 'Save template'}</button>
        </div>`,
      wire: (root, api) => {
        root.querySelectorAll('input[name="st-mode"]').forEach((input) =>
          input.addEventListener('change', () => {
            form.mode = input.value;
            form.error = '';
            api.rerender();
          })
        );
        root.querySelector('#st-name')?.addEventListener('input', (event) => {
          form.name = event.target.value;
          form.error = '';
          root.querySelector('[data-save]').disabled = !form.name.trim();
          event.target.classList.remove('bad');
          event.target.parentElement.querySelector('.cx-err')?.remove();
        });
        root.querySelector('[data-cancel]').addEventListener('click', api.close);
        root.querySelector('[data-save]').addEventListener('click', () => {
          if (form.loading) return;

          form.loading = true;
          api.rerender();
          setTimeout(() => {
            const mode = form.mode;
            const name = form.name;

            api.close();
            onSaved({ mode, name });
          }, 500);
        });
      }
    });
  }

  /* ---------- TemplateCard (packages/ui/src/custom/template-card) ---------- */
  function templateCardHTML(template, { overlay = '', index = 0 } = {}) {
    const badge = typeBadge(template.type);

    return `
      <div class="tc-wrap" data-template-card="${esc(template.id)}">
        ${overlay}
        <button type="button" class="tc" data-open-template="${esc(template.id)}" aria-label="${esc(template.title)}">
          <span class="tc-img">
            ${bannerImg(template.bannerImage)}
            ${badge ? `<span class="cx-badge cx-badge-secondary tc-badge"><span class="cx-tone-${badge.tone || 'none'}">${icon(badge.icon, 12)}</span>${esc(badge.label)}</span>` : ''}
          </span>
          <span class="tc-tx"><span class="tc-title">${esc(template.title)}</span><span class="tc-sub">${esc(templateSubtitle(template))}</span></span>
        </button>
      </div>`;
  }

  function blankCardHTML() {
    return `
      <div class="tc-wrap">
        <button type="button" class="tc tc-blank" data-blank-template>
          <span class="tc-img"><span class="tc-wave" aria-hidden="true"></span><span class="tc-plus">${icon('plus', 24)}</span></span>
          <span class="tc-tx"><span class="tc-title">Blank course</span><span class="tc-sub">Start from scratch</span></span>
        </button>
      </div>`;
  }

  function skeletonCardHTML() {
    return `<div class="tc-wrap"><div class="tc-skel"><span class="cx-skel tc-skel-img"></span><span class="cx-skel" style="height:16px;width:75%"></span><span class="cx-skel" style="height:12px;width:50%"></span></div></div>`;
  }

  /* Written before a navigation; proto.js shows it as a toast on the next page (one added line, see the report). */
  function flash(message) {
    try {
      sessionStorage.setItem('cioFlash', message);
    } catch {
      /* storage can be blocked */
    }
  }

  window.CIOCourseUI = {
    icon,
    esc,
    plural,
    typeBadge,
    typeBadgeHTML,
    COURSE_TYPES,
    QUESTION_TYPES,
    bannerImg,
    FALLBACK_BANNER,
    formatShortDate,
    GLOBAL_TEMPLATES,
    cards,
    orgTemplates,
    findTemplate,
    countsOf,
    questionCountOf,
    templateSubtitle,
    settingRows,
    templateLimit,
    templateAtLimit,
    validateCourse,
    createBlankCourse,
    createCourseFromTemplate,
    useTemplate,
    cloneCourse,
    studentCountOf,
    saveCourseAsTemplate,
    convertCourseToTemplate,
    duplicateTemplate,
    deleteTemplate,
    openDialog,
    closeDialog,
    confirmDelete,
    openNewCourseDialog,
    openCloneDialog,
    openSaveTemplateDialog,
    templateCardHTML,
    blankCardHTML,
    skeletonCardHTML,
    flash
  };
})();
