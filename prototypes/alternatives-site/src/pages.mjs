import { esc, ic } from './ui.mjs';
import { viz } from './mockups.mjs';
import { heroStage } from './hero-stage.mjs';
import { PLANS, BLOG, COMPETITORS, CHECKED } from './site.mjs';
import { button, ctaBand, alternativesGrid, CAPTION } from './sections.mjs';

const banner = (text) => `<p class="proto-banner">${ic('info')}<span>${text}</span></p>`;

function pageHero({ eyebrow, title, lead, note }) {
  return `<section class="page-hero"><div class="wrap"><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(title)}</h1><p class="lead">${esc(lead)}</p>${note ? banner(note) : ''}</div></section>`;
}

function hub() {
  const root = '../';
  const body = `<section class="section" id="platforms" aria-label="Platform comparisons"><div class="wrap">
    <div class="hub-grid">${alternativesGrid(root)}</div>
  </div></section>`;
  return {
    file: 'alternatives/index.html',
    root,
    current: 'Solutions',
    title: 'Customer Education Platform Alternatives and Comparisons | ClassroomIO',
    description:
      'Compare nine customer education and course platforms with ClassroomIO. See who each one suits, what to check before switching and where ClassroomIO is not the better fit.',
    body
  };
}

function home() {
  const root = '';
  const body = `<div class="hero-wrap"><section class="hero" aria-labelledby="home-title"><div class="hero-grid">
    <div class="hero-copy"><span class="eyebrow">Customer education software</span>
      <h1 id="home-title">Teach customers your product, on your own domain</h1>
      <p class="lead">Build courses with AI help, publish a branded academy, issue certificates and see how learners are doing.</p>
      <div class="hero-cta">${button('Get started', 'get-started.html')}${button('Compare platforms', 'alternatives/index.html', 'secondary')}</div>
      <ul class="chips"><li>${ic('check')}Free plan for up to 20 students</li><li>${ic('check')}Published prices</li></ul>
      ${banner('Prototype home page. The pages to review are the alternatives hub and the nine competitor pages.')}
    </div>
    <div class="hero-viz">${heroStage({ frame: 'photo', people: ['amara', 'ada'], tone: 'sky', course: 'Admin certification', lessons: 9, lesson: 'Lesson 2 · Roles' }, root)}<p class="cap">${CAPTION}</p></div>
  </div></section></div>
  <section class="section" aria-labelledby="home-alt"><div class="wrap">
    <div class="sec-head"><span class="eyebrow">Alternatives</span><h2 class="h2" id="home-alt">Comparing platforms?</h2><p class="lead">Start with the page for the platform you are looking at.</p></div>
    <div class="hub-grid">${alternativesGrid(root)}</div>
  </div></section>`;
  return {
    file: 'index.html',
    root,
    current: '',
    title: 'ClassroomIO Prototype Home | Customer Education Software',
    description: 'Prototype home page for the ClassroomIO competitor alternatives website.',
    body
  };
}

function pricing() {
  const root = '';
  const body = `${pageHero({
    eyebrow: 'Pricing',
    title: 'Three plans, published on one page',
    lead: 'Plans are sized by student capacity. There is no per-learner fee and no add-on to assemble for branding, domain or certificates.',
    note: `Plans below follow the ClassroomIO help center plan comparison, checked ${CHECKED}. Confirm current figures before publishing.`
  })}
  <section class="section" style="padding-top:0"><div class="wrap"><div class="plan-grid">${PLANS.map(
    (plan) =>
      `<article class="notch plan ${plan.hot ? 'hot' : ''}"><h3>${esc(plan.name)}</h3><div class="price">${esc(plan.price)} <small>${esc(plan.unit)}</small></div><p>${esc(plan.line)}</p><ul>${plan.items.map((item) => `<li>${ic('check')}<span>${esc(item)}</span></li>`).join('')}</ul>${button(plan.name === 'Enterprise' ? 'Talk to us' : 'Get started', plan.name === 'Enterprise' ? 'demo.html' : 'get-started.html', plan.hot ? 'primary' : 'secondary', false)}</article>`
  ).join('')}</div></div></section>
  ${ctaBand({
    title: 'Start free and decide later',
    text: 'Build a course on the free plan. Move to Early Adopter when you want your own domain, branding and certificates.',
    primary: ['Get started', 'get-started.html'],
    secondary: ['Compare platforms', 'alternatives/index.html']
  })}`;
  return {
    file: 'pricing.html',
    root,
    current: 'Pricing',
    title: 'Pricing | ClassroomIO',
    description: 'ClassroomIO plans: Free, Early Adopter at $35 a month and Enterprise by quote.',
    body
  };
}

