/*
 * site-model.js — builds the props the real org landing page (packages/ui org-landing-page) takes,
 * from the onboarding state, and mounts the real theme component from site/bundle.js.
 *
 * The bundle and site/ui.css are generated from the repo's own sources (tools/site-bundle), so the
 * page is the production Quartz theme, not a re-drawing of it. Copy the user did not write comes
 * from the production defaults; the hero is personalised from the answers given in onboarding.
 */
(function () {
  const P = window.proto;
  const T = window.cioCopy.t;

  function brandOf(state) {
    return P.brandNameOf(state) || 'your academy';
  }

  function heroDefaults() {
    return {
      heading: 'Become a Certified AI Engineer',
      subheading: 'Master the skills, earn your certification, and prove your expertise with hands-on training programs.',
      primaryAction: { label: 'Start Learning', href: '/lms' },
      secondaryAction: { label: 'Browse', href: '/courses' },
      image: 'site/learn-on-cio.jpg'
    };
  }

  function settingsOf(state) {
    const saved = state.landing ?? {};
    const defaults = heroDefaults();

    return {
      hero: {
        ...defaults,
        ...(saved.hero ?? {}),
        primaryAction: { ...defaults.primaryAction, ...(saved.hero?.primaryAction ?? {}) },
        secondaryAction:
          saved.hero && 'secondaryAction' in saved.hero
            ? saved.hero.secondaryAction
              ? { ...defaults.secondaryAction, ...saved.hero.secondaryAction }
              : undefined
            : defaults.secondaryAction
      },
      navItems: saved.navItems ?? [{ label: 'Courses', href: '/courses' }],
      links: saved.links ?? { enabled: false, heading: 'Explore more', description: '', cards: [] },
      embed: saved.embed ?? { enabled: false, title: '', description: '', code: '' },
      callout: saved.callout ?? {
        enabled: false,
        heading: 'Ready to start learning?',
        description: '',
        action: { label: 'Get Started', href: '/login' }
      },
      footer: saved.footer,
      courseIds: saved.courseIds
    };
  }

  function lessonsOf(course) {
    return window.model ? window.model.counts(window.model.ensureCourse(course)).lessons : 9;
  }

  function coursesOf(state, includeDrafts = false) {
    return state.courses
      .filter((course) => includeDrafts || course.published)
      .map((course) => ({
        id: course.id,
        slug: course.id,
        title: course.title,
        description: course.desc ?? '',
        bannerImage: 'course-banner.jpg',
        type: course.type ?? 'SELF_PACED',
        typeLabel: course.published ? T(`analytics.popularTypes.types.${course.type ?? 'SELF_PACED'}`) : 'Draft',
        isPublished: Boolean(course.published),
        cost: 0,
        lessonCount: lessonsOf(course),
        exerciseCount: 0,
        totalStudents: 0,
        tags: [],
        link: `/course/${course.id}`
      }));
  }

  function labels() {
    return {
      catalogEyebrow: T('public_courses.heading'),
      catalogHeading: T('public_courses.heading'),
      catalogDescription: T('public_courses.subtitle'),
      browseCoursesLabel: T('dashboard.view_more'),
      enrollLabel: T('courses.course_card.learn_more'),
      freeLabel: T('course.navItem.landing_page.pricing_section.free'),
      featuredLabel: T('public_courses.heading'),
      filterAllLabel: T('audience.import.all_courses'),
      startCourseLabel: T('course.navItem.landing_page.start_course'),
      lessonsLabel: (count) => T('courses.course_card.lessons_count', { count }),
      exercisesLabel: (count) => T('courses.course_card.exercises_count', { count }),
      enrolledLabel: (count) => T('audience.learner_count', { count }),
      resourcesEyebrow: T('settings.landing_page.editor.sections.links'),
      embedEyebrow: T('settings.landing_page.editor.sections.embed'),
      calloutEyebrow: T('settings.landing_page.editor.sections.callout'),
      learnMoreLabel: T('courses.course_card.learn_more'),
      catalogEmptyTitle: T('public_courses.catalog_empty.title'),
      catalogEmptyDescription: T('public_courses.catalog_empty.description'),
      learningPathsHeading: T('common.restricted_page.learning_paths_heading'),
      browseLearningPathsLabel: T('dashboard.view_more'),
      learningPathLabel: T('common.restricted_page.learning_path_label'),
      learningPathCourseCountLabel: (count) => T('analytics.popularTypes.course_count', { count }),
      learningPathsEmptyTitle: T('public_courses.catalog_empty.title'),
      learningPathsEmptyDescription: T('public_courses.catalog_empty.description'),
      learningPathHoursLabel: (hours) => `${hours}h`,
      learningPathCertificateLabel: T('course.navItem.landing_page.certificate'),
      courseOutlineHeading: T('course.navItem.landing_page.course_content'),
      courseOutlineDescription: T('public_courses.subtitle'),
      courseCountLabel: (count) => T('analytics.popularTypes.course_count', { count }),
      learnersLabel: (count) => T('audience.learner_count', { count }),
      tracksLabel: (count) => T('common.restricted_page.tracks_label', { count }),
      terminalEnrollLabel: T('course.navItem.landing_page.pricing_section.enroll')
    };
  }

  function orderedCourses(courses, ids) {
    if (!ids) return courses;

    return ids.map((id) => courses.find((course) => course.id === id)).filter(Boolean);
  }

  function propsOf(state, overrides = {}) {
    const settings = overrides.settings ?? settingsOf(state);
    const chrome = window.academy ? window.academy.chromeProps(state) : {};

    return {
      orgName: brandOf(state),
      logoUrl: state.logoDataUrl || undefined,
      navItems: settings.navItems,
      authAction: chrome.authAction ?? { label: 'Go to dashboard', href: 'dashboard.html' },
      learnerAccount: chrome.learnerAccount,
      hero: settings.hero,
      links: settings.links,
      embed: settings.embed,
      callout: settings.callout,
      courses: orderedCourses(coursesOf(state, overrides.includeDrafts), settings.courseIds),
      hasMoreCourses: false,
      coursesLoaded: true,
      footer: settings.footer ?? chrome.footer,
      labels: labels()
    };
  }

  function mount(target, state, overrides) {
    const accent = P.parseColor(state.primary) ? state.primary : P.DEFAULT_PRIMARY;

    target.style.setProperty('--primary', accent);
    target.style.setProperty('--primary-foreground', P.readableOn(accent));
    return window.CioSite.render(
      target,
      P.canUseTheme(state.theme, state.plan) ? state.theme : 'quartz',
      propsOf(state, overrides),
      overrides?.edit
    );
  }

  function siteUrl(state) {
    return `https://${state.siteName || P.slugify(brandOf(state)) || 'your-academy'}.classroomio.com`;
  }

  window.siteModel = { settingsOf, propsOf, mount, siteUrl, brandOf, heroDefaults };
})();
