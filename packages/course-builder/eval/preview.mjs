/** Renders a package course as one HTML page to read, with citations, checks, final quiz and practice tasks. */
function questionHtml(question) {
  const options = question.options
    .map((option) => `<li>${option.correct ? '<b>✓</b> ' : ''}${option.label}</li>`)
    .join('');
  const steps = (question.orderedSteps ?? []).map((step) => `<li>${step}</li>`).join('');

  return `<div class="q"><p><i>${question.type}, ${question.bloom}</i> ${question.prompt}</p>${options ? `<ul>${options}</ul>` : ''}${steps ? `<ol>${steps}</ol>` : ''}<p class="cite">supports: ${question.supportBlockIds.join(', ')}</p></div>`;
}

function blockHtml(block) {
  const cites = (citations) =>
    `<p class="cite">${citations.map((citation) => `<a href="${citation.pageUrl}">${citation.blockIds.length} blocks</a>`).join(' · ')}</p>`;
  if (block.type === 'text') return `${block.html}${cites(block.citations)}`;
  if (block.type === 'callout')
    return `<aside class="${block.tone}"><b>${block.tone}</b> ${block.html}</aside>${cites(block.citations)}`;
  if (block.type === 'image')
    return `<figure><img src="${block.url}" alt="${block.alt}"><figcaption>${block.alt}</figcaption></figure>`;

  return `<p>▶ <a href="${block.url}">${block.title}</a> (${block.provider})</p>`;
}

export function courseHtml(course) {
  return `<!doctype html><meta charset="utf-8"><title>${course.title}</title>
<style>body{font:16px/1.5 system-ui;max-width:820px;margin:2rem auto;padding:0 1rem}img{max-width:100%}.cite{font-size:12px;color:#777}aside{background:#f4f6fb;padding:.5rem 1rem;border-left:4px solid #88a}.q{border-top:1px solid #ddd}</style>
<h1>${course.title}</h1><p>${course.description}</p><ul>${course.outcomes.map((outcome) => `<li>${outcome}</li>`).join('')}</ul>
${course.sections
  .map(
    (section) =>
      `<h2>${section.title}</h2>${section.lessons.map((lesson) => `<h3>${lesson.title}</h3>${lesson.blocks.map(blockHtml).join('\n')}`).join('\n')}<h3>Check</h3>${section.check.map(questionHtml).join('')}`
  )
  .join('\n')}
<h2>Final quiz</h2>${course.finalQuiz.map(questionHtml).join('')}
<h2>Practice</h2>${course.practiceTasks.map(questionHtml).join('')}`;
}
