export interface BlockPreviewScene {
  duration: number;
  markup: string;
}

const classAttr = (names: string) => 'class="' + names + '"';
const rect = (x: number, y: number, w: number, h: number, cls: string, extra = '') =>
  `<rect ${classAttr(cls)} x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(h / 2, 2.5)}" ${extra}/>`;
const bar = (x: number, y: number, w: number, cls = 'fl', extra = '') => rect(x, y, w, 5, cls, extra);
const grow = (x: number, y: number, w: number, delay: number, cls = 'fl') =>
  bar(x, y, w, `${cls} r gx`, `style="--d:${delay}s"`);
const cursor = (name: string) =>
  `<g class="s cur off" style="animation-name:${name}"><path class="cursor" d="M0 0 L0 13 L3.6 9.8 L6.2 15 L8.4 14 L5.9 8.9 L10.5 8.6 Z"/></g>`;
const check = (cx: number, cy: number) =>
  `<circle class="kf" cx="${cx}" cy="${cy}" r="6"/><path class="kw" d="M${cx - 2.6} ${cy} l1.9 1.9 3.4-3.7"/>`;
const svg = (duration: number, body: string): BlockPreviewScene => ({
  duration,
  markup: `<svg viewBox="0 0 280 170" style="--dur:${duration}s" aria-hidden="true">${body}</svg>`
});

/**
 * Animated SVG previews of each block type, keyed by block type, drawn on a 280x170 stage.
 */
