/*
 * academy-common.js — what the public academy pages (catalog, course landing page, enrol) and the learner
 * app share: who is viewing, the nav/footer/hero props the themes take, course pricing, enrolment state and
 * the route mapping for links that come from the landing page settings.
 *
 * State this slice adds (all optional, all in the one onboarding state object):
 *   S.learner  = { signedIn?: boolean, kind?: 'learner', fullname, email }
 *                Who is viewing the academy. Default: the account owner, signed in (an admin visiting their own
 *                academy is signed in, as in production). The learner menu's "Log out" sets signedIn:false; the
 *                sign-up form on enroll.html creates { signedIn:true, kind:'learner', ... }.
 *   S.learnerAccount = { fullname, email }   the last learner who signed up (so "Login" can restore them).
 *   S.enrolled = { [courseId]: { at, progress: { [itemId]: true }, submissions: { [exerciseId]: Attempt[] },
 *                  comments: { [lessonId]: Comment[] }, completedAt?: number } }
 *   Attempt    = { id, at, answers: { [questionKey]: AnswerData }, grades: { [questionKey]: number },
 *                  score, total, status: 'graded'|'pending' }
 *
 * Optional fields on a course that this slice reads (the landing page and settings editors write them; every one
 * mirrors a production Course.metadata key so nothing has to be translated):
 *   course.landing / course.metadata = { description, requirements, goals (markdown), skills[], tools[],
 *     instructor:{name,role,description,imgUrl,coursesNo}, reviews:[{id,name,avatar_url,rating,description,hide,created_at}],
 *     sectionDisplay:{ '#requirement':bool, '#description':bool, '#goals':bool, '#certificate':bool, '#reviews':bool,
 *     '#instructor':bool }, certificate:{templateUrl}, cost, currency, paymentEnabled, discount, showDiscount,
 *     reward:{show,description}, paymentLink, allowNewStudent|allowSelfEnrollment, bannerImage }
 *   course.cost / course.currency / course.bannerImage    fall-backs for the same
 *   course.certificate = { enabled?, isDownloadable?, threshold?, design?: CertificateDesign }   learner certificate
 *   lesson.published === false   shows as locked to a learner (production's isUnlocked:false)
 *   exercise item: { questions:[{id,title,questionType|questionTypeId,points,options:[{id,label,isCorrect}],settings}],
 *     description, allowMultipleAttempts, completionPolicy:'submitted'|'passed', passThreshold, dueBy }
 */