function product() {
  const root = '';
  const block = (
    id,
    eyebrow,
    title,
    text,
    name,
    flip
  ) => `<section class="section ${flip ? 'sand' : ''}" id="${id}"><div class="wrap intro-grid">
    <div class="intro-copy" style="${flip ? 'order:2' : ''}"><span class="eyebrow">${eyebrow}</span><h2 class="h2">${title}</h2><p class="lead">${text}</p></div>
    <div>${viz(name)}<p class="cap">${CAPTION}</p></div></div></section>`;
  const body = `${pageHero({
    eyebrow: 'Product',
    title: 'Create, publish and measure customer courses',
    lead: 'One product for building courses, running a branded academy and seeing how learners are doing.',
    note: 'Product overview placeholder. In the live site this page would carry full product detail. Visuals are illustrative mockups.'
  })}
  ${block('create', 'Course builder', 'Draft with AI, then edit', 'Describe a lesson and review an AI draft, or start from a template. Add exercises with auto-grading and publish when you are happy.', 'editor', false)}
  ${block('academy', 'Branded academy', 'Your domain, your colors', 'Publish on your own domain with your branding, invite students and let them follow their progress. Custom domain and branding are included from the $35 plan.', 'academy', true)}
  ${block('analytics', 'Analytics', 'See who is learning', 'Organization, course, learner and compliance analytics show completion and where learners stop.', 'analytics', false)}
  ${ctaBand({ title: 'Try it with a real course', text: 'The free plan covers up to 20 students.', primary: ['Get started', 'get-started.html'], secondary: ['See pricing', 'pricing.html'] })}`;
  return {
    file: 'product.html',
    root,
    current: 'Product',
    title: 'Product | ClassroomIO',
    description: 'Course builder, branded academy and analytics for SaaS customer education.',
    body
  };
}

function solutions() {
  const root = '';
  const items = [
    ['Onboarding', 'Walk new customers through setup so your team answers fewer repeat questions.', 'b11'],
    ['Adoption', 'Teach features after launch and keep courses current as the product changes.', 'b06'],
    ['Certification', 'Issue certificates to admins and partners who complete a course.', 'b08']
  ];
  const body = `${pageHero({
    eyebrow: 'Solutions',
    title: 'Customer education for SaaS teams',
    lead: 'Teach customers how to get value from your product, and show which courses are working.',
    note: 'Solutions placeholder. The live page would expand each use case.'
  })}
  <section class="section" style="padding-top:0"><div class="wrap three">${items
    .map(
      ([title, text, id]) =>
        `<article class="notch feat"><h3>${title}</h3><p>${text}</p><a class="link-arrow" href="resources.html#${id}">Related guide${ic('arrow')}</a></article>`
    )
    .join('')}</div></section>
  <section class="section sand"><div class="wrap sec-head" style="margin-bottom:0"><span class="eyebrow">Compare platforms</span><h2 class="h2">Looking at other platforms first?</h2><p class="lead">Read the comparison for the platform you are evaluating.</p><div>${button('See all alternatives', 'alternatives/index.html')}</div></div></section>
  ${ctaBand({ title: 'Teach your first customer cohort', text: 'Start on the free plan and publish a first course.', primary: ['Get started', 'get-started.html'], secondary: ['Book a demo', 'demo.html'] })}`;
  return {
    file: 'solutions.html',
    root,
    current: 'Solutions',
    title: 'Customer Education Solutions | ClassroomIO',
    description: 'Use ClassroomIO for customer onboarding, adoption and certification.',
    body
  };
}

