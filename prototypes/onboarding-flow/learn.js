/*
 * learn.js — the learner's course: (org-site)/course/[slug]/lesson/[itemSlug] and the learner view of
 * routes/(app)/courses/[id]. The UI is tools/academy-bundle/learner/*.svelte (a port of the production learner
 * layout, lesson, exercise and certificate pages on the real @cio/ui components); this file adapts the prototype
 * course and keeps progress in S.enrolled[courseId] (see academy-common.js for the shape).
 * The owner can open any course here ("View as student") without enrolling; progress is then saved for them.
 * Simulated: grading runs in the browser with packages/question-types, the certificate download opens a printable page.
 */
(function () {
  const A = window.academy;
  const { M, P } = A;
  const S = A.load();
  const params = new URLSearchParams(window.location.search);
  const root = document.getElementById('root');
  const course = M.findCourse(S, params.get('course'));
  const user = A.viewer(S);
  const org = A.orgOf(S);

  A.paintRoot(document.documentElement, S);
  document.documentElement.style.cssText += ';' + P.brandVars(S.primary);

  function notFound() {
    document.title = 'Page not found';
    window.CioAcademy.mount('notFound', root, { homeHref: M.R.home, continueHref: M.R.publicCatalog });
  }

  if (!course || (!course.published && user?.kind !== 'owner')) return notFound();

  if (!user) {
    window.location.replace(A.authHref('login', A.currentPageHref()));
    return;
  }

  if (user.kind !== 'owner' && !A.enrollment(S, course.id)) {
    window.location.replace(M.R.enroll(course.id));
    return;
  }

  M.ensureCourse(course);
  document.title = course.title || 'ClassroomIO Course';

  const sections = course.sections.map((section) => ({
    id: section.id,
    title: section.title,
    items: section.lessons.map((item) => ({
      id: item.id,
      kind: item.kind === 'exercise' ? 'exercise' : 'lesson',
      title: item.title,
      html: item.html || '',
      locked: A.isLocked(item),
      description: item.description || '',
      allowMultipleAttempts: item.allowMultipleAttempts,
      completionPolicy: item.completionPolicy,
      passThreshold: item.passThreshold,
      commentsEnabled: item.commentsEnabled,
      questions: item.questions || []
    }))
  }));
  const flat = sections.flatMap((section) => section.items);

  if (!flat.length) {
    window.CioAcademy.mount('notFound', root, { homeHref: M.R.home, continueHref: M.R.publicCatalog });
    return;
  }

  const requested = flat.find((item) => item.id === params.get('item') && !item.locked);
  const resume = A.continueItem(S, course);
  const activeId = (requested ?? flat.find((item) => item.id === resume?.id) ?? flat[0]).id;
  const tab = params.get('tab') === 'certificates' ? 'certificates' : 'content';

  function record() {
    return A.enrollment(S, course.id) || A.enroll(S, course.id);
  }

  function save() {
    P.saveState(S);
  }

  const store = {
    progress: () => A.enrollment(S, course.id)?.progress ?? {},
    setComplete(itemId, value) {
      const entry = record();

      if (value) entry.progress[itemId] = true;
      else delete entry.progress[itemId];
      save();
    },
    markCourseComplete() {
      record().completedAt = Date.now();
      save();
    },
    attempts: (itemId) => A.enrollment(S, course.id)?.submissions?.[itemId] ?? [],
    addAttempt(itemId, attempt) {
      const entry = record();

      entry.submissions = entry.submissions ?? {};
      entry.submissions[itemId] = [...(entry.submissions[itemId] ?? []), attempt];
      save();

      return entry.submissions[itemId];
    },
    comments: (lessonId) => A.enrollment(S, course.id)?.comments?.[lessonId] ?? [],
    addComment(lessonId, text) {
      const entry = record();

      entry.comments = entry.comments ?? {};
      entry.comments[lessonId] = [{ id: M.newId('c'), text, at: Date.now() }, ...(entry.comments[lessonId] ?? [])];
      save();

      return entry.comments[lessonId];
    },
    updateComment(lessonId, id, text) {
      const entry = record();

      entry.comments[lessonId] = entry.comments[lessonId].map((item) => (item.id === id ? { ...item, text } : item));
      save();

      return entry.comments[lessonId];
    },
    deleteComment(lessonId, id) {
      const entry = record();

      entry.comments[lessonId] = entry.comments[lessonId].filter((item) => item.id !== id);
      save();

      return entry.comments[lessonId];
    }
  };

  window.CioAcademy.mount('learner', root, {
    org: { name: org.name, logoUrl: org.logoUrl, siteName: org.siteName, plan: S.plan || 'FREE' },
    user: { fullname: user.fullname, email: user.email, avatarUrl: A.avatarFor(S, user.fullname) },
    course: { id: course.id, title: course.title, type: course.type || 'SELF_PACED', certificate: course.certificate || null },
    sections,
    activeId,
    tab,
    store,
    hrefs: { exit: M.R.publicCatalog, learn: (itemId, nextTab) => `${M.R.learn(course.id, itemId)}${nextTab ? `&tab=${nextTab}` : ''}` },
    notify: (message, kind) => window.CioAcademy.notify(message, kind),
    certificateDocument: (recipient) =>
      window.CioAcademy.certificateHtml(course.certificate || null, {
        recipientName: recipient,
        courseName: course.title,
        courseDescription: course.desc || '',
        orgName: org.name,
        orgLogoUrl: org.logoUrl,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        certificateId: `N° ${String(course.id).slice(-4).toUpperCase()}`
      })
  });
})();