(function () {
  const P = window.proto;
  const M = window.model;
  const T = window.cioCopy.t;

  const DEFAULT_FOOTER = {
    brand: { socials: [] },
    columns: [],
    bottom: {
      text: '',
      links: [
        { id: 'terms', label: 'Terms', href: '#' },
        { id: 'privacy', label: 'Privacy', href: '#' },
        { id: 'contact', label: 'Contact', href: '#' }
      ]
    }
  };

  const AUTH_ROUTE = 'enroll.html';

  /** safeHref (packages/utils) rejects bare relative paths, so prototype links carry a ./ prefix */
  function rel(href) {
    return /^(\.\/|\.\.\/|\/|#|https?:|mailto:|tel:)/i.test(href) ? href : `./${href}`;
  }

  function load() {
    return P.loadState();
  }

  function themeOf(S) {
    return P.canUseTheme(S.theme, S.plan) ? S.theme : 'quartz';
  }

  function orgOf(S) {
    const info = M.orgInfo(S);

    return { name: info.name || 'Your academy', logoUrl: S.logoDataUrl || undefined, siteName: info.siteName, owner: info.owner };
  }

  function paintRoot(root, S) {
    const accent = P.parseColor(S.primary) ? S.primary : P.DEFAULT_PRIMARY;

    root.style.setProperty('--primary', accent);
    root.style.setProperty('--primary-foreground', P.readableOn(accent));
  }

  /* ---------- viewer ---------- */
  function viewer(S) {
    const learner = S.learner;

    if (learner && learner.signedIn === false) return null;

    if (learner && learner.signedIn && learner.kind === 'learner') {
      return { kind: 'learner', fullname: learner.fullname, email: learner.email };
    }

    return {
      kind: 'owner',
      fullname: (S.fullname || '').trim() || 'Academy owner',
      email: (S.email || '').trim() || 'owner@example.com'
    };
  }

  function signIn(S, account) {
    S.learner = account.kind === 'owner' ? { signedIn: true } : { signedIn: true, kind: 'learner', fullname: account.fullname, email: account.email };
    P.saveState(S);
  }

  function signOut(S) {
    S.learner = { ...(S.learner ?? {}), signedIn: false };
    P.saveState(S);
  }

  function authHref(mode, next) {
    const params = new URLSearchParams({ auth: mode });

    if (next) params.set('next', next);

    return rel(`${AUTH_ROUTE}?${params.toString()}`);
  }

  function currentPageHref() {
    return `${window.location.pathname.split('/').pop()}${window.location.search}`;
  }

  function enrolledIds(S) {
    return Object.keys(S.enrolled ?? {}).filter((id) => M.findCourse(S, id));
  }

  /** production getOrgLandingAuthAction: login when signed out; the member's way back in otherwise */
  function authAction(S) {
    const user = viewer(S);

    if (!user) return { label: T('navigation.login'), href: authHref('login', currentPageHref()) };

    if (user.kind === 'owner') return { label: 'Go to dashboard', href: rel(M.R.dashboard) };

    const latest = enrolledIds(S).slice(-1)[0];

    return { label: T('landing.learner_menu.continue_learning'), href: rel(latest ? learnHref(S, M.findCourse(S, latest)) : M.R.publicCatalog) };
  }

  function avatarFor(S, name) {
    const accent = P.parseColor(S.primary) ? S.primary : P.DEFAULT_PRIMARY;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${accent}"/><text x="32" y="41" font-family="Arial,sans-serif" font-size="26" font-weight="600" text-anchor="middle" fill="${P.readableOn(accent)}">${P.escapeHtml(P.initials(name).slice(0, 2))}</text></svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  /** production getOrgLandingLearnerAccount; Log out is intercepted by wireLogout */
  function learnerAccount(S) {
    const user = viewer(S);

    if (!user) return undefined;

    const enrolled = enrolledIds(S);
    const latest = enrolled.slice(-1)[0];
    const items = [];

    if (latest) {
      items.push({ key: 'myCourses', label: T('landing.learner_menu.my_courses'), href: rel(learnHref(S, M.findCourse(S, latest))) });
      items.push({
        key: 'myCertificates',
        label: T('landing.learner_menu.my_certificates'),
        href: rel(`${M.R.learn(latest)}&tab=certificates`)
      });
    }

    items.push({ key: 'accountSettings', label: T('landing.learner_menu.account_settings'), href: rel(M.R.accountSettings) });

    return {
      fullname: user.fullname,
      email: user.email,
      avatarUrl: avatarFor(S, user.fullname),
      items,
      note: user.kind === 'owner' ? undefined : undefined,
      logoutLabel: T('settings.profile.logout'),
      logoutHref: '#cio-logout',
      themeLabel: T('landing.learner_menu.theme'),
      themeModeLabels: {
        light: T('landing.learner_menu.theme_light'),
        dark: T('landing.learner_menu.theme_dark'),
        system: T('landing.learner_menu.theme_system')
      },
      triggerLabel: T('landing.learner_menu.trigger_label', { email: user.email }),
      onThemeChange: () => {}
    };
  }

  /** The learner menu's Log out is a link; sign out in state and reload the page as a visitor. */
  function wireLogout(S) {
    document.addEventListener('click', (event) => {
      const link = event.target.closest?.('a[href="#cio-logout"]');

      if (!link) return;

      event.preventDefault();
      signOut(S);
      window.location.reload();
    });
  }

  /* ---------- links that come from landing page settings ---------- */
  function routeHref(href) {
    const value = String(href ?? '').trim();

    if (!value) return '#';
    if (value.startsWith('#')) return value === '#' ? '#' : rel(`${M.R.home}${value}`);
    if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
    if (value === '/' || value === '/lms') return rel(M.R.home);
    if (value === '/courses') return rel(M.R.publicCatalog);

    const course = value.match(/^\/course\/([^/?#]+)/);

    if (course) return rel(M.R.publicCourse(course[1]));

    return '#';
  }

  function navItemsOf(S) {
    const settings = window.siteModel.settingsOf(S);

    return (settings.navItems ?? []).map((item) => ({ ...item, href: routeHref(item.href) }));
  }

  function heroOf(S) {
    return window.siteModel.settingsOf(S).hero;
  }

  function footerOf(S) {
    return S.landing?.footer ?? DEFAULT_FOOTER;
  }

  /** the props every themed public page takes for the chrome */
  function chromeProps(S) {
    const org = orgOf(S);

    return {
      theme: themeOf(S),
      orgName: org.name,
      logoUrl: org.logoUrl,
      navItems: navItemsOf(S),
      authAction: authAction(S),
      learnerAccount: learnerAccount(S),
      footer: footerOf(S)
    };
  }

  /* ---------- course data ---------- */
  function meta(course) {
    return { ...(course.metadata ?? {}), ...(course.landing ?? {}) };
  }

  function costOf(course) {
    const info = meta(course);
    const cost = Number(info.cost ?? course.cost ?? 0);

    return Number.isFinite(cost) ? cost : 0;
  }

  function isPaid(course) {
    const info = meta(course);

    if (typeof info.paymentEnabled === 'boolean') return info.paymentEnabled;

    return costOf(course) > 0;
  }

  /** production calcCourseCost: the price after the discount, 0 when the course is free */
  function priceOf(course) {
    if (!isPaid(course)) return 0;

    const info = meta(course);
    const cost = costOf(course);
    const discount = Number(info.discount ?? 0);

    return info.showDiscount && discount > 0 ? Math.round(cost * (1 - discount / 100) * 100) / 100 : cost;
  }

  function bannerOf(course) {
    return meta(course).bannerImage || course.bannerImage || 'course-banner.jpg';
  }

  function selfEnrollmentAllowed(course) {
    const info = meta(course);

    return info.allowSelfEnrollment ?? info.allowNewStudent ?? true;
  }

  function isLocked(item) {
    return item.published === false;
  }

  function items(course) {
    return M.lessonsOf(course);
  }

  function firstItem(course) {
    return items(course).find((item) => !isLocked(item)) ?? items(course)[0] ?? null;
  }

  /** where Start/Continue lands: the first item still to do, else the first one */
  function continueItem(S, course) {
    const progress = S.enrolled?.[course.id]?.progress ?? {};

    return items(course).find((item) => !isLocked(item) && !progress[item.id]) ?? firstItem(course);
  }

  function learnHref(S, course) {
    const item = continueItem(S, course);

    return M.R.learn(course.id, item?.id);
  }

  function catalogItem(S, course) {
    M.ensureCourse(course);

    const counts = M.counts(course);
    const info = meta(course);
    const type = course.type ?? 'SELF_PACED';
    const paid = isPaid(course);

    return {
      id: course.id,
      slug: course.id,
      title: course.title,
      description: course.desc ?? '',
      bannerImage: bannerOf(course),
      type,
      typeValue: type,
      typeLabel: T(`analytics.popularTypes.types.${type}`),
      isPublished: true,
      paid,
      cost: paid ? costOf(course) : 0,
      currency: info.currency ?? course.currency ?? 'USD',
      lessonCount: counts.lessons,
      exerciseCount: counts.exercises,
      metadata: { discount: info.discount, showDiscount: info.showDiscount },
      tags: Array.isArray(course.tags) ? course.tags : [],
      link: rel(M.R.publicCourse(course.id))
    };
  }

  function publishedCourses(S) {
    return M.courses(S).filter((course) => course.published);
  }

  /* ---------- enrolment ---------- */
  function enrollment(S, courseId) {
    return S.enrolled?.[courseId] ?? null;
  }

  function enroll(S, courseId) {
    S.enrolled = S.enrolled ?? {};

    if (!S.enrolled[courseId]) {
      S.enrolled[courseId] = { at: Date.now(), progress: {}, submissions: {}, comments: {} };
    }

    P.saveState(S);

    return S.enrolled[courseId];
  }

  function mountPoweredBy(S) {
    if (String(S.plan || 'FREE').toUpperCase() !== 'FREE') return;

    const link = document.createElement('a');

    link.className = 'pa-powered';
    link.href = 'https://classroomio.com';
    link.target = '_blank';
    link.rel = 'noopener';
    link.innerHTML = `<img src="logo-192.png" alt="logo" /><span>${P.escapeHtml(T('course.navItem.landing_page.powered_by'))} ClassroomIO</span>`;
    document.body.appendChild(link);
  }

  function toast(message, kind) {
    if (window.CioAcademy?.notify) window.CioAcademy.notify(message, kind);
    else P.toast(message);
  }

  window.academy = {
    P,
    M,
    T,
    avatarFor,
    load,
    themeOf,
    orgOf,
    paintRoot,
    viewer,
    signIn,
    signOut,
    authHref,
    rel,
    authAction,
    learnerAccount,
    wireLogout,
    routeHref,
    chromeProps,
    navItemsOf,
    heroOf,
    footerOf,
    meta,
    costOf,
    isPaid,
    priceOf,
    bannerOf,
    selfEnrollmentAllowed,
    isLocked,
    items,
    firstItem,
    continueItem,
    learnHref,
    catalogItem,
    publishedCourses,
    enrollment,
    enrolledIds,
    enroll,
    mountPoweredBy,
    currentPageHref,
    toast
  };
})();