function resources() {
  const root = '';
  const body = `${pageHero({
    eyebrow: 'Resources',
    title: 'Articles for customer education teams',
    lead: 'Planned supporting articles for the alternatives pages. Each entry shows the topic and the comparison pages it would link to.',
    note: 'Content plan preview. These articles are not written yet, so entries are marked as planned.'
  })}
  <section class="section" style="padding-top:0"><div class="wrap"><div class="post-list">${Object.values(BLOG)
    .map((post) => {
      const links = (post.links || [])
        .filter((slug) => COMPETITORS[slug])
        .map((slug) => `<a class="link-arrow" href="alternatives/${slug}.html">${esc(COMPETITORS[slug].name)} page</a>`)
        .join(' ');
      return `<article class="post" id="${post.id}"><span class="id">${post.id.toUpperCase()}</span><div><b>${esc(post.title)}</b><span class="sub">${esc(post.problem)}</span>${links ? `<div style="margin-top:8px;display:flex;gap:16px;flex-wrap:wrap">${links}</div>` : ''}</div><span class="tag hyp">Planned</span></article>`;
    })
    .join('')}</div></div></section>
  ${ctaBand({ title: 'Compare platforms in the meantime', text: 'The alternatives pages are ready to review.', primary: ['See alternatives', 'alternatives/index.html'], secondary: ['See pricing', 'pricing.html'] })}`;
  return {
    file: 'resources.html',
    root,
    current: 'Resources',
    title: 'Resources | ClassroomIO',
    description: 'Planned supporting articles for ClassroomIO customer education comparisons.',
    body
  };
}

function form(kind) {
  const root = '';
  const isDemo = kind === 'demo';
  const body = `${pageHero({
    eyebrow: isDemo ? 'Book a demo' : 'Get started',
    title: isDemo ? 'Talk to us about your academy' : 'Create your free academy',
    lead: isDemo
      ? 'Tell us what you teach and who your customers are. We will suggest a setup and a plan.'
      : 'Start on the free plan with up to 20 students and upgrade when you are ready.',
    note: isDemo
      ? 'Prototype placeholder. The live site sends this to the ClassroomIO demo booking flow.'
      : 'Prototype placeholder. The live site opens the ClassroomIO sign-up flow.'
  })}
  <section class="section" style="padding-top:0"><div class="wrap"><form class="notch form-card" data-proto-form>
    <label>Work email<input type="email" required placeholder="you@company.com" autocomplete="email" /></label>
    <label>Company<input type="text" required placeholder="Company name" autocomplete="organization" /></label>
    <label>${isDemo ? 'What would you like to teach customers?' : 'Which platform are you comparing?'}<select><option>${isDemo ? 'Product onboarding' : 'Skilljar'}</option>${
      isDemo
        ? '<option>Feature adoption</option><option>Certification</option>'
        : Object.values(COMPETITORS)
            .slice(1)
            .map((entry) => `<option>${esc(entry.name)}</option>`)
            .join('')
    }<option>Not sure yet</option></select></label>
    <button class="btn primary lg" type="submit">${isDemo ? 'Request a demo' : 'Create free account'}${ic('arrow')}</button>
    <p class="form-done" role="status">Prototype only: nothing was sent. <a href="${isDemo ? 'alternatives/index.html' : 'pricing.html'}">${isDemo ? 'Back to the alternatives hub' : 'See ClassroomIO plans'}</a>.</p>
  </form></div></section>`;
  return {
    file: isDemo ? 'demo.html' : 'get-started.html',
    root,
    current: '',
    title: isDemo ? 'Book a Demo | ClassroomIO' : 'Get Started | ClassroomIO',
    description: isDemo
      ? 'Prototype placeholder for booking a ClassroomIO demo.'
      : 'Prototype placeholder for the ClassroomIO sign-up flow.',
    body
  };
}

export function staticPages() {
  return [home(), hub(), pricing(), product(), solutions(), resources(), form('start'), form('demo')];
}
