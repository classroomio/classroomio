import { esc, ic, markWord } from './ui.mjs';
import { viz, featureViz } from './mockups.mjs';
import { heroStage } from './hero-stage.mjs';
import { FEATURES, COMPETITORS, SLUGS, CHECKED } from './site.mjs';
import shared from './content/shared.mjs';
import { CARDS, PRICING_URL } from './pricing-rows.mjs';

export const CAPTION = 'Illustrative mockup with sample data. Not a product screenshot.';

export function button(label, href, kind = 'primary', large = true) {
  const arrow = kind === 'primary' || kind === 'white' ? ic('arrow') : '';
  return `<a class="btn ${kind} ${large ? 'lg' : ''}" href="${href}">${esc(label)}${arrow}</a>`;
}

export function ctaBand({ title, text, primary, secondary, fine }) {
  return `<section class="section" aria-labelledby="cta-title"><div class="wrap"><div class="cta-band">
    <h2 id="cta-title">${esc(title)}</h2>
    <p>${esc(text)}</p>
    <div class="cta-actions">${button(primary[0], primary[1], 'white')}${secondary ? button(secondary[0], secondary[1], 'ghost-w') : ''}</div>
    ${fine ? `<span class="cta-fine">${esc(fine)}</span>` : ''}
  </div></div></section>`;
}

