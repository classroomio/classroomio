/*
 * course-landing.js — the course landing page editor (routes/(app)/courses/[id]/landingpage and
 * lib/features/ui/course-landing-page/components/editor/*): a full-screen takeover with the Page Builder
 * sidebar (Header, Requirement, Description, Goals, Skills & Tools, Certificate, Reviews, Instructor, Pricing)
 * and a live preview. The preview is course-landing-frame.html, which mounts the real course landing
 * component of the org's theme from site/bundle.js (window.CioCourse, tools/site-bundle/course-entry.ts) in
 * edit mode, so clicking a section in the preview opens its form.
 *
 * Saved data (document, all optional) on a course:
 *   course.title, course.desc, course.bannerImage        the Header section (same fields as Settings)
 *   course.cost, course.currency                          mirrors of landing.cost / landing.currency
 *   course.landing = {                                    production Course.metadata keys
 *     videoUrl, requirements, description, goals          HTML
 *     certificate: { templateUrl }, skills[], tools[]
 *     instructor: { name, role, imgUrl, description, coursesNo }
 *     reviews: [{ id, hide, name, avatar_url, rating, created_at, description }]
 *     sectionDisplay: { '#requirement'|'#description'|'#goals'|'#certificate'|'#reviews'|'#instructor': boolean }
 *     paymentEnabled, currency ('USD'|'NGN'), cost, paymentLink, showDiscount, discount, reward: { show, description }
 *   }
 * When course.landing is missing the editor starts from course.metadata (what a template course carries).
 *
 * `window.courseLandingModel.propsOf(S, course)` builds the CourseLandingPageProps the real component takes
 * (a port of buildCourseLandingPageProps); the frame and any public course page can use it.
 */
