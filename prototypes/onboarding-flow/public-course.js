/*
 * public-course.js — (org-site)/course/[slug]: the themed course landing page. The page is the real theme
 * component (CioCourse from site/bundle.js); props are built as features/ui/course-landing-page/utils.ts
 * buildCourseLandingPageProps does, from the prototype course (see academy-common.js for the fields read).
 * Enrol/Buy goes to enroll.html (free) or opens the payment dialog (paid), as production does.
 * An unpublished course is a 404 for visitors; the owner can look with ?preview=1.
 */
(function () {
  const A = window.academy;
  const { M, T } = A;
  const S = A.load();
  const params = new URLSearchParams(window.location.search);
  const root = document.getElementById('site-root');
  const course = M.findCourse(S, params.get('course'));
  const isOwner = A.viewer(S)?.kind === 'owner';
  const preview = params.get('preview') === '1' && isOwner;

  A.paintRoot(root, S);
  A.wireLogout(S);

  if (!course || (!course.published && !preview)) {
    document.title = 'Page not found';
    window.CioAcademy.mount('notFound', root, { homeHref: M.R.home, continueHref: M.R.publicCatalog });
    return;
  }

  M.ensureCourse(course);
  document.title = course.title;

  const info = A.meta(course);
  const lessons = (section) => section.lessons.filter((item) => item.kind !== 'exercise');
  const sections = course.sections.map((section) => ({
    id: section.id,
    title: section.title || course.title,
    lessons: lessons(section).map((lesson) => ({ id: lesson.id, title: lesson.title || T('common.restricted_page.untitled_lesson') })),
    exerciseCount: section.lessons.length - lessons(section).length
  }));
  const totalLessons = sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const visibleReviews = (info.reviews ?? []).filter((review) => !review?.hide);
  const averageRating = visibleReviews.length
    ? visibleReviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / visibleReviews.length
    : undefined;
  const display = info.sectionDisplay ?? {};
  const visible = (key, fallback = true) => (typeof display[key] === 'boolean' ? display[key] : fallback);
  const hasCertificate = Boolean(info.certificate?.templateUrl || course.certificate?.design?.templateId || course.certificate?.enabled);
  const typeLabel = T(`analytics.popularTypes.types.${course.type ?? 'SELF_PACED'}`);
  const paid = A.isPaid(course);
  const price = A.priceOf(course);
  const enrollDisabled = !A.selfEnrollmentAllowed(course);
  const ctaLabel = paid ? T('course.navItem.landing_page.pricing_section.buy') : T('course.navItem.landing_page.pricing_section.enroll');
  const enrollHref = A.rel(M.R.enroll(course.id));
  const paymentModal = window.CioAcademy.mount('paymentModal', document.getElementById('pay-root'), {
    open: false,
    paymentLink: info.paymentLink || '',
    courseId: course.id,
    onOpenChange: (open) => paymentModal.update({ open }),
    onPaymentRequest: ({ email }) => A.toast(`A payment request was sent to ${email} (simulated).`)
  });
  const onPaidClick = paid && !enrollDisabled
    ? (event) => {
        event.preventDefault();
        paymentModal.update({ open: true });
      }
    : undefined;
  const instructor = info.instructor ?? {};
  const org = A.orgOf(S);
  const chrome = A.chromeProps(S);

  const stats = [
    { label: T('course.navItem.landing_page.lessons'), value: String(totalLessons) },
    averageRating !== undefined ? { label: T('course.navItem.landing_page.editor.reviews_form.rating'), value: averageRating.toFixed(1) } : null,
    hasCertificate ? { label: T('course.navItem.landing_page.certificate'), value: T('common.restricted_page.included') } : null
  ].filter(Boolean);

  const props = {
    theme: chrome.theme,
    orgName: org.name,
    logoUrl: org.logoUrl,
    navItems: chrome.navItems,
    authAction: chrome.authAction,
    learnerAccount: chrome.learnerAccount,
    hero: {
      heading: course.title,
      subheading: course.desc ?? '',
      primaryAction: { label: ctaLabel, href: onPaidClick ? undefined : enrollHref, onclick: onPaidClick, disabled: enrollDisabled },
      secondaryAction: { label: T('course.navItem.landing_page.course_content'), href: '#curriculum' },
      image: A.bannerOf(course),
      stats,
      eyebrow: S.landing?.hero?.eyebrow
    },
    socialProof: { rating: averageRating, lessons: totalLessons > 0 ? totalLessons : undefined, type: typeLabel, hasCertificate },
    info: {
      requirements: visible('#requirement') && info.requirements ? info.requirements : undefined,
      description: visible('#description') && info.description ? info.description : undefined,
      goals: visible('#goals') && info.goals ? info.goals : undefined,
      certificateUrl: visible('#certificate') && info.certificate?.templateUrl ? info.certificate.templateUrl : undefined
    },
    curriculum: { grouped: sections.length > 0, sections },
    chips: { skills: info.skills ?? undefined, tools: info.tools ?? undefined },
    instructor: visible('#instructor')
      ? {
          name: instructor.name?.trim() || org.name || '',
          role: instructor.role || undefined,
          imgUrl: instructor.imgUrl || org.logoUrl || undefined,
          description: instructor.description || undefined,
          coursesNo: instructor.coursesNo || undefined
        }
      : { name: '' },
    reviews: {
      items: visible('#reviews', visibleReviews.length > 0)
        ? visibleReviews.map((review, index) => ({
            id: `review-${review.id ?? index}`,
            name: review.name ?? 'Anonymous',
            avatarUrl: review.avatar_url || undefined,
            rating: review.rating ?? 0,
            description: review.description ?? '',
            createdAt: review.created_at ? new Date(review.created_at).toISOString() : undefined
          }))
        : [],
      averageRating
    },
    pricing: {
      cost: price,
      currency: info.currency ?? course.currency ?? 'USD',
      discount: info.discount,
      showDiscount: info.showDiscount,
      ctaLabel,
      ctaHref: onPaidClick ? undefined : enrollHref,
      ctaOnclick: onPaidClick,
      ctaDisabled: enrollDisabled,
      reward: info.reward?.show ? { show: true, description: info.reward.description ?? '' } : undefined
    },
    footer: chrome.footer,
    labels: {
      socialProofRatingLabel: T('course.navItem.landing_page.editor.reviews_form.rating'),
      socialProofLessonsLabel: T('course.navItem.landing_page.lessons'),
      socialProofTypeLabel: T('common.restricted_page.format'),
      socialProofCertificateLabel: T('course.navItem.landing_page.certificate'),
      curriculumEyebrow: T('course.navItem.landing_page.editor.title.curriculum'),
      curriculumHeading: T('course.navItem.landing_page.course_content'),
      lessonsLabel: (count) => T('courses.course_card.lessons_count', { count }),
      exercisesLabel: (count) => T('courses.course_card.exercises_count', { count }),
      infoRequirementsHeading: T('course.navItem.landing_page.requirement'),
      infoDescriptionHeading: T('course.navItem.landing_page.description'),
      infoGoalsHeading: T('course.navItem.landing_page.learn'),
      infoCertificateHeading: T('course.navItem.landing_page.certificate'),
      instructorEyebrow: T('course.navItem.landing_page.instructor'),
      instructorHeading: T('course.navItem.landing_page.instructor'),
      reviewsEyebrow: T('course.navItem.landing_page.reviews'),
      reviewsHeading: T('course.navItem.landing_page.reviews'),
      pricingEyebrow: T('course.navItem.landing_page.pricing_section.enroll'),
      freeLabel: T('course.navItem.landing_page.pricing_section.free'),
      navAboutLabel: T('course.navItem.landing_page.editor.title.description'),
      navCurriculumLabel: T('course.navItem.landing_page.editor.title.curriculum'),
      navSkillsLabel: T('course.navItem.landing_page.editor.title.skills'),
      navInstructorLabel: T('course.navItem.landing_page.editor.title.instructor'),
      navReviewsLabel: T('course.navItem.landing_page.editor.title.reviews'),
      navPricingLabel: T('course.navItem.landing_page.editor.title.pricing'),
      factExercisesLabel: T('course.navItem.landing_page.exercises'),
      factIncludedLabel: T('common.restricted_page.included')
    }
  };

  window.CioCourse.render(root, props.theme, props);

  if (!course.published) {
    const bar = document.createElement('div');

    bar.className = 'pa-previewbar';
    bar.innerHTML = `<span>Preview: this course is unpublished, so visitors see a 404.</span> <a href="${M.R.courseSettings(course.id, 'publish')}">Publish it</a>`;
    document.body.prepend(bar);
  }

  A.mountEditBar(S, {
    label: 'Viewing as owner',
    actions: [
      { label: 'Edit landing page', href: M.R.course(course.id, 'landingpage') },
      { label: 'Edit lessons', href: M.R.course(course.id, 'lessons') },
      { label: 'Settings', href: M.R.courseSettings(course.id) }
    ]
  });
  A.mountPoweredBy(S);
})();
