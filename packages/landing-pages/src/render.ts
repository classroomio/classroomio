import { FONT_STACK_MAP, getFontGoogleUrl } from './defaults';
import type {
  LandingPageCourse,
  LandingPageDocumentV1,
  LandingPageRenderData,
  LandingPageRenderResult,
  LandingPageSectionV1
} from './types';

export function escapeHtml(unsafe: unknown): string {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderStars(rating = 5): string {
  const safeRating = Math.min(Math.max(rating, 1), 5);
  let stars = '';
  for (let i = 0; i < 5; i++) {
    const filled = i < safeRating;
    stars += `<svg class="cio-lp-star ${filled ? 'filled' : 'empty'}" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
    </svg>`;
  }
  return `<div class="cio-lp-stars" aria-label="${safeRating} out of 5 stars">${stars}</div>`;
}

function renderNavigation(doc: LandingPageDocumentV1, data: LandingPageRenderData): string {
  const nav = doc.navigation;
  const org = data.organization;
  const auth = data.auth;

  const brandHtml =
    nav.showLogo && org.logoUrl
      ? `<a href="/" class="cio-lp-brand"><img src="${escapeHtml(org.logoUrl)}" alt="${escapeHtml(org.name)}" class="cio-lp-logo" /><span class="cio-lp-org-name">${escapeHtml(org.name)}</span></a>`
      : `<a href="/" class="cio-lp-brand"><span class="cio-lp-org-name font-bold">${escapeHtml(org.name)}</span></a>`;

  const linksHtml =
    nav.customLinks.length > 0
      ? `<div class="cio-lp-nav-links">
        ${nav.customLinks.map((link) => `<a href="${escapeHtml(link.href)}" class="cio-lp-nav-link">${escapeHtml(link.label)}</a>`).join('')}
      </div>`
      : '';

  let authHtml = '';
  if (nav.showAuthAction) {
    if (auth.isAuthenticated) {
      authHtml = `<div class="cio-lp-nav-auth">
        <a href="${escapeHtml(auth.dashboardUrl)}" class="cio-lp-btn-primary">Dashboard</a>
      </div>`;
    } else {
      authHtml = `<div class="cio-lp-nav-auth">
        <a href="${escapeHtml(auth.loginUrl)}" class="cio-lp-nav-link">Sign In</a>
        <a href="${escapeHtml(auth.signupUrl)}" class="cio-lp-btn-primary">Get Started</a>
      </div>`;
    }
  }

  return `
    <header class="cio-lp-header">
      <div class="cio-lp-container cio-lp-header-inner">
        ${brandHtml}
        ${linksHtml}
        ${authHtml}
      </div>
    </header>
  `;
}

function renderHero(doc: LandingPageDocumentV1): string {
  const hero = doc.hero;
  const badgeHtml = hero.badge
    ? `<div class="cio-lp-hero-badge"><span class="cio-lp-badge-text">${escapeHtml(hero.badge)}</span></div>`
    : '';

  const secondaryActionHtml = hero.secondaryAction
    ? `<a href="${escapeHtml(hero.secondaryAction.href)}" class="cio-lp-btn-secondary">${escapeHtml(hero.secondaryAction.label)}</a>`
    : '';

  const mediaHtml =
    hero.mediaType === 'image' && hero.mediaUrl
      ? `<div class="cio-lp-hero-media">
        <img src="${escapeHtml(hero.mediaUrl)}" alt="${escapeHtml(hero.headline)}" class="cio-lp-hero-img" loading="eager" />
      </div>`
      : '';

  return `
    <section class="cio-lp-hero">
      <div class="cio-lp-container cio-lp-hero-grid ${hero.mediaType === 'none' || !hero.mediaUrl ? 'no-media' : ''}">
        <div class="cio-lp-hero-content">
          ${badgeHtml}
          <h1 class="cio-lp-hero-title">${escapeHtml(hero.headline)}</h1>
          ${hero.subheadline ? `<p class="cio-lp-hero-sub">${escapeHtml(hero.subheadline)}</p>` : ''}
          <div class="cio-lp-hero-actions">
            <a href="${escapeHtml(hero.primaryAction.href)}" class="cio-lp-btn-primary cio-lp-btn-lg">${escapeHtml(hero.primaryAction.label)}</a>
            ${secondaryActionHtml}
          </div>
        </div>
        ${mediaHtml}
      </div>
    </section>
  `;
}

function renderFeaturesSection(sec: Extract<LandingPageSectionV1, { type: 'features' }>): string {
  const itemsHtml = sec.items
    .map(
      (item) => `
    <div class="cio-lp-card cio-lp-feature-card">
      <h3 class="cio-lp-card-title">${escapeHtml(item.title)}</h3>
      <p class="cio-lp-card-desc">${escapeHtml(item.description)}</p>
    </div>
  `
    )
    .join('');

  return `
    <section id="${escapeHtml(sec.id)}" class="cio-lp-section cio-lp-features-section">
      <div class="cio-lp-container">
        <div class="cio-lp-section-header">
          <h2 class="cio-lp-section-title">${escapeHtml(sec.title)}</h2>
          ${sec.subtitle ? `<p class="cio-lp-section-sub">${escapeHtml(sec.subtitle)}</p>` : ''}
        </div>
        <div class="cio-lp-grid cio-lp-features-grid">
          ${itemsHtml}
        </div>
      </div>
    </section>
  `;
}

function renderCourseCard(course: LandingPageCourse): string {
  const imageHtml = course.image
    ? `<div class="cio-lp-course-media">
        <img src="${escapeHtml(course.image)}" alt="${escapeHtml(course.title)}" class="cio-lp-course-img" loading="lazy" />
      </div>`
    : `<div class="cio-lp-course-media cio-lp-course-placeholder">
        <span class="cio-lp-course-placeholder-icon">📚</span>
      </div>`;

  let priceHtml = '';
  if (course.isPricing && course.cost != null) {
    const currency = course.currency ?? '$';
    priceHtml = `<span class="cio-lp-course-price">${escapeHtml(currency)}${Number(course.cost).toFixed(2)}</span>`;
  } else {
    priceHtml = `<span class="cio-lp-course-badge">Free</span>`;
  }

  const lessonsHtml =
    course.totalLessons != null && course.totalLessons > 0
      ? `<span class="cio-lp-course-meta">${course.totalLessons} lessons</span>`
      : '';

  return `
    <div class="cio-lp-card cio-lp-course-card">
      ${imageHtml}
      <div class="cio-lp-course-body">
        <div class="cio-lp-course-header-meta">
          ${priceHtml}
          ${lessonsHtml}
        </div>
        <h3 class="cio-lp-course-title">
          <a href="/courses/${escapeHtml(course.slug)}">${escapeHtml(course.title)}</a>
        </h3>
        ${course.description ? `<p class="cio-lp-course-desc">${escapeHtml(course.description)}</p>` : ''}
        <div class="cio-lp-course-footer">
          <a href="/courses/${escapeHtml(course.slug)}" class="cio-lp-btn-secondary cio-lp-btn-sm">View Course</a>
        </div>
      </div>
    </div>
  `;
}

function renderCoursesSection(
  sec: Extract<LandingPageSectionV1, { type: 'courses' }>,
  courses: LandingPageCourse[]
): string {
  const maxItems = sec.maxItems ?? 6;
  const visibleCourses = courses.slice(0, maxItems);

  const coursesHtml =
    visibleCourses.length > 0
      ? visibleCourses.map(renderCourseCard).join('')
      : `<div class="cio-lp-empty-state"><p>No courses published yet. Check back soon!</p></div>`;

  const viewAllHtml =
    sec.viewAllHref && sec.viewAllLabel
      ? `<div class="cio-lp-section-cta">
        <a href="${escapeHtml(sec.viewAllHref)}" class="cio-lp-btn-outline">${escapeHtml(sec.viewAllLabel)} &rarr;</a>
      </div>`
      : '';

  return `
    <section id="${escapeHtml(sec.id)}" class="cio-lp-section cio-lp-courses-section">
      <div class="cio-lp-container">
        <div class="cio-lp-section-header">
          <h2 class="cio-lp-section-title">${escapeHtml(sec.title)}</h2>
          ${sec.subtitle ? `<p class="cio-lp-section-sub">${escapeHtml(sec.subtitle)}</p>` : ''}
        </div>
        <div class="cio-lp-grid cio-lp-courses-grid">
          ${coursesHtml}
        </div>
        ${viewAllHtml}
      </div>
    </section>
  `;
}

function renderTestimonialsSection(sec: Extract<LandingPageSectionV1, { type: 'testimonials' }>): string {
  const itemsHtml = sec.items
    .map((item) => {
      const avatarHtml = item.avatarUrl
        ? `<img src="${escapeHtml(item.avatarUrl)}" alt="${escapeHtml(item.name)}" class="cio-lp-avatar" loading="lazy" />`
        : `<div class="cio-lp-avatar cio-lp-avatar-fallback">${escapeHtml(item.name.charAt(0))}</div>`;

      return `
      <div class="cio-lp-card cio-lp-testimonial-card">
        ${renderStars(item.rating ?? 5)}
        <blockquote class="cio-lp-testimonial-quote">"${escapeHtml(item.quote)}"</blockquote>
        <div class="cio-lp-testimonial-author">
          ${avatarHtml}
          <div class="cio-lp-author-info">
            <span class="cio-lp-author-name">${escapeHtml(item.name)}</span>
            ${item.role ? `<span class="cio-lp-author-role">${escapeHtml(item.role)}</span>` : ''}
          </div>
        </div>
      </div>
    `;
    })
    .join('');

  return `
    <section id="${escapeHtml(sec.id)}" class="cio-lp-section cio-lp-testimonials-section">
      <div class="cio-lp-container">
        <div class="cio-lp-section-header">
          <h2 class="cio-lp-section-title">${escapeHtml(sec.title)}</h2>
          ${sec.subtitle ? `<p class="cio-lp-section-sub">${escapeHtml(sec.subtitle)}</p>` : ''}
        </div>
        <div class="cio-lp-grid cio-lp-testimonials-grid">
          ${itemsHtml}
        </div>
      </div>
    </section>
  `;
}

function renderFaqSection(sec: Extract<LandingPageSectionV1, { type: 'faq' }>): string {
  const itemsHtml = sec.items
    .map(
      (item) => `
    <details class="cio-lp-faq-item">
      <summary class="cio-lp-faq-question">${escapeHtml(item.question)}</summary>
      <div class="cio-lp-faq-answer"><p>${escapeHtml(item.answer)}</p></div>
    </details>
  `
    )
    .join('');

  return `
    <section id="${escapeHtml(sec.id)}" class="cio-lp-section cio-lp-faq-section">
      <div class="cio-lp-container cio-lp-faq-container">
        <div class="cio-lp-section-header">
          <h2 class="cio-lp-section-title">${escapeHtml(sec.title)}</h2>
          ${sec.subtitle ? `<p class="cio-lp-section-sub">${escapeHtml(sec.subtitle)}</p>` : ''}
        </div>
        <div class="cio-lp-faq-list">
          ${itemsHtml}
        </div>
      </div>
    </section>
  `;
}

function renderCtaSection(sec: Extract<LandingPageSectionV1, { type: 'cta' }>): string {
  return `
    <section id="${escapeHtml(sec.id)}" class="cio-lp-section cio-lp-cta-section">
      <div class="cio-lp-container">
        <div class="cio-lp-cta-box">
          <h2 class="cio-lp-cta-title">${escapeHtml(sec.title)}</h2>
          ${sec.description ? `<p class="cio-lp-cta-desc">${escapeHtml(sec.description)}</p>` : ''}
          <div class="cio-lp-cta-action">
            <a href="${escapeHtml(sec.action.href)}" class="cio-lp-btn-primary cio-lp-btn-lg">${escapeHtml(sec.action.label)}</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderStatsSection(sec: Extract<LandingPageSectionV1, { type: 'stats' }>): string {
  const itemsHtml = sec.items
    .map(
      (item) => `
    <div class="cio-lp-stat-item">
      <div class="cio-lp-stat-val">${escapeHtml(item.value)}</div>
      <div class="cio-lp-stat-lbl">${escapeHtml(item.label)}</div>
    </div>
  `
    )
    .join('');

  return `
    <section id="${escapeHtml(sec.id)}" class="cio-lp-section cio-lp-stats-section">
      <div class="cio-lp-container">
        ${sec.title ? `<div class="cio-lp-section-header"><h2 class="cio-lp-section-title">${escapeHtml(sec.title)}</h2></div>` : ''}
        <div class="cio-lp-stats-grid">
          ${itemsHtml}
        </div>
      </div>
    </section>
  `;
}

function renderSections(sections: LandingPageSectionV1[], data: LandingPageRenderData): string {
  return sections
    .filter((sec) => sec.enabled)
    .map((sec) => {
      switch (sec.type) {
        case 'features':
          return renderFeaturesSection(sec);
        case 'courses':
          return renderCoursesSection(sec, data.courses);
        case 'testimonials':
          return renderTestimonialsSection(sec);
        case 'faq':
          return renderFaqSection(sec);
        case 'cta':
          return renderCtaSection(sec);
        case 'stats':
          return renderStatsSection(sec);
        default:
          return '';
      }
    })
    .join('');
}

function renderFooter(doc: LandingPageDocumentV1): string {
  const footer = doc.footer;
  const linksHtml =
    footer.links.length > 0
      ? `<div class="cio-lp-footer-links">
        ${footer.links.map((link) => `<a href="${escapeHtml(link.href)}" class="cio-lp-footer-link">${escapeHtml(link.label)}</a>`).join('')}
      </div>`
      : '';

  return `
    <footer class="cio-lp-footer">
      <div class="cio-lp-container cio-lp-footer-inner">
        ${footer.copyrightText ? `<p class="cio-lp-copyright">${escapeHtml(footer.copyrightText)}</p>` : ''}
        ${linksHtml}
      </div>
    </footer>
  `;
}

export function generateLandingPageCss(doc: LandingPageDocumentV1): string {
  const theme = doc.theme;
  const fontStack = FONT_STACK_MAP[theme.fontFamily] ?? FONT_STACK_MAP.inter;

  // Determine light or dark text based on background color luminance
  const isDarkBg = isColorDark(theme.backgroundColor);
  const textPrimary = isDarkBg ? '#f8fafc' : '#0f172a';
  const textMuted = isDarkBg ? '#94a3b8' : '#64748b';
  const cardBg = isDarkBg ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
  const cardBorder = isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

  return `
    :root {
      --cio-lp-primary: ${theme.primaryColor};
      --cio-lp-secondary: ${theme.secondaryColor};
      --cio-lp-bg: ${theme.backgroundColor};
      --cio-lp-font: ${fontStack};
      --cio-lp-text: ${textPrimary};
      --cio-lp-text-muted: ${textMuted};
      --cio-lp-card-bg: ${cardBg};
      --cio-lp-card-border: ${cardBorder};
    }

    .cio-landing-page {
      background-color: var(--cio-lp-bg);
      color: var(--cio-lp-text);
      font-family: var(--cio-lp-font);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      box-sizing: border-box;
    }

    .cio-landing-page *, .cio-landing-page *::before, .cio-landing-page *::after {
      box-sizing: inherit;
    }

    .cio-lp-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      width: 100%;
    }

    /* Header */
    .cio-lp-header {
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      background-color: color-mix(in srgb, var(--cio-lp-bg) 85%, transparent);
      border-bottom: 1px solid var(--cio-lp-card-border);
      padding: 1rem 0;
    }

    .cio-lp-header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .cio-lp-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: inherit;
    }

    .cio-lp-logo {
      height: 2.25rem;
      width: auto;
      border-radius: 0.375rem;
      object-fit: contain;
    }

    .cio-lp-org-name {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .cio-lp-nav-links {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .cio-lp-nav-link {
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--cio-lp-text-muted);
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .cio-lp-nav-link:hover {
      color: var(--cio-lp-text);
    }

    .cio-lp-nav-auth {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    /* Buttons */
    .cio-lp-btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: var(--cio-lp-primary);
      color: #ffffff;
      padding: 0.625rem 1.25rem;
      font-size: 0.9375rem;
      font-weight: 600;
      border-radius: 0.5rem;
      text-decoration: none;
      transition: opacity 0.15s ease, transform 0.15s ease;
      border: none;
      cursor: pointer;
    }

    .cio-lp-btn-primary:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .cio-lp-btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: var(--cio-lp-card-bg);
      color: var(--cio-lp-text);
      border: 1px solid var(--cio-lp-card-border);
      padding: 0.625rem 1.25rem;
      font-size: 0.9375rem;
      font-weight: 600;
      border-radius: 0.5rem;
      text-decoration: none;
      transition: background-color 0.15s ease, transform 0.15s ease;
      cursor: pointer;
    }

    .cio-lp-btn-secondary:hover {
      background-color: var(--cio-lp-card-border);
      transform: translateY(-1px);
    }

    .cio-lp-btn-outline {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: transparent;
      color: var(--cio-lp-primary);
      border: 1px solid var(--cio-lp-primary);
      padding: 0.625rem 1.25rem;
      font-size: 0.9375rem;
      font-weight: 600;
      border-radius: 0.5rem;
      text-decoration: none;
      transition: background-color 0.15s ease;
    }

    .cio-lp-btn-outline:hover {
      background-color: color-mix(in srgb, var(--cio-lp-primary) 10%, transparent);
    }

    .cio-lp-btn-lg {
      padding: 0.875rem 1.75rem;
      font-size: 1.0625rem;
      border-radius: 0.625rem;
    }

    .cio-lp-btn-sm {
      padding: 0.4375rem 0.875rem;
      font-size: 0.875rem;
    }

    /* Hero */
    .cio-lp-hero {
      padding: 5rem 0 4rem;
    }

    .cio-lp-hero-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3.5rem;
      align-items: center;
    }

    .cio-lp-hero-grid.no-media {
      grid-template-columns: 1fr;
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
    }

    .cio-lp-hero-badge {
      display: inline-block;
      background-color: color-mix(in srgb, var(--cio-lp-primary) 15%, transparent);
      color: var(--cio-lp-primary);
      padding: 0.375rem 0.875rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
    }

    .cio-lp-hero-title {
      font-size: clamp(2.25rem, 5vw, 3.5rem);
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.03em;
      margin-bottom: 1.25rem;
    }

    .cio-lp-hero-sub {
      font-size: clamp(1.0625rem, 2vw, 1.25rem);
      color: var(--cio-lp-text-muted);
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .cio-lp-hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }

    .cio-lp-hero-grid.no-media .cio-lp-hero-actions {
      justify-content: center;
    }

    .cio-lp-hero-media {
      display: flex;
      justify-content: center;
    }

    .cio-lp-hero-img {
      width: 100%;
      height: auto;
      max-height: 480px;
      object-fit: cover;
      border-radius: 1rem;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.2);
    }

    /* Sections */
    .cio-lp-section {
      padding: 5rem 0;
    }

    .cio-lp-section-header {
      text-align: center;
      max-width: 720px;
      margin: 0 auto 3.5rem;
    }

    .cio-lp-section-title {
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-bottom: 0.875rem;
    }

    .cio-lp-section-sub {
      font-size: 1.125rem;
      color: var(--cio-lp-text-muted);
    }

    .cio-lp-grid {
      display: grid;
      gap: 1.75rem;
    }

    .cio-lp-card {
      background-color: var(--cio-lp-card-bg);
      border: 1px solid var(--cio-lp-card-border);
      border-radius: 0.875rem;
      padding: 1.75rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .cio-lp-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.1);
    }

    .cio-lp-card-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.625rem;
    }

    .cio-lp-card-desc {
      color: var(--cio-lp-text-muted);
      font-size: 0.9375rem;
      line-height: 1.6;
    }

    /* Features */
    .cio-lp-features-grid {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }

    /* Courses */
    .cio-lp-courses-grid {
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }

    .cio-lp-course-card {
      padding: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .cio-lp-course-media {
      height: 180px;
      width: 100%;
      background-color: var(--cio-lp-card-border);
      overflow: hidden;
    }

    .cio-lp-course-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cio-lp-course-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
    }

    .cio-lp-course-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    .cio-lp-course-header-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .cio-lp-course-price, .cio-lp-course-badge {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--cio-lp-primary);
    }

    .cio-lp-course-meta {
      font-size: 0.8125rem;
      color: var(--cio-lp-text-muted);
    }

    .cio-lp-course-title {
      font-size: 1.1875rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .cio-lp-course-title a {
      color: inherit;
      text-decoration: none;
    }

    .cio-lp-course-title a:hover {
      color: var(--cio-lp-primary);
    }

    .cio-lp-course-desc {
      color: var(--cio-lp-text-muted);
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 1.25rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex-grow: 1;
    }

    .cio-lp-course-footer {
      padding-top: 1rem;
      border-top: 1px solid var(--cio-lp-card-border);
    }

    .cio-lp-section-cta {
      margin-top: 2.5rem;
      text-align: center;
    }

    /* Testimonials */
    .cio-lp-testimonials-grid {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    .cio-lp-stars {
      display: flex;
      gap: 0.25rem;
      color: #f59e0b;
      margin-bottom: 1rem;
    }

    .cio-lp-star {
      width: 1.125rem;
      height: 1.125rem;
    }

    .cio-lp-star.empty {
      color: var(--cio-lp-card-border);
    }

    .cio-lp-testimonial-quote {
      font-size: 1rem;
      font-style: italic;
      color: var(--cio-lp-text);
      margin-bottom: 1.25rem;
      line-height: 1.6;
    }

    .cio-lp-testimonial-author {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .cio-lp-avatar {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 9999px;
      object-fit: cover;
    }

    .cio-lp-avatar-fallback {
      background-color: var(--cio-lp-primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.125rem;
    }

    .cio-lp-author-name {
      display: block;
      font-weight: 700;
      font-size: 0.9375rem;
    }

    .cio-lp-author-role {
      display: block;
      font-size: 0.8125rem;
      color: var(--cio-lp-text-muted);
    }

    /* FAQ */
    .cio-lp-faq-container {
      max-width: 800px;
    }

    .cio-lp-faq-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .cio-lp-faq-item {
      background-color: var(--cio-lp-card-bg);
      border: 1px solid var(--cio-lp-card-border);
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .cio-lp-faq-question {
      padding: 1.25rem 1.5rem;
      font-weight: 700;
      font-size: 1.0625rem;
      cursor: pointer;
      user-select: none;
      list-style: none;
      position: relative;
    }

    .cio-lp-faq-question::-webkit-details-marker {
      display: none;
    }

    .cio-lp-faq-question::after {
      content: '+';
      position: absolute;
      right: 1.5rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.25rem;
      color: var(--cio-lp-text-muted);
      transition: transform 0.2s ease;
    }

    .cio-lp-faq-item[open] .cio-lp-faq-question::after {
      content: '−';
    }

    .cio-lp-faq-answer {
      padding: 0 1.5rem 1.25rem;
      color: var(--cio-lp-text-muted);
      font-size: 0.9375rem;
      line-height: 1.6;
    }

    /* CTA Section */
    .cio-lp-cta-box {
      background: linear-gradient(135deg, var(--cio-lp-primary), var(--cio-lp-secondary));
      color: #ffffff;
      padding: 4rem 2rem;
      border-radius: 1.25rem;
      text-align: center;
      max-width: 900px;
      margin: 0 auto;
      box-shadow: 0 20px 40px -10px color-mix(in srgb, var(--cio-lp-primary) 30%, transparent);
    }

    .cio-lp-cta-title {
      font-size: clamp(2rem, 4vw, 2.75rem);
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-bottom: 1rem;
    }

    .cio-lp-cta-desc {
      font-size: 1.1875rem;
      opacity: 0.92;
      max-width: 600px;
      margin: 0 auto 2rem;
    }

    .cio-lp-cta-action .cio-lp-btn-primary {
      background-color: #ffffff;
      color: var(--cio-lp-primary);
    }

    .cio-lp-cta-action .cio-lp-btn-primary:hover {
      background-color: #f1f5f9;
    }

    /* Stats */
    .cio-lp-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 2rem;
      text-align: center;
      padding: 2rem 0;
    }

    .cio-lp-stat-val {
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 800;
      color: var(--cio-lp-primary);
      line-height: 1.1;
      margin-bottom: 0.375rem;
    }

    .cio-lp-stat-lbl {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--cio-lp-text-muted);
    }

    /* Footer */
    .cio-lp-footer {
      margin-top: auto;
      border-top: 1px solid var(--cio-lp-card-border);
      padding: 2.5rem 0;
      font-size: 0.875rem;
      color: var(--cio-lp-text-muted);
    }

    .cio-lp-footer-inner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .cio-lp-footer-links {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .cio-lp-footer-link {
      color: inherit;
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .cio-lp-footer-link:hover {
      color: var(--cio-lp-text);
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .cio-lp-hero-grid {
        grid-template-columns: 1fr;
        gap: 2.5rem;
      }
      .cio-lp-header-inner {
        flex-wrap: wrap;
      }
      .cio-lp-nav-links {
        display: none;
      }
      .cio-lp-hero {
        padding: 3rem 0;
      }
      .cio-lp-section {
        padding: 3.5rem 0;
      }
      .cio-lp-footer-inner {
        flex-direction: column;
        text-align: center;
      }
    }
  `;
}

function isColorDark(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

export function renderLandingPage(doc: LandingPageDocumentV1, data: LandingPageRenderData): LandingPageRenderResult {
  const css = generateLandingPageCss(doc);
  const fontsHref = getFontGoogleUrl(doc.theme.fontFamily);

  const html = `
    <div class="cio-landing-page" data-template="${escapeHtml(doc.templateId)}">
      ${renderNavigation(doc, data)}
      <main>
        ${renderHero(doc)}
        ${renderSections(doc.sections, data)}
      </main>
      ${renderFooter(doc)}
    </div>
  `;

  return {
    html,
    css,
    fontsHref,
    meta: {
      title: doc.seo.title || `${data.organization.name} - Academy`,
      description: doc.seo.description || doc.hero.subheadline || '',
      socialImageUrl: doc.seo.socialImageUrl || doc.hero.mediaUrl
    }
  };
}
