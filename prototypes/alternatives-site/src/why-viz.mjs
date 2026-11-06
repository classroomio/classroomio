const chips = (items, tone = '') => items.map((label) => `<span class="wv-chip ${tone}">${label}</span>`).join('');
const bars = (heights) =>
  `<div class="wv-bars">${heights.map((height) => `<i style="height:${height}%"></i>`).join('')}</div>`;

const VIZ = {
  ai: `<div class="wv-col"><div class="wv-tag">AI COURSE BUILDER</div><div class="wv-line"></div><div class="wv-line s"></div><div class="wv-line xs"></div><div class="wv-row">${chips(['Draft ready'], 'ok')}${chips(['You edit'], 'blue')}</div></div>`,
  mcp: `<div class="wv-col"><div class="wv-row">${chips(['Claude', 'Cursor', 'Codex', 'Gemini'])}</div><div class="wv-arrow">MCP</div><div class="wv-row">${chips(['ClassroomIO'], 'blue')}${chips(['Pending until you publish'], 'ok')}</div></div>`,
  oss: `<div class="wv-col"><div class="wv-code"><b>$</b> git clone classroomio</div><div class="wv-row">${chips(['Open source', 'Self-host'], 'blue')}</div></div>`,
  brand: `<div class="wv-col"><div class="wv-url"><span>●●●</span>academy.yourco.com</div><div class="wv-row"><i class="sw" style="background:#1e47d6"></i><i class="sw" style="background:#0b0d17"></i><i class="sw" style="background:#fbe0d0"></i><i class="sw" style="background:#3d6af0"></i><b class="aa">Aa</b></div><div class="wv-row">${chips(['Certificate'], 'ok')}</div></div>`,
  team: `<div class="wv-col"><div class="wv-row wv-avatars"><i>S</i><i>C</i><i>P</i><i>+</i></div><div class="wv-row">${chips(['Support', 'Success', 'Product'])}</div></div>`,
  focus: `<div class="wv-col"><div class="wv-row">${chips(['Customers'], 'blue')}</div><div class="wv-line"></div><div class="wv-line s"></div><div class="wv-row">${chips(['Courses', 'Certificates', 'Analytics'])}</div></div>`,
  analytics: `<div class="wv-col">${bars([34, 52, 71, 46, 88])}<div class="wv-row">${chips(['Stuck at lesson 3'], 'warn')}</div></div>`,
  suite: `<div class="wv-col"><div class="wv-row">${chips(['Create', 'Deliver', 'Measure'], 'blue')}</div><div class="wv-line"></div><div class="wv-line s"></div></div>`,
  cohort: `<div class="wv-col"><div class="wv-row">${chips(['Self-paced'])}${chips(['Cohort'], 'blue')}</div><div class="wv-track"><i style="width:68%"></i></div><div class="wv-note">68% of the cohort finished</div></div>`,
  journey: `<div class="wv-row wv-journey">${chips(['GETTING STARTED'], 'ok')}•${chips(['NEW FEATURES'], 'blue')}•${chips(['ADVANCED'])}</div>`,
  growth: `<div class="wv-col">${bars([28, 45, 62, 92])}<div class="wv-note">Up to 10,000 students</div></div>`
};

export const whyViz = (kind) => VIZ[kind] || '';