export function competitorPage(slug, content, root) {
  const name = COMPETITORS[slug].name;
  const href = (target) => (target.startsWith('#') ? target : `${root}${target}`);

  const hero = `<div class="hero-wrap"><section class="hero" aria-labelledby="hero-title"><div class="hero-grid">
    <div class="hero-copy">
      <span class="eyebrow">Exploring alternatives to ${esc(name)}</span>
      <h1 id="hero-title">${markWord(content.headline, content.mark)}</h1>
      <p class="lead">${esc(content.sub)}</p>
      <div class="hero-cta">${button(content.cta.primary[0], href(content.cta.primary[1]))}${button(content.cta.secondary[0], href(content.cta.secondary[1]), 'secondary')}</div>
      <ul class="chips">${content.chips.map((chip) => `<li>${ic('check')}${esc(chip)}</li>`).join('')}</ul>
    </div>
    <div class="hero-viz">${heroStage(content.hero, root)}<p class="cap">${CAPTION}</p></div>
  </div></section></div>`;

  const pickCard = (title, points) =>
    `<article class="notch pick"><h3>${esc(title)}</h3><ul class="pick-list">${points.map((point) => `<li>${ic('check')}<span>${esc(point)}</span></li>`).join('')}</ul></article>`;
  const pick = `<section class="section" id="pick" aria-labelledby="pick-title"><div class="wrap">
    <div class="sec-head center"><h2 class="h2" id="pick-title">Which one should you pick?</h2><p class="lead">${esc(content.pick.lead)}</p></div>
    <div class="pick-grid">${pickCard(content.pick.them.title, content.pick.them.points)}${pickCard(content.pick.us.title, content.pick.us.points)}</div>
  </div></section>`;

  const move = `<section class="section" id="why" aria-labelledby="why-title"><div class="wrap">
    <div class="sec-head center"><h2 class="h2" id="why-title">${esc(shared.move.title)}</h2><p class="lead">${esc(shared.move.sub)}</p></div>
    <div class="problem-grid">${shared.move.items.map(([title, text]) => `<article class="notch problem"><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`).join('')}</div>
  </div></section>`;

  const intro = `<section class="section tint" id="classroomio" aria-labelledby="intro-title"><div class="wrap intro-grid">
    <div class="intro-copy"><span class="eyebrow">${esc(shared.intro.eyebrow || 'The short version')}</span><h2 class="h2" id="intro-title">${esc(shared.intro.title)}</h2>
      <ol class="steps">${shared.intro.steps.map(([title, text], index) => `<li><span class="n">0${index + 1}</span><div><b>${esc(title)}</b><span>${esc(text)}</span></div></li>`).join('')}</ol>
    </div>
    <div>${viz(shared.intro.viz)}<p class="cap">${CAPTION}</p></div>
  </div></section>`;

  const featureCards = shared.features.items
    .map((item, index) => {
      const base = FEATURES[item.key];
      const text = item.text || base.text;
      return `<article class="notch feat ${index === 0 ? 'wide' : ''}"><div class="feat-viz">${featureViz(base.viz)}</div><div><h3>${ic(base.icon)}${esc(item.title || base.title)}</h3><p>${esc(text)}</p></div></article>`;
    })
    .join('');
  const features = `<section class="section" id="features" aria-labelledby="feat-title"><div class="wrap">
    <div class="sec-head"><span class="eyebrow">${esc(shared.features.eyebrow || 'Where ClassroomIO differs')}</span><h2 class="h2" id="feat-title">${esc(shared.features.title)}</h2><p class="lead">${esc(shared.features.lead)}</p></div>
    <div class="feat-grid">${featureCards}</div>
  </div></section>`;

  const showcase = `<section class="section showcase" id="product" aria-labelledby="show-title"><div class="wrap show-grid">
    <div class="show-copy"><span class="eyebrow">${esc(shared.showcase.eyebrow)}</span><h2 class="h2" id="show-title">${esc(shared.showcase.title)}</h2><p class="lead">${esc(shared.showcase.text)}</p>
      <ul class="ticks">${shared.showcase.points.map((point) => `<li>${ic('check')}<span>${esc(point)}</span></li>`).join('')}</ul></div>
    <div>${viz(shared.showcase.viz)}<p class="cap">${CAPTION}</p></div>
  </div></section>`;

  const priceCard = ({ title, price, unit, text, foot, className }) =>
    `<article class="price-card ${className}"><h3>${title}</h3><p class="price-big">${esc(price)}${unit ? ` <small>${esc(unit)}</small>` : ''}</p><p class="price-text">${esc(text)}</p><p class="price-foot">${foot}</p></article>`;
  const them = CARDS[slug];
  const compare = `<section class="section sand" id="compare" aria-labelledby="cmp-title"><div class="wrap">
    <div class="sec-head"><span class="eyebrow">${esc(shared.plans.eyebrow)}</span><h2 class="h2" id="cmp-title">${esc(shared.plans.title)}</h2><p class="lead">${esc(shared.plans.lead)}</p></div>
    <div class="price-cards">${priceCard({
      title: esc(shared.plans.us.name),
      price: shared.plans.us.price,
      unit: shared.plans.us.unit,
      text: shared.plans.us.text,
      foot: `${esc(shared.plans.us.foot)} <a href="${href(shared.plans.us.link[1])}">${esc(shared.plans.us.link[0])}</a>`,
      className: 'us'
    })}${priceCard({
      title: esc(name),
      price: them.price,
      unit: them.unit,
      text: them.text,
      foot: `From <a href="${PRICING_URL[slug]}" target="_blank" rel="noopener">${esc(name)}'s pricing page</a>, checked ${esc(CHECKED)}.`,
      className: ''
    })}</div>
  </div></section>`;

  const faqItems = shared.faq;
  const faq = `<section class="section sand" id="faq" aria-labelledby="faq-title"><div class="wrap faq-grid">
    <div class="faq-side"><span class="eyebrow">FAQ</span><h2 class="h2" id="faq-title">ClassroomIO: common questions</h2><p class="lead">Short answers based on what we have verified about the product.</p><a class="link-arrow" href="${href('pricing.html')}">See ClassroomIO plans${ic('arrow')}</a></div>
    <div class="faq-list">${faqItems
      .map(
        ([question, answer], index) =>
          `<div class="notch faq-item ${index === 0 ? 'open' : ''}"><button class="faq-q" aria-expanded="${index === 0}" aria-controls="faq-${index}">${esc(question)}${ic('plus')}</button><div class="faq-a" id="faq-${index}" role="region"><div><p>${esc(answer)}</p></div></div></div>`
      )
      .join('')}</div>
  </div></section>`;

  const position = SLUGS.indexOf(slug);
  const related = [1, 2, 3].map((offset) => SLUGS[(position + offset) % SLUGS.length]);
  const reading = `<section class="section" id="related" aria-labelledby="read-title"><div class="wrap">
    <div class="sec-head"><span class="eyebrow">Keep reading</span><h2 class="h2" id="read-title">More on ${esc(name)} and the alternatives</h2><p class="lead">Comparing more than one platform? See how ClassroomIO stacks up against these.</p></div>
    <div class="read-grid">${related
      .map((other) => {
        const entry = COMPETITORS[other];
        return `<a class="read" href="${root}alternatives/${other}.html"><span class="tag">Alternatives</span><b>${esc(entry.name)} alternative</b><span>${esc(entry.blurb)}</span></a>`;
      })
      .join('')}</div>
  </div></section>`;

  const jsonLd = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  })}</script>`;

  const body = [
    hero,
    pick,
    move,
    intro,
    features,
    showcase,
    compare,
    faq,
    reading,
    ctaBand({
      title: shared.final.title,
      text: shared.final.text,
      primary: [shared.final.primary[0], href(shared.final.primary[1])],
      secondary: [shared.final.secondary[0], href(shared.final.secondary[1])],
      fine: shared.final.fine
    })
  ].join('\n');

  return {
    body,
    head: jsonLd,
    title: content.seo.title,
    description: content.seo.meta
  };
}

export function alternativesGrid(root) {
  return SLUGS.map((slug) => {
    const entry = COMPETITORS[slug];
    return `<a class="alt-card" href="${root}alternatives/${slug}.html" aria-label="${esc(entry.name)} alternatives">
      <div class="alt-top"><span class="mono-tile" aria-hidden="true">${esc(entry.name[0])}</span><div><h3>${esc(entry.name)}</h3><span class="eyebrow">${esc(entry.kind)}</span></div></div>
      <div style="display:grid;gap:8px;align-content:start"><span class="alt-angle">${esc(entry.angle)}</span><p>${esc(entry.blurb)}</p></div>
      <span class="link-arrow">Read the ${esc(entry.name)} comparison${ic('arrow')}</span></a>`;
  }).join('');
}

export { CHECKED };