export const BLOCK_PREVIEW_SCENES: Record<string, () => BlockPreviewScene> = {
  note: () =>
    svg(
      5.5,
      `
    <rect class="ln" x="20" y="14" width="240" height="142" rx="8"/>
    ${rect(36, 28, 118, 10, 'kf r gx', 'style="--d:.2s;--rd:.7s"')}
    ${grow(36, 50, 206, 0.8)}
    ${rect(92, 58, 56, 11, 'kt r gx', 'style="--d:2.9s;--rd:.35s"')}
    ${grow(36, 61, 188, 0.95)}
    ${grow(36, 72, 140, 1.1)}
    ${[0, 1, 2]
      .map(
        (i) => `
      <circle class="kf r pop" cx="40" cy="${94.5 + i * 14}" r="2.2" style="--d:${1.4 + i * 0.2}s"/>
      ${grow(48, 92 + i * 14, [150, 118, 172][i], 1.45 + i * 0.2)}`
      )
      .join('')}
    <g class="r up" style="--d:3.2s;--rd:.35s">
      <rect class="ln" x="92" y="34" width="60" height="18" rx="4"/>
      <text class="tk" x="102" y="46" style="font-weight:700">B</text>
      <text class="tx" x="119" y="46" style="font-style:italic">I</text>
      <text class="tx" x="134" y="46" style="text-decoration:underline">U</text>
    </g>`
    ),

  tabs: () =>
    svg(
      7,
      `
    <rect class="ln" x="20" y="14" width="240" height="142" rx="8"/>
    <text class="tx" x="58" y="36" text-anchor="middle">INTRO</text>
    <text class="tx" x="126" y="36" text-anchor="middle">STEPS</text>
    <text class="tx" x="194" y="36" text-anchor="middle">RECAP</text>
    <line class="lt" x1="24" y1="46" x2="256" y2="46"/>
    <rect class="kf s" x="30" y="44.5" width="56" height="3" rx="1.5" style="animation-name:tabbar;transform:translateX(136px)"/>
    <g class="s off" style="animation-name:w3a">
      <text class="tk" x="58" y="36" text-anchor="middle">INTRO</text>
      ${bar(34, 62, 204)}${bar(34, 74, 186)}${bar(34, 86, 200)}${bar(34, 98, 120)}
      ${rect(34, 116, 212, 26, 'kt')}${bar(44, 126, 140, 'kf')}
    </g>
    <g class="s off" style="animation-name:w3b">
      <text class="tk" x="126" y="36" text-anchor="middle">STEPS</text>
      <rect class="lo" x="34" y="60" width="80" height="62" rx="4"/>
      <polyline class="lt" points="34,114 56,92 74,106 92,86 114,110"/>
      <circle class="lo" cx="96" cy="74" r="5"/>
      ${bar(126, 64, 110)}${bar(126, 76, 94)}${bar(126, 88, 104)}${bar(126, 100, 60)}
    </g>
    <g class="s" style="animation-name:w3c">
      <text class="tk" x="194" y="36" text-anchor="middle">RECAP</text>
      ${[62, 84, 106]
        .map(
          (y, i) => `
        <rect class="ink" x="34" y="${y}" width="12" height="12" rx="3"/>
        <path class="ko" d="M37 ${y + 6} l2.5 2.5 4.5-5"/>
        ${bar(56, y + 3.5, [150, 120, 166][i])}`
        )
        .join('')}
    </g>
    ${cursor('tabcur')}`
    ),

  process: () => {
    const xs = [48, 109, 170, 231];
    const labels = ['PLAN', 'DRAFT', 'REVIEW', 'SHIP'];
    const widths = [
      [180, 120],
      [150, 170],
      [196, 90],
      [130, 160]
    ];
    const windows = ['w4a', 'w4b', 'w4c', 'w4d'];
    const reach = [null, 'r2', 'r3', 'r4'];
    return svg(
      7.5,
      `
      <line class="lt" x1="48" y1="40" x2="231" y2="40"/>
      <rect class="kf s" x="48" y="39" width="183" height="2" style="animation-name:procline;transform-origin:0 50%"/>
      ${xs
        .map(
          (x, i) => `
        <circle class="ln" cx="${x}" cy="40" r="11"/>
        <text class="tx" x="${x}" y="43" text-anchor="middle">${i + 1}</text>
        <g ${classAttr(reach[i] ? 's' : '')} style="${reach[i] ? `animation-name:${reach[i]}` : ''}">
          <circle class="kf" cx="${x}" cy="40" r="11"/>
          <text class="tw" x="${x}" y="43" text-anchor="middle">${i + 1}</text>
        </g>
        <text class="tx" x="${x}" y="64" text-anchor="middle" style="font-size:7px">${labels[i]}</text>`
        )
        .join('')}
      <rect class="ln" x="24" y="76" width="232" height="68" rx="6"/>
      ${windows
        .map(
          (name, i) => `
        <g ${classAttr(i < 3 ? 's off' : 's')} style="animation-name:${name}">
          <text class="tk" x="38" y="96">STEP 0${i + 1} · ${labels[i]}</text>
          ${bar(38, 106, widths[i][0])}${bar(38, 118, widths[i][1])}
        </g>`
        )
        .join('')}`
    );
  },

  video: () =>
    svg(
      7,
      `
    <defs><clipPath id="vclip"><rect x="28" y="14" width="224" height="126" rx="6"/></clipPath></defs>
    <rect class="ln" x="28" y="14" width="224" height="126" rx="6"/>
    <g clip-path="url(#vclip)">
      <polyline class="lt" points="28,118 70,92 104,108 150,74 196,104 228,88 252,100"/>
      <g class="s lin" style="animation-name:vsun;transform:translate(-80px,12px)"><circle class="lo" cx="206" cy="40" r="9"/></g>
    </g>
    <rect class="fl" x="44" y="124" width="192" height="3" rx="1.5"/>
    <rect class="kf s lin" x="44" y="124" width="192" height="3" rx="1.5" style="animation-name:vprog;transform-origin:0 50%"/>
    <g class="s lin" style="animation-name:vhead;transform:translateX(192px)"><circle class="kf" cx="44" cy="125.5" r="4"/></g>
    <g class="s off" style="animation-name:vplay">
      <circle class="kf" cx="140" cy="72" r="16"/>
      <path class="tw" d="M135 64 L148 72 L135 80 Z"/>
    </g>
    <text class="tx" x="252" y="156" text-anchor="end">03:00</text>
    <g class="s" style="animation-name:vdone">
      ${check(34, 153)}
      <text class="tk" x="46" y="156">WATCHED 95%</text>
    </g>
    ${cursor('vcur')}`
    ),

  slides: () =>
    svg(
      7.5,
      `
    <defs><clipPath id="sclip"><rect x="44" y="16" width="192" height="110" rx="4"/></clipPath></defs>
    <rect class="ln" x="44" y="16" width="192" height="110" rx="4"/>
    <g clip-path="url(#sclip)">
      <g class="s" style="animation-name:slstrip;transform:translateX(-384px)">
        <text class="tx" x="64" y="42" style="font-size:7px">01 · ORBITS</text>
        ${rect(64, 50, 104, 10, 'kf')}${bar(64, 70, 150)}${bar(64, 80, 96)}
        ${rect(256, 32, 80, 7, 'fd')}
        ${[0, 1, 2].map((i) => `<circle class="kf" cx="262" cy="${58 + i * 16}" r="2.2"/>${bar(270, 55.5 + i * 16, [118, 96, 128][i])}`).join('')}
        <path class="lo" d="M448 38 V108 H612"/>
        ${[26, 44, 36, 60].map((h, i) => `<rect ${classAttr(i === 3 ? 'kf' : 'ink')} x="${462 + i * 34}" y="${108 - h}" width="20" height="${h}" rx="2"/>`).join('')}
      </g>
    </g>
    <path class="lo" d="M34 64 l-6 7 6 7"/>
    <g class="s" style="animation-name:slarrow"><path class="ko" d="M246 64 l6 7 -6 7"/></g>
    ${[128, 140, 152].map((x) => `<circle class="ln" cx="${x}" cy="142" r="3"/>`).join('')}
    <g class="s" style="animation-name:sldot;transform:translateX(24px)"><circle class="kf" cx="128" cy="142" r="3"/></g>`
    ),

  document: () =>
    svg(
      6.5,
      `
    <rect class="ln" x="24" y="16" width="232" height="50" rx="6"/>
    <path class="ln" d="M38 26 h16 l8 8 v22 h-24 z"/>
    <path class="lo" d="M54 26 v8 h8"/>
    <text class="tk" x="41" y="51" style="font-size:6px">PDF</text>
    <text class="tx" x="72" y="38">course-syllabus.pdf</text>
    <text class="tx" x="72" y="52" style="font-size:6.5px">2.4 MB · 12 PAGES</text>
    <circle class="ln" cx="230" cy="41" r="12"/>
    <g class="s off" style="animation-name:ddrop"><path class="ko" d="M230 34 v11 M225.5 40.5 l4.5 4.5 4.5-4.5"/></g>
    <circle class="ko s off dashed-draw" cx="230" cy="41" r="12" pathLength="100" style="animation-name:dring;stroke-dasharray:100;stroke-width:2.2;transform:rotate(-90deg)"/>
    <g class="s" style="animation-name:dcheck">${check(230, 41)
      .replace('r="6"', 'r="12"')
      .replace(/M227\.4 41 l1\.9 1\.9 3\.4-3\.7/, 'M225 41 l3.5 3.5 6.5-7')}</g>
    ${[0, 1, 2]
      .map((i) => {
        const x = 24 + i * 80;
        return `<g class="s" style="animation-name:dthumb;--d:${i * 0.15}s">
        <rect class="ln" x="${x}" y="76" width="72" height="80" rx="4"/>
        ${rect(x + 8, 86, 40, 4, 'fd')}${rect(x + 8, 96, 56, 4, 'fl')}${rect(x + 8, 104, 50, 4, 'fl')}${rect(x + 8, 112, 54, 4, 'fl')}${rect(x + 8, 120, 36, 4, 'fl')}
        <text class="tx" x="${x + 64}" y="150" text-anchor="end" style="font-size:6px">${i + 1}</text>
      </g>`;
      })
      .join('')}
    ${cursor('dcur')}`
    ),

  image: () =>
    svg(
      6.5,
      `
    <g class="s off" style="animation-name:izone">
      <rect class="lo dash" x="40" y="14" width="200" height="118" rx="6"/>
      <path class="ko" d="M140 78 v-20 M131 66 l9-9 9 9"/>
      <text class="tx" x="140" y="96" text-anchor="middle">DROP AN IMAGE</text>
    </g>
    <g class="s off" style="animation-name:ifile">
      <rect class="ln" x="122" y="52" width="36" height="28" rx="3"/>
      <polyline class="lt" points="122,78 134,66 142,74 148,68 158,78"/>
    </g>
    <g class="s" style="animation-name:iimg">
      <rect class="ln" x="40" y="14" width="200" height="118" rx="4"/>
      <polygon class="fl" points="41,131 96,72 130,106 168,78 239,131"/>
      <circle class="kf" cx="196" cy="40" r="8"/>
      <rect class="cover s" x="41" y="15" width="198" height="116" style="animation-name:icover;transform-origin:50% 100%;transform:scaleY(0)"/>
    </g>
    <rect class="fl s" x="40" y="142" width="130" height="5" rx="2.5" style="animation-name:icap;transform-origin:0 50%"/>
    <g class="s" style="animation-name:icorner">
      <path class="ko" d="M34 26 v-18 h18 M228 8 h18 v18 M246 120 v18 h-18 M52 138 h-18 v-18"/>
    </g>`
    ),

  chart: () => {
    const heights = [34, 56, 42, 72, 60, 92];
    const tops = heights.map((h, i) => [56 + i * 32 + 9, 136 - h - 8]);
    return svg(
      5.5,
      `
      <line class="lt dash" x1="40" y1="56" x2="254" y2="56"/>
      <line class="lt dash" x1="40" y1="96" x2="254" y2="96"/>
      <path class="lo" d="M40 18 V136 H254"/>
      ${heights
        .map(
          (
            h,
            i
          ) => `<rect ${classAttr(`${i === 5 ? 'kf' : 'ink'} r gy`)} x="${56 + i * 32}" y="${136 - h}" width="18" height="${h}" rx="2" style="--d:${0.2 + i * 0.12}s;--rd:.6s"/>
        <text class="tx" x="${65 + i * 32}" y="150" text-anchor="middle">${'JFMAMJ'[i]}</text>`
        )
        .join('')}
      <polyline class="ko r dr dashed-draw" pathLength="100" points="${tops.map((p) => p.join(',')).join(' ')}" style="--len:100;--d:1.3s;--rd:1s"/>
      ${tops.map((p, i) => `<circle class="ink r pop" cx="${p[0]}" cy="${p[1]}" r="2.4" style="--d:${1.35 + i * 0.16}s;--rd:.3s"/>`).join('')}
      <g class="r up" style="--d:2.4s;--rd:.4s">
        <rect class="ln" x="190" y="8" width="44" height="16" rx="3"/>
        <text class="tk" x="212" y="19" text-anchor="middle">+42%</text>
      </g>`
    );
  },

  flashcards: () =>
    svg(
      7,
      `
    <rect class="ln" x="86" y="12" width="108" height="90" rx="8"/>
    <rect class="ln" x="78" y="17" width="124" height="92" rx="8"/>
    <g class="s" style="animation-name:ffront;transform:scaleX(0)">
      <rect class="ln" x="70" y="22" width="140" height="94" rx="8"/>
      <text class="tx" x="84" y="40">QUESTION</text>
      ${rect(84, 54, 100, 7, 'fd')}${bar(84, 68, 80)}
      <text class="tx" x="84" y="106" style="font-size:6.5px">TAP TO FLIP</text>
    </g>
    <g class="s" style="animation-name:fback">
      <rect class="ink" x="70" y="22" width="140" height="94" rx="8"/>
      <text class="tk" x="84" y="40">ANSWER</text>
      ${check(194, 37)}
      ${rect(84, 54, 64, 9, 'kf')}${bar(84, 72, 110)}${bar(84, 82, 92)}
    </g>
    <g class="s" style="animation-name:fbtn">
      <rect class="ln" x="78" y="124" width="58" height="18" rx="9"/>
      <text class="tx" x="107" y="136" text-anchor="middle">AGAIN</text>
      <rect class="ln" x="144" y="124" width="58" height="18" rx="9"/>
      <text class="tx" x="173" y="136" text-anchor="middle">GOT IT</text>
    </g>
    <g class="s" style="animation-name:fpress">
      <rect class="kf" x="144" y="124" width="58" height="18" rx="9"/>
      <text class="tw" x="173" y="136" text-anchor="middle">GOT IT</text>
    </g>
    <text class="tx" x="140" y="160" text-anchor="middle" style="font-size:6.5px">CARD 3 / 12</text>
    ${cursor('fcur')}`
    ),

  multiple_choice: () => {
    const rows = [32, 58, 84, 110];
    const options = ['Mars', 'Jupiter', 'Venus', 'Earth'];
    const row = (y: number, label: string) => `<rect class="ln" x="28" y="${y}" width="224" height="20" rx="4"/>
      <circle class="lo" cx="42" cy="${y + 10}" r="5"/>
      <text class="tx" x="56" y="${y + 13}">${label}</text>`;
    return svg(
      6.5,
      `
      <text class="tx" x="28" y="22">WHICH PLANET IS THE LARGEST?</text>
      ${row(rows[1], options[1])}
      <g class="s" style="animation-name:mdim;opacity:.4">${[0, 2, 3].map((i) => row(rows[i], options[i])).join('')}</g>
      <g class="s" style="animation-name:mchosen">
        <rect class="ink" x="28" y="58" width="224" height="20" rx="4"/>
        <circle class="ko" cx="42" cy="68" r="5"/><circle class="kf" cx="42" cy="68" r="2.6"/>
        <text class="tk" x="56" y="71">Jupiter</text>
      </g>
      <g class="s" style="animation-name:mfb">
        ${check(34, 148)}
        <text class="tk" x="46" y="151">CORRECT</text>
        <text class="tx" x="252" y="151" text-anchor="end">1 / 5</text>
      </g>
      ${cursor('mcur')}`
    );
  },

  html: () => {
    const lines = [
      ['&lt;h1&gt;', 'Orbits', '&lt;/h1&gt;'],
      ['&lt;div ', 'class="sun"', '&gt;'],
      ['  &lt;i ', 'class="moon"', '&gt;'],
      ['&lt;/div&gt;', '', ''],
      ['&lt;button&gt;', 'Spin', '&lt;/button&gt;'],
      ['&lt;script&gt;', '…', '&lt;/script&gt;']
    ];
    return svg(
      7,
      `
      <rect class="ln" x="16" y="14" width="124" height="140" rx="6"/>
      ${[28, 36, 44].map((x) => `<circle class="lt" cx="${x}" cy="24" r="2.2"/>`).join('')}
      ${lines.map((parts, i) => `<text class="r up" x="24" y="${46 + i * 16}" style="font-size:7px;--d:${0.2 + i * 0.3}s"><tspan class="tk">${parts[0]}</tspan><tspan class="tx">${parts[1]}</tspan><tspan class="tk">${parts[2]}</tspan></text>`).join('')}
      <path class="lo" d="M143 84 h7 M147 80.5 l3.5 3.5 -3.5 3.5"/>
      <rect class="ln" x="154" y="14" width="110" height="140" rx="6"/>
      <line class="lt" x1="154" y1="30" x2="264" y2="30"/>
      ${rect(166, 40, 50, 7, 'kf r gx', 'style="--d:2.1s"')}
      <circle class="lo dash r fi" cx="209" cy="88" r="24" style="--d:2.4s"/>
      <circle class="kf r pop" cx="209" cy="88" r="7" style="--d:2.4s"/>
      <g class="r fi" style="--d:2.7s"><g class="spin" style="transform-origin:209px 88px"><circle class="ink" cx="233" cy="88" r="4"/></g></g>
      <g class="r pop" style="--d:3s"><g class="s" style="animation-name:hpress">
        <rect class="kf" x="181" y="124" width="56" height="16" rx="8"/>
        <text class="tw" x="209" y="135" text-anchor="middle">SPIN</text>
      </g></g>
      <rect class="ko s off" x="181" y="124" width="56" height="16" rx="8" style="animation-name:hring"/>
      ${cursor('hcur')}`
    );
  },

  audio: () => {
    const heights = [8, 14, 22, 12, 28, 18, 30, 16, 24, 10, 20, 32, 14, 26, 18, 12, 22, 28, 10, 16, 24, 12, 18, 8];
    return svg(
      6,
      `
      <rect class="ln" x="20" y="44" width="240" height="82" rx="10"/>
      <circle class="kf" cx="52" cy="85" r="15"/>
      <rect class="tw" x="46.5" y="79" width="3.5" height="12" rx="1"/><rect class="tw" x="54" y="79" width="3.5" height="12" rx="1"/>
      <text class="tx" x="78" y="64">EP. 04 · OFFICE HOURS</text>
      ${heights
        .map(
          (
            h,
            i
          ) => `<rect class="fd eq" x="${78 + i * 7}" y="${90 - h / 2}" width="3" height="${h}" rx="1.5" style="animation-delay:-${(i * 0.13) % 0.9}s"/>
        <g class="r fi" style="--d:${0.3 + i * 0.16}s;--rd:.15s"><rect class="kf eq" x="${78 + i * 7}" y="${90 - h / 2}" width="3" height="${h}" rx="1.5" style="animation-delay:-${(i * 0.13) % 0.9}s"/></g>`
        )
        .join('')}
      <text class="tk" x="78" y="116" style="font-size:7px">04:12</text>
      <text class="tx" x="244" y="116" text-anchor="end" style="font-size:7px">12:30</text>`
    );
  },

  poll: () => {
    const rows = [36, 72, 108];
    const labels = ['VERY', 'SOMEWHAT', 'NOT YET'];
    const shares = [62, 25, 13];
    return svg(
      6.5,
      `
      <text class="tx" x="28" y="22">HOW CONFIDENT DO YOU FEEL?</text>
      ${rows
        .map(
          (y, i) => `
        <text ${classAttr(i === 0 ? 'tk' : 'tx')} x="28" y="${y + 8}">${labels[i]}</text>
        ${rect(28, y + 14, 196, 8, 'fl')}
        ${rect(28, y + 14, Math.round((196 * shares[i]) / 100), 8, `${i === 0 ? 'kf' : 'fd'} r gx`, `style="--d:${1.4 + i * 0.2}s;--rd:1.1s"`)}
        <text ${classAttr(`${i === 0 ? 'tk' : 'tx'} r fi`)} x="252" y="${y + 21.5}" text-anchor="end" style="--d:2.5s">${shares[i]}%</text>`
        )
        .join('')}
      <g class="s" style="animation-name:pvote">${check(78, 41.5).replace('r="6"', 'r="5"')}</g>
      <text class="tx r fi" x="28" y="158" style="--d:2.7s">24 VOTES · RESULTS LIVE</text>
      ${cursor('pcur')}`
    );
  },

  timeline: () => {
    const xs = [48, 112, 176, 240];
    const years = ['1609', '1687', '1957', '1969'];
    const reach = xs.map((x) => 0.3 + (4.5 * (x - 24)) / 232);
    return svg(
      7,
      `
      <line class="lt" x1="24" y1="92" x2="256" y2="92"/>
      <rect class="kf r gx lin" x="24" y="91" width="232" height="2" style="--d:.3s;--rd:4.5s"/>
      ${xs
        .map((x, i) => {
          const above = i % 2 === 0;
          const top = above ? 44 : 108;
          return `<circle class="ln" cx="${x}" cy="92" r="5"/>
          <circle class="kf r pop" cx="${x}" cy="92" r="5" style="--d:${reach[i].toFixed(2)}s;--rd:.35s"/>
          <g class="r up" style="--d:${(reach[i] + 0.1).toFixed(2)}s;--rd:.4s">
            <line class="lt" x1="${x}" y1="${above ? 76 : 97}" x2="${x}" y2="${above ? 87 : 108}"/>
            <rect class="ln" x="${x - 30}" y="${top}" width="60" height="32" rx="4"/>
            <text class="tk" x="${x - 23}" y="${top + 13}">${years[i]}</text>
            ${rect(x - 23, top + 19, 42, 4, 'fl')}
          </g>`;
        })
        .join('')}`
    );
  },

  code: () => {
    const tokens: [number, string][][] = [
      [
        [22, 'kf'],
        [40, 'fd']
      ],
      [
        [14, 'fl'],
        [30, 'kf'],
        [56, 'fd']
      ],
      [
        [24, 'fl'],
        [44, 'fd'],
        [20, 'kf']
      ],
      [],
      [
        [22, 'kf'],
        [38, 'fd'],
        [18, 'fl']
      ],
      [
        [14, 'fl'],
        [60, 'fd'],
        [26, 'kf'],
        [16, 'fl']
      ],
      [
        [30, 'fd'],
        [24, 'fl']
      ]
    ];
    let delay = 0.2;
    const body = tokens
      .map((line, row) => {
        const y = 42 + row * 14;
        let x = 46 + (row === 1 || row === 2 || row === 5 ? 12 : 0);
        const parts = line
          .map(([w, cls]) => {
            const out = rect(x, y, w, 5, `${cls} r gx`, `style="--d:${delay.toFixed(2)}s;--rd:.25s"`);
            x += w + 4;
            delay += 0.14;
            return out;
          })
          .join('');
        return `<text class="tx" x="36" y="${y + 5}" text-anchor="end" style="font-size:7px">${row + 1}</text>${parts}`;
      })
      .join('');
    return svg(
      6,
      `
      <rect class="ln" x="20" y="14" width="240" height="140" rx="8"/>
      <line class="lt" x1="20" y1="32" x2="260" y2="32"/>
      ${[32, 41, 50].map((x) => `<circle class="lt" cx="${x}" cy="23" r="2.4"/>`).join('')}
      <text class="tx" x="62" y="26" style="font-size:7px">orbit.py</text>
      <g class="s off" style="animation-name:ccopy">
        <rect class="ln" x="210" y="18" width="42" height="11" rx="3"/>
        <text class="tx" x="231" y="25.8" text-anchor="middle" style="font-size:6px">COPY</text>
      </g>
      <g class="s" style="animation-name:ccopied">
        <rect class="kf" x="210" y="18" width="42" height="11" rx="3"/>
        <text class="tw" x="231" y="25.8" text-anchor="middle" style="font-size:6px">COPIED</text>
      </g>
      ${body}`
    );
  },

  embed: () =>
    svg(
      6.5,
      `
    <rect class="ln" x="24" y="18" width="232" height="24" rx="6"/>
    <circle class="ko" cx="36" cy="30" r="4"/>
    <text class="tx" x="48" y="33">https://youtu.be/orbit-101</text>
    <rect class="cover r uncover" x="46" y="22" width="200" height="16" style="--d:.3s;--rd:1.6s;animation-timing-function:steps(26,end)"/>
    <g class="r up" style="--d:2.1s;--rd:.45s">
      <rect class="ln" x="24" y="52" width="232" height="104" rx="6"/>
      <rect class="ink" x="34" y="62" width="96" height="84" rx="4"/>
      <circle class="kf" cx="82" cy="104" r="12"/>
      <path class="tw" d="M78 97.5 L88 104 L78 110.5 Z"/>
    </g>
    ${rect(142, 66, 96, 7, 'fd r gx', 'style="--d:2.5s"')}
    ${grow(142, 82, 100, 2.7)}
    ${grow(142, 92, 84, 2.85)}
    <text class="tx r fi" x="142" y="138" style="font-size:7px;--d:3s">YOUTU.BE</text>`
    )
};