(function () {
  'use strict';

  const P = window.proto;
  const M = window.model;
  const K = window.CourseKit;
  const esc = P.escapeHtml;

  const KEYS = {
    requirement: '#requirement',
    description: '#description',
    goals: '#goals',
    certificate: '#certificate',
    reviews: '#reviews',
    instructor: '#instructor'
  };

  const SECTION_ICONS = {
    header: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/>',
    requirement: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/>',
    description: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    goals: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    chips: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    certificate: '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
    reviews: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    instructor: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    pricing: '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>'
  };

  const SECTIONS = [
    ['header', 'Header'],
    ['requirement', 'Requirement'],
    ['description', 'Description'],
    ['goals', 'Goals'],
    ['chips', 'Skills & Tools'],
    ['certificate', 'Certificate'],
    ['reviews', 'Reviews'],
    ['instructor', 'Instructor'],
    ['pricing', 'Pricing']
  ];

  const LABELS = {
    header: 'Header',
    hero: 'Header',
    requirement: 'Requirement',
    description: 'Description',
    goals: 'Goals',
    certificate: 'Certificate',
    curriculum: 'Curriculum',
    chips: 'Skills & Tools',
    instructor: 'Instructor',
    reviews: 'Reviews',
    pricing: 'Pricing',
    navigation: 'Navigation',
    footer: 'Footer'
  };

  const CERT_PLACEHOLDER =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="560" height="400" viewBox="0 0 560 400"><rect width="560" height="400" fill="#fdfbf7"/><rect x="16" y="16" width="528" height="368" fill="none" stroke="#cfc5b3" stroke-width="3"/><text x="280" y="120" text-anchor="middle" font-family="Georgia,serif" font-size="34" fill="#17140f">Certificate</text><text x="280" y="160" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#6b6152">of completion</text><line x1="150" y1="250" x2="410" y2="250" stroke="#8c8272"/><text x="280" y="275" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#6b6152">Student name</text></svg>'
    );

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* ============================ props for the real component ============================ */

  function landingOf(course) {
    return { ...(course.metadata ?? {}), ...(course.landing ?? {}) };
  }

  function isPaid(course) {
    const info = landingOf(course);

    if (typeof info.paymentEnabled === 'boolean') return info.paymentEnabled;

    return Number(info.cost ?? course.cost ?? 0) > 0;
  }

  function costOf(course) {
    if (!isPaid(course)) return 0;

    const info = landingOf(course);
    const cost = Number(info.cost ?? course.cost ?? 0) || 0;
    const discount = Number(info.discount ?? 0);

    return info.showDiscount && discount > 0 ? Math.round(cost - (discount / 100) * cost) : cost;
  }

  function sectionsOf(course) {
    M.ensureCourse(course);

    const grouped = course.contentGrouping !== false;
    const visible = (lesson) => lesson.published !== false;
    const lessonsIn = (items) => items.filter((item) => item.kind !== 'exercise' && visible(item)).map((item) => ({ id: item.id, title: item.title }));
    const exercisesIn = (items) => items.filter((item) => item.kind === 'exercise' && visible(item)).length;

    if (grouped) {
      return course.sections.map((section) => ({
        id: section.id,
        title: section.title,
        lessons: lessonsIn(section.lessons),
        exerciseCount: exercisesIn(section.lessons)
      }));
    }

    const all = course.sections.flatMap((section) => section.lessons);

    return all.length ? [{ id: 'ungrouped', title: course.title, lessons: lessonsIn(all), exerciseCount: exercisesIn(all) }] : [];
  }

  function plural(word) {
    return (count) => `${count} ${count === 1 ? word : `${word}s`}`;
  }

  function typeLabel(type) {
    return { COMPLIANCE: 'Compliance', LIVE_CLASS: 'Live class', PUBLIC: 'Public' }[type] ?? 'Self paced';
  }

  function propsOf(S, course, options = {}) {
    const info = landingOf(course);
    const site = window.siteModel.propsOf(S);
    const reviewsAll = Array.isArray(info.reviews) ? info.reviews : [];
    const reviews = reviewsAll.filter((review) => !review?.hide);
    const display = info.sectionDisplay ?? {};
    const show = (key, fallback = true) => (typeof display[key] === 'boolean' ? display[key] : fallback);
    const sections = sectionsOf(course);
    const totalLessons = sections.reduce((sum, section) => sum + section.lessons.length, 0);
    const average = reviews.length ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviews.length : undefined;
    const templateUrl = info.certificate?.templateUrl;
    const hasCertificate = Boolean(templateUrl);
    const instructor = info.instructor ?? {};
    const paid = isPaid(course);
    const cost = costOf(course);
    const cta = paid ? 'Buy Now' : 'Enroll Now';
    const href = options.enrollHref ?? M.R.enroll(course.id);
    const nav = (site.navItems ?? []).map((item) => ({ ...item, href: item.href.startsWith('#') ? `${M.R.home}${item.href}` : item.href }));
    const selfEnroll = course.selfEnroll !== false;

    return {
      theme: P.canUseTheme(S.theme, S.plan) ? S.theme : 'quartz',
      orgName: site.orgName,
      logoUrl: site.logoUrl,
      navItems: nav,
      authAction: options.authAction ?? site.authAction,
      learnerAccount: options.learnerAccount,
      hero: {
        heading: course.title ?? '',
        subheading: course.desc ?? '',
        primaryAction: { label: cta, href, disabled: options.edit || !selfEnroll },
        secondaryAction: { label: 'Course content', href: '#curriculum' },
        image: course.bannerImage || 'course-banner.jpg',
        stats: [
          { label: 'Lessons', value: String(totalLessons) },
          average !== undefined ? { label: 'Rating', value: average.toFixed(1) } : null,
          hasCertificate ? { label: 'Certificate', value: 'Included' } : null
        ].filter(Boolean)
      },
      socialProof: {
        rating: average,
        lessons: totalLessons > 0 ? totalLessons : undefined,
        type: typeLabel(course.type),
        hasCertificate
      },
      info: {
        requirements: show(KEYS.requirement) && info.requirements ? info.requirements : undefined,
        description: show(KEYS.description) && info.description ? info.description : undefined,
        goals: show(KEYS.goals) && info.goals ? info.goals : undefined,
        certificateUrl: show(KEYS.certificate) && templateUrl ? templateUrl : undefined
      },
      curriculum: {
        grouped: course.contentGrouping !== false,
        sections
      },
      chips: { skills: info.skills ?? undefined, tools: info.tools ?? undefined },
      instructor: show(KEYS.instructor)
        ? {
            name: (instructor.name || '').trim() || site.orgName,
            role: instructor.role || undefined,
            imgUrl: instructor.imgUrl || site.logoUrl || undefined,
            description: instructor.description || undefined,
            coursesNo: Number(instructor.coursesNo) || undefined
          }
        : { name: '' },
      reviews: {
        items: show(KEYS.reviews, reviews.length > 0)
          ? reviews.map((review, index) => ({
              id: `review-${review.id ?? index}`,
              name: review.name || 'Anonymous',
              avatarUrl: review.avatar_url || undefined,
              rating: review.rating ?? 0,
              description: review.description ?? '',
              createdAt: review.created_at ? new Date(review.created_at).toISOString() : undefined
            }))
          : [],
        averageRating: average
      },
      pricing: {
        cost,
        currency: info.currency ?? course.currency ?? 'USD',
        discount: info.discount,
        showDiscount: info.showDiscount,
        ctaLabel: cta,
        ctaHref: href,
        ctaDisabled: options.edit || !selfEnroll,
        reward: info.reward?.show ? { show: true, description: info.reward.description ?? '' } : undefined
      },
      footer: site.footer,
      labels: {
        socialProofRatingLabel: 'Rating',
        socialProofLessonsLabel: 'Lessons',
        socialProofTypeLabel: 'Format',
        socialProofCertificateLabel: 'Certificate',
        curriculumEyebrow: 'Curriculum',
        curriculumHeading: 'Course content',
        lessonsLabel: plural('lesson'),
        exercisesLabel: plural('exercise'),
        infoRequirementsHeading: 'Requirement',
        infoDescriptionHeading: 'Course Description',
        infoGoalsHeading: "What you'll learn",
        infoCertificateHeading: 'Certificate',
        instructorEyebrow: 'Instructor',
        instructorHeading: 'Instructor',
        reviewsEyebrow: 'Reviews',
        reviewsHeading: 'Reviews',
        pricingEyebrow: 'Enroll Now',
        freeLabel: 'Free',
        navAboutLabel: 'Description',
        navCurriculumLabel: 'Curriculum',
        navSkillsLabel: 'Skills & Tools',
        navInstructorLabel: 'Instructor',
        navReviewsLabel: 'Reviews',
        navPricingLabel: 'Pricing',
        factExercisesLabel: 'Exercises',
        factIncludedLabel: 'Included'
      }
    };
  }

  window.courseLandingModel = { propsOf, landingOf, isPaid, costOf, sectionsOf };

  /* ============================ editor ============================ */

  const COURSE_TABS = (window.COURSE_TABS = window.COURSE_TABS || {});
  const UNSAVED = 'You have unsaved changes. Are you sure you want to leave?';

  let ed = null;

  function landingDraft(course) {
    const info = clone(landingOf(course));

    info.sectionDisplay = info.sectionDisplay ?? {};
    info.reviews = Array.isArray(info.reviews) ? info.reviews : [];
    info.skills = info.skills ?? [];
    info.tools = info.tools ?? [];
    info.instructor = info.instructor ?? {};

    return info;
  }

  function viewOf(course) {
    return { ...clone({ ...course, sections: undefined }), sections: course.sections, title: ed.title, desc: ed.desc, bannerImage: ed.banner, landing: ed.land };
  }

  function dirty() {
    return JSON.stringify(snapshot()) !== ed.base;
  }

  function snapshot() {
    return { title: ed.title, desc: ed.desc, banner: ed.banner, land: ed.land };
  }

  function validPayment(link) {
    return /^https?:\/\/\S+\.\S+/i.test(link);
  }

  function paymentError(showAlways) {
    const paid = isPaid(viewOf(ed.ctx.course));

    if (!paid) return '';

    const link = String(ed.land.paymentLink ?? '').trim();

    if (!link) return showAlways || ed.paymentShown ? 'A payment link is required for paid courses' : '';
    if (!validPayment(link)) return 'Please enter a valid URL (e.g. https://pay.example.com)';

    return '';
  }

  function say(message, error) {
    P.toast(message, { error });
  }

  function pushPreview() {
    const frame = document.getElementById('cl-frame');

    if (!frame?.contentWindow) return;

    clearTimeout(ed.timer);
    ed.timer = setTimeout(() => {
      frame.contentWindow.postMessage({ type: 'cl-draft', course: viewOf(ed.ctx.course) }, '*');
    }, 80);
  }

  function touch() {
    paintHead();
    pushPreview();
  }

  function setLand(path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((node, key) => {
      if (typeof node[key] !== 'object' || node[key] === null) node[key] = {};

      return node[key];
    }, ed.land);

    target[last] = value;
    touch();
  }

  function paintHead() {
    const head = document.getElementById('cl-head');

    if (!head) return;

    const section = SECTIONS.find((item) => item[0] === ed.selected);

    if (!section) {
      head.innerHTML = `<button type="button" class="ck-btn secondary icon" data-act="close" aria-label="Close">${K.ic('x')}</button>
        <div class="cst-row">
          <button type="button" class="ck-btn outline" data-act="save" ${dirty() ? '' : ''}>Save</button>
          <button type="button" class="ck-btn secondary icon ck-tip below" data-tip="Preview course" aria-label="Preview course" data-act="preview">${K.ic('eye')}</button>
        </div>`;
    } else {
      head.innerHTML = `<div class="cst-row"><button type="button" class="ck-btn secondary icon" data-act="back" aria-label="Back">${K.ic('left')}</button><h3>${esc(section[1])}</h3></div>`;
    }
  }

  function label(text, extra = '') {
    return `<p class="cl-lab">${esc(text)}${extra}</p>`;
  }

  function showToggle(key) {
    const on = ed.land.sectionDisplay[key] ?? true;

    return `<div class="cl-show"><p>Display section</p><div class="cst-row">${K.sw(`cl-show-${key.slice(1)}`, on, `data-show="${key}"`)}<span class="cl-gray">${on ? 'Show Section' : 'Hide Section'}</span></div></div>`;
  }

  function imageBox({ src, round, placeholder, act }) {
    return `<button type="button" class="cl-img ${round ? 'round' : ''}" data-act="${act}" aria-label="Upload image">
      ${src ? `<img src="${esc(src)}" alt="" />` : `<span class="cl-img-ph">${K.ic('user', 32)}</span>`}
      <span class="cl-img-ov">${K.ic('upload', 16)}</span>
    </button><span class="cl-img-cap">Upload image</span>${placeholder ?? ''}`;
  }

  function formHtml(key) {
    const land = ed.land;

    if (key === 'header') {
      return `<div class="cl-form">
        <div class="cst-field"><label class="cl-lab" for="cl-title">Title</label><input class="input" id="cl-title" data-bind="title" value="${esc(ed.title)}" /></div>
        <div class="cst-field"><label class="cl-lab" for="cl-desc">Description</label><textarea class="textarea" id="cl-desc" rows="6" data-bind="desc">${esc(ed.desc)}</textarea></div>
        <div class="cst-field"><label class="cl-lab" for="cl-video">Short Video</label><input class="input" id="cl-video" data-land="videoUrl" placeholder="www.youtube.com/watch?v=uYRq60G5XTk" value="${esc(land.videoUrl ?? '')}" /><p class="cst-desc">Enter a link to a youtube video</p></div>
        <div class="cst-field"><p class="cl-lab">Cover image</p>
          ${ed.banner ? `<div class="cl-cover"><img src="${esc(ed.banner)}" alt="" /></div>` : '<div class="cl-cover empty">No cover image set</div>'}
          <div class="cst-row">${K.btn('Replace', { variant: 'outline', act: 'cover' })}${ed.banner ? K.btn('Remove', { variant: 'outline', act: 'cover-remove' }) : ''}</div>
        </div>
      </div>`;
    }

    if (['requirement', 'description', 'goals'].includes(key)) {
      const field = { requirement: 'requirements', description: 'description', goals: 'goals' }[key];

      return `<div class="cl-form">
        <div><p class="cl-lab" style="margin-bottom:8px">${esc(LABELS[key])}</p>${K.richHtml({ id: field, value: land[field] ?? '', placeholder: '', minHeight: 160, maxHeight: 320 })}</div>
        ${showToggle(KEYS[key])}
      </div>`;
    }

    if (key === 'chips') {
      const block = (name, title, help, placeholder) => `<div>
        <p class="cl-lab" style="margin-bottom:8px">${esc(title)}</p>
        <p class="cst-desc" style="font-size:12px;margin-bottom:12px">${esc(help)}</p>
        <div class="cst-row"><input class="input" data-chip-in="${name}" placeholder="${esc(placeholder)}" aria-label="${esc(title)}" />
          <button type="button" class="ck-btn outline sm icon-sm" data-act="chip-add" data-name="${name}" aria-label="Add">${K.ic('plus', 14)}</button></div>
        ${land[name].length ? `<div class="cl-chips">${land[name].map((item, index) => `<span class="cl-chip">${esc(item)}<button type="button" data-act="chip-del" data-name="${name}" data-i="${index}" aria-label="Remove">${K.ic('x', 12)}</button></span>`).join('')}</div>` : ''}
      </div>`;

      return `<div class="cl-form" style="gap:24px">
        ${block('skills', "Skills you'll gain", 'Press Enter to add. These appear as chips below the curriculum.', 'e.g. Data Analysis')}
        ${block('tools', "Tools you'll learn", 'Press Enter to add. These appear as chips below the curriculum.', 'e.g. Figma')}
      </div>`;
    }

    if (key === 'certificate') {
      return `<div class="cl-form" style="align-items:center">
        <p class="cl-lab" style="text-align:center">Certificate template</p>
        <button type="button" class="cl-cert" data-act="cert" aria-label="Upload certificate template"><img src="${esc(land.certificate?.templateUrl || CERT_PLACEHOLDER)}" alt="" /><span class="cl-img-ov">${K.ic('upload', 16)}</span></button>
        <span class="cl-img-cap">Upload image</span>
        <div style="align-self:stretch">${showToggle(KEYS.certificate)}</div>
      </div>`;
    }

    if (key === 'instructor') {
      const ins = land.instructor;
      const siteName = window.siteModel.brandOf(ed.ctx.S);

      return `<div class="cl-form">
        <div style="display:grid;justify-items:center;gap:4px"><p class="cl-lab">Instructor Logo</p>${imageBox({ src: ins.imgUrl || ed.ctx.S.logoDataUrl, round: true, act: 'ins-img' })}</div>
        <div class="cst-field"><label class="cl-lab" for="cl-in-name">Instructor name</label><input class="input" id="cl-in-name" data-ins="name" placeholder="Your company name" value="${esc(ins.name ?? siteName)}" /></div>
        <div class="cst-field"><label class="cl-lab" for="cl-in-role">Instructor Role</label><input class="input" id="cl-in-role" data-ins="role" placeholder="e.g Software developer" value="${esc(ins.role ?? '')}" /></div>
        <div class="cst-field"><label class="cl-lab" for="cl-in-about">About Instructor</label><textarea class="textarea" id="cl-in-about" rows="6" data-ins="description" placeholder="A short background about the instructure">${esc(ins.description ?? '')}</textarea></div>
        <div class="cst-field"><label class="cl-lab" for="cl-in-no">Total number of courses</label><input class="input" id="cl-in-no" type="number" data-ins="coursesNo" value="${esc(ins.coursesNo ?? '')}" /></div>
      </div>`;
    }

    if (key === 'reviews') {
      return `<div class="cl-form">
        ${land.reviews
          .map((review) => {
            if (review.id !== ed.openReview) {
              return `<div class="cl-rev"><div class="cl-rev-h"><span class="cl-av">${review.avatar_url ? `<img src="${esc(review.avatar_url)}" alt="" />` : K.ic('user', 20)}</span><span>${esc(review.name)}</span>
                <button type="button" class="ck-btn secondary icon-sm" data-act="rev-open" data-id="${review.id}" aria-label="Expand">${K.ic('down')}</button></div></div>`;
            }

            const er = ed.reviewErrors;

            return `<div class="cl-rev" style="align-items:stretch">
              <div style="display:grid;justify-items:center;gap:4px">${imageBox({ src: review.avatar_url, round: true, act: 'rev-img' })}${er.avatar_url ? `<p class="cst-error">${esc(er.avatar_url)}</p>` : ''}</div>
              <div class="cst-field"><label class="cl-lab">Full Name</label><input class="input" data-rev="name" value="${esc(review.name)}" ${er.name ? 'aria-invalid="true"' : ''} />${er.name ? `<p class="cst-error">${esc(er.name)}</p>` : ''}</div>
              <div class="cst-field"><label class="cl-lab">Description</label><textarea class="textarea" rows="4" data-rev="description" ${er.description ? 'aria-invalid="true"' : ''}>${esc(review.description)}</textarea>${er.description ? `<p class="cst-error">${esc(er.description)}</p>` : ''}</div>
              <div class="cst-row" style="justify-content:space-between;align-items:flex-end">
                <div class="cst-field" style="width:80px"><label class="cl-lab">Rating</label><input class="input" type="number" min="1" max="5" data-rev="rating" value="${review.rating}" ${er.rating ? 'aria-invalid="true"' : ''} />${er.rating ? `<p class="cst-error">${esc(er.rating)}</p>` : ''}</div>
                <div style="display:grid;justify-items:center;gap:8px;width:96px">${K.sw('cl-rev-hide', Boolean(review.hide))}<span style="font-size:14px">${review.hide ? 'Show Section' : 'Hide Section'}</span></div>
              </div>
              <div class="cst-row" style="justify-content:space-between;margin-top:16px">
                <button type="button" class="ck-btn secondary icon-sm" data-act="rev-del" aria-label="Delete review">${K.ic('trash')}</button>
                <button type="button" class="ck-btn secondary icon-sm" data-act="rev-save" aria-label="Save review">${K.ic('save')}</button>
              </div></div>`;
          })
          .join('')}
        ${K.btn('Add Reviews', { act: 'rev-add', cls: 'fit' })}
      </div>`;
    }

    /* pricing */
    const paid = isPaid(viewOf(ed.ctx.course));
    const err = paymentError(false);
    const yes = (on) => (on ? 'Yes' : 'No');

    return `<div class="cl-form">
      <div><p class="cl-lab" style="margin-bottom:8px">Enable Paid</p><div class="cst-row">${K.sw('cl-paid', paid)}<span class="cl-gray">${yes(paid)}</span></div></div>
      ${
        paid
          ? `<div class="cst-field"><p class="cl-lab">Currency</p>${K.selectHtml({ id: 'currency', value: land.currency === 'NGN' ? 'NGN' : 'USD', options: [{ value: 'NGN', label: 'NGN' }, { value: 'USD', label: 'USD' }] })}</div>
          <div class="cst-field"><label class="cl-lab" for="cl-cost">Cost</label><input class="input" id="cl-cost" type="number" min="0" step="1" value="${Number(land.cost) || 0}" /></div>
          <div class="cst-field"><label class="cl-lab" for="cl-pay">Payment Link<span class="cl-req">*</span></label><input class="input" id="cl-pay" data-land="paymentLink" value="${esc(land.paymentLink ?? '')}" ${err ? 'aria-invalid="true"' : ''} />
            <p class="${err ? 'cst-error' : 'cst-desc'}" id="cl-pay-note">${esc(err || 'Stripe, Lemon Squeezy or any payment link')}</p></div>`
          : ''
      }
      <div><p class="cl-lab" style="margin-bottom:8px">Discount</p><div class="cst-row">${K.sw('cl-disc', Boolean(land.showDiscount))}<span class="cl-gray">${yes(land.showDiscount)}</span></div></div>
      ${land.showDiscount ? `<div class="cst-field"><label class="cl-lab" for="cl-disc-n">Discount Percent</label><input class="input" id="cl-disc-n" type="number" min="0" max="100" value="${Number(land.discount) || 0}" /><p class="cst-desc">In Percentage %</p></div>` : ''}
      <div><p class="cl-lab" style="margin-bottom:8px">Gift on Completion</p><div class="cst-row">${K.sw('cl-gift', Boolean(land.reward?.show))}<span class="cl-gray">${yes(land.reward?.show)}</span></div></div>
      ${land.reward?.show ? `<p style="margin:0;font-size:14px">About Gift</p>${K.richHtml({ id: 'reward', value: land.reward.description ?? '', minHeight: 120, maxHeight: 240 })}` : ''}
    </div>`;
  }

  function paintSide() {
    const side = document.getElementById('cl-side-body');

    if (!side) return;

    if (!ed.selected || !SECTIONS.some((item) => item[0] === ed.selected)) {
      side.innerHTML = `<p class="cl-group">Page Builder</p>
        ${SECTIONS.map(([key, title]) => `<button type="button" class="cl-item" data-act="open" data-key="${key}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">${SECTION_ICONS[key]}</svg><span>${esc(title)}</span>${K.ic('right')}</button>`).join('')}`;
    } else {
      side.innerHTML = `<div class="cl-pad">${formHtml(ed.selected)}</div>`;
      wireForm();
    }

    paintHead();
  }

  function selectSection(key, scroll = true) {
    ed.selected = key === 'hero' ? 'header' : key;
    ed.reviewErrors = {};
    ed.openReview = null;
    paintSide();

    const frame = document.getElementById('cl-frame');

    frame?.contentWindow?.postMessage({ type: 'cl-select', key: ed.selected === 'header' ? 'hero' : ed.selected }, '*');
    if (scroll && SECTIONS.some((item) => item[0] === ed.selected)) {
      frame?.contentWindow?.postMessage({ type: 'cl-scroll', key: ed.selected === 'header' ? 'hero' : ed.selected }, '*');
    }
  }

  function validateReview(review) {
    const errors = {};

    if (String(review.name ?? '').trim().length < 5) errors.name = 'Name is too short, min of 5 character';
    if (String(review.avatar_url ?? '').length < 6) errors.avatar_url = 'Upload an image';
    if (!(review.rating >= 1 && review.rating <= 5)) errors.rating = 'Rating must be from 1-5';
    if (String(review.description ?? '').trim().length < 10) errors.description = "'Description is too short, min of 5 characters";

    return errors;
  }

  function isEmptyReview(review) {
    return !String(review.name ?? '').trim() && !String(review.description ?? '').trim() && !String(review.avatar_url ?? '').trim();
  }

  function pickImage(options, onPick) {
    K.imageDialog({ host: document.getElementById('cl-overlay'), z: 400, say, onPick, ...options });
  }

  function wireForm() {
    const side = document.getElementById('cl-side-body');
    const land = ed.land;

    side.querySelectorAll('[data-bind]').forEach((input) =>
      input.addEventListener('input', () => {
        ed[input.dataset.bind] = input.value;
        touch();
      })
    );
    side.querySelectorAll('[data-land]').forEach((input) =>
      input.addEventListener('input', () => {
        setLand(input.dataset.land, input.value);

        if (input.dataset.land === 'paymentLink') {
          const error = paymentError(false);
          const note = document.getElementById('cl-pay-note');

          input.toggleAttribute('aria-invalid', Boolean(error));
          if (note) {
            note.textContent = error || 'Stripe, Lemon Squeezy or any payment link';
            note.className = error ? 'cst-error' : 'cst-desc';
          }
        }
      })
    );
    side.querySelectorAll('[data-ins]').forEach((input) =>
      input.addEventListener('input', () => setLand(`instructor.${input.dataset.ins}`, input.value))
    );
    side.querySelectorAll('[data-rev]').forEach((input) =>
      input.addEventListener('input', () => {
        const review = land.reviews.find((item) => item.id === ed.openReview);

        review[input.dataset.rev] = input.dataset.rev === 'rating' ? Number(input.value) : input.value;
        delete ed.reviewErrors[input.dataset.rev];
        touch();
      })
    );
    K.wireRich(side, (id, html) => {
      if (id === 'reward') setLand('reward.description', html);
      else setLand(id, html);
    }, document.getElementById('cl-overlay'));
    K.wireSelects(side, (id, value) => {
      if (id === 'currency') {
        setLand('currency', value);
        ed.ctx.course.currency = value;
        paintSide();
      }
    });

    const cost = document.getElementById('cl-cost');

    if (cost) K.wireNumber(cost, { min: 0, onValue: (value) => setLand('cost', value) });

    const disc = document.getElementById('cl-disc-n');

    if (disc) K.wireNumber(disc, { min: 0, max: 100, onValue: (value) => setLand('discount', value) });

    side.querySelectorAll('[data-show]').forEach((toggle) =>
      toggle.addEventListener('click', () => {
        const key = toggle.dataset.show;

        setLand(`sectionDisplay.${key}`, !(land.sectionDisplay[key] ?? true));
        paintSide();
      })
    );
    side.querySelectorAll('input[data-chip-in]').forEach((input) =>
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          addChip(input.dataset.chipIn, input);
        }
      })
    );

    const flip = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);

    flip('cl-paid', () => {
      const next = !isPaid(viewOf(ed.ctx.course));

      setLand('paymentEnabled', next);
      paintSide();
    });
    flip('cl-disc', () => {
      setLand('showDiscount', !land.showDiscount);
      paintSide();
    });
    flip('cl-gift', () => {
      setLand('reward.show', !land.reward?.show);
      paintSide();
    });
    flip('cl-rev-hide', () => {
      const review = land.reviews.find((item) => item.id === ed.openReview);

      review.hide = !review.hide;
      touch();
      paintSide();
    });
  }

  function addChip(name, input) {
    const value = input.value.trim();

    if (!value) return;

    if (!ed.land[name].includes(value)) ed.land[name] = [...ed.land[name], value];

    touch();
    paintSide();
    document.querySelector(`[data-chip-in="${name}"]`)?.focus();
  }

  function onSide(event) {
    const target = event.target.closest('[data-act]');

    if (!target) return;

    const act = target.dataset.act;
    const land = ed.land;

    if (act === 'open') selectSection(target.dataset.key);
    else if (act === 'back') {
      if (ed.selected === 'pricing') {
        const error = paymentError(true);

        if (error) {
          ed.paymentShown = true;
          say(error, true);
          paintSide();
          return;
        }
      }

      ed.selected = null;
      paintSide();
      document.getElementById('cl-frame')?.contentWindow?.postMessage({ type: 'cl-select', key: null }, '*');
    } else if (act === 'close') closeEditor();
    else if (act === 'save') save();
    else if (act === 'preview') {
      if (!ed.ctx.course.slug) {
        say('Generate and save a course slug before previewing.');
        window.location.href = M.R.course(ed.ctx.course.id, 'settings');
        return;
      }

      window.open(M.R.publicCourse(ed.ctx.course.id), '_blank', 'noopener');
    } else if (act === 'cover') pickImage({ aspect: 16 / 9, maxBytes: 500 * 1024 }, (url) => {
      ed.banner = url;
      touch();
      paintSide();
    });
    else if (act === 'cover-remove') {
      ed.banner = '';
      touch();
      paintSide();
    } else if (act === 'cert') pickImage({ maxWidth: 1400 }, (url) => {
      setLand('certificate.templateUrl', url);
      paintSide();
    });
    else if (act === 'ins-img') pickImage({ aspect: 1, maxWidth: 320 }, (url) => {
      setLand('instructor.imgUrl', url);
      paintSide();
    });
    else if (act === 'rev-img') pickImage({ aspect: 1, maxWidth: 240 }, (url) => {
      const review = land.reviews.find((item) => item.id === ed.openReview);

      review.avatar_url = url;
      delete ed.reviewErrors.avatar_url;
      touch();
      paintSide();
    });
    else if (act === 'chip-add') addChip(target.dataset.name, document.querySelector(`[data-chip-in="${target.dataset.name}"]`));
    else if (act === 'chip-del') {
      const name = target.dataset.name;

      land[name] = land[name].filter((_, index) => index !== Number(target.dataset.i));
      touch();
      paintSide();
    } else if (act === 'rev-add') {
      const id = Date.now();

      land.reviews.push({ id, hide: false, name: '', avatar_url: '', rating: 1, created_at: Date.now(), description: '' });
      ed.openReview = id;
      ed.reviewErrors = {};
      touch();
      paintSide();
    } else if (act === 'rev-open') {
      ed.openReview = Number(target.dataset.id);
      ed.reviewErrors = {};
      paintSide();
    } else if (act === 'rev-del') {
      land.reviews = land.reviews.filter((item) => item.id !== ed.openReview);
      ed.openReview = null;
      touch();
      paintSide();
    } else if (act === 'rev-save') {
      const review = land.reviews.find((item) => item.id === ed.openReview);

      if (isEmptyReview(review)) land.reviews = land.reviews.filter((item) => item.id !== review.id);
      else {
        const errors = validateReview(review);

        if (Object.keys(errors).length) {
          ed.reviewErrors = errors;
          paintSide();
          return;
        }
      }

      ed.openReview = null;
      touch();
      paintSide();
    }
  }

  function save() {
    const course = ed.ctx.course;
    const error = paymentError(true);

    if (error) {
      ed.paymentShown = true;
      say(error, true);
      selectSection('pricing');
      return;
    }

    const kept = [];

    for (const review of ed.land.reviews) {
      if (isEmptyReview(review)) continue;

      if (Object.keys(validateReview(review)).length) {
        say('One or more reviews are invalid. Open each review and fix its name, avatar, rating and description before saving.', true);
        ed.openReview = review.id;
        ed.reviewErrors = validateReview(review);
        selectSection('reviews');
        ed.openReview = review.id;
        ed.reviewErrors = validateReview(review);
        paintSide();
        return;
      }

      kept.push(review);
    }

    ed.land.reviews = kept;
    course.title = ed.title;
    course.desc = ed.desc;
    course.bannerImage = ed.banner;
    course.landing = clone(ed.land);
    course.cost = Number(ed.land.cost) || 0;
    if (ed.land.currency) course.currency = ed.land.currency;
    if (!course.slug) course.slug = `${P.slugify(course.title) || 'course'}-${Date.now().toString(36)}`;
    ed.ctx.commit();
    ed.base = JSON.stringify(snapshot());
    say('Update successful');
    paintHead();
  }

  function closeEditor() {
    if (ed.selected) {
      ed.selected = null;
      paintSide();
      return;
    }

    if (dirty() && !window.confirm(UNSAVED)) return;

    ed.leaving = true;
    window.location.href = M.R.course(ed.ctx.course.id, 'lessons');
  }

  function html(ctx) {
    const course = ctx.course;

    if (!ed || ed.ctx.course.id !== course.id) {
      ed = { ctx, title: course.title ?? '', desc: course.desc ?? '', banner: course.bannerImage || '', land: landingDraft(course), selected: null, reviewErrors: {}, openReview: null };
      ed.base = JSON.stringify(snapshot());
    }

    ed.ctx = ctx;

    return `<div class="cl-overlay" id="cl-overlay" data-page="course-landing-editor">
      <aside class="cl-side" id="cl-side" aria-label="Landing page editor">
        <div class="cl-side-h" id="cl-head"></div>
        <div class="cl-side-b" id="cl-side-body"></div>
      </aside>
      <main class="cl-main">
        <button type="button" class="ck-btn secondary icon-sm cl-toggle" id="cl-toggle" aria-label="Toggle sidebar">${K.ic('left')}</button>
        <iframe class="cl-frame" id="cl-frame" title="Course landing page preview" src="course-landing-frame.html?id=${encodeURIComponent(course.id)}"></iframe>
      </main>
    </div>`;
  }

  function wire(ctx) {
    const overlay = document.getElementById('cl-overlay');

    ed.ctx = ctx;
    paintSide();
    overlay.querySelector('#cl-side').addEventListener('click', onSide);
    document.getElementById('cl-toggle').addEventListener('click', () => overlay.classList.toggle('collapsed'));

    const frame = document.getElementById('cl-frame');

    frame.addEventListener('load', () => {
      pushPreview();
      if (ed.selected) frame.contentWindow.postMessage({ type: 'cl-select', key: ed.selected === 'header' ? 'hero' : ed.selected }, '*');
    });
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'cl-picked') selectSection(event.data.key);
    });
    window.addEventListener('beforeunload', (event) => {
      if (ed.leaving || !dirty()) return;

      event.preventDefault();
      event.returnValue = '';
    });
    document.addEventListener('click', (event) => {
      if (ed.leaving || !dirty()) return;

      const link = event.target.closest?.('a[href]');

      if (!link || link.target === '_blank' || link.getAttribute('href').startsWith('#')) return;

      if (!window.confirm(UNSAVED)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      ed.leaving = true;
    }, true);
  }

  COURSE_TABS.landingpage = { nav: 'landingpage', title: 'Landing Page', html, wire };
})();
