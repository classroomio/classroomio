const MODE = new URLSearchParams(location.search).get('play') === '1' ? 'learn' : 'author';

const PICTURES = {
  return: {
    label: 'W-2 and practice return',
    regions: [
      { id: 'wages', label: 'Wages on the W-2' },
      { id: 'withheld', label: 'Tax withheld on the W-2' }
    ]
  },
  ward: {
    label: 'Patient and medication',
    regions: [
      { id: 'wristband', label: 'Wristband' },
      { id: 'iv', label: 'IV pole' },
      { id: 'cup', label: 'Med cup' }
    ]
  },
  facility: {
    label: 'Fridge alert and floor',
    regions: [
      { id: 'pharmacy', label: 'Pharmacy fridge 2' },
      { id: 'breakroom', label: 'Break room fridge' }
    ]
  }
};

const COURSE_META = {
  tax: {
    title: 'US tax floor readiness',
    person: MODE === 'learn' ? ['Sam Okonkwo', 'Trainee', 'SO'] : ['Gargi Pandit', 'Training lead', 'GP'],
    help: 'Trainees go to the floor after they pass 100 cases. The bank can hold a few hundred returns.',
    quota: '100',
    nameHint: 'Tax form practice',
    sections: [
      {
        title: '1. Before a return',
        lessons: [
          {
            title: 'How a US individual return is filed',
            body: 'A return starts from the intake sheet and the W-2. You enter filing status, wages, and withholding. The practice table turns taxable income into tax. Withheld minus tax is the refund or the balance due.'
          },
          {
            title: 'Reading a W-2',
            body: 'Box 1 is wages. Box 2 is federal income tax withheld. Copy those numbers. Do not round them.'
          }
        ]
      }
    ],
    practice: '2. Floor practice'
  },
  medical: {
    title: 'Ward medication safety',
    person: MODE === 'learn' ? ['Chris Adeyemi', 'Nurse', 'CA'] : ['Elena Vasquez', 'Nurse educator', 'EV'],
    help: 'Nurses pass a set of medication cases before they give doses on the ward.',
    quota: '12',
    nameHint: 'Medication hold practice',
    sections: [
      {
        title: '1. The checks',
        lessons: [
          {
            title: 'Identity, allergy, then the dose',
            body: 'Read the wristband before you touch the medication. If the order names a drug in an allergy family, hold the dose and call pharmacy. Do not give a partial dose to “be safe.”'
          }
        ]
      }
    ],
    practice: '2. Ward practice'
  },
  sensor: {
    title: 'SensorHubb on-call',
    person: MODE === 'learn' ? ['Miles Ortega', 'Technician', 'MO'] : ['Miles Ortega', 'Facility trainer', 'MO'],
    help: 'Technicians pass excursion cases before they take on-call for a facility.',
    quota: '8',
    nameHint: 'Excursion on call',
    sections: [
      {
        title: '1. What an excursion is',
        lessons: [
          {
            title: 'Temperature limits and the work order',
            body: 'Vaccine storage stays between 2°C and 8°C. Above that, move the stock and open a work order. Silencing the Slack alert leaves the product in the warm fridge.'
          }
        ]
      }
    ],
    practice: '2. On-call practice'
  }
};

const state = {
  courseId: 'tax',
  screen: 'outline',
  modal: null,
  addType: 'simulation',
  setup: { name: '', quota: '' },
  draft: null,
  player: null,
  lesson: null,
  notice: ''
};

const courses = {};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
  });
}

function step(kind, extra) {
  return {
    id: uid(),
    kind,
    prompt: '',
    options: kind === 'choose' ? ['', '', ''] : [],
    correct: kind === 'choose' ? 0 : '',
    wrongNote: '',
    ...extra
  };
}

function taxCase() {
  return {
    id: uid(),
    title: 'Jordan Hale, one W-2',
    brief:
      'Jordan Hale is single. Prepare the practice return from the W-2. The floor key expects a refund.',
    picture: 'return',
    result: 'This return matches the key. Passed.',
    steps: [
      step('choose', {
        prompt: 'Filing status',
        options: ['Single', 'Married filing jointly', 'Head of household'],
        correct: 0,
        wrongNote: 'The intake sheet says Jordan is unmarried.'
      }),
      step('fill', {
        prompt: 'Wages from the W-2',
        correct: '48250',
        wrongNote: 'Use box 1. Do not round.'
      }),
      step('fill', {
        prompt: 'Federal income tax withheld',
        correct: '6100',
        wrongNote: 'Use box 2 on the W-2.'
      }),
      step('fill', {
        prompt: 'Refund',
        correct: '2358',
        wrongNote: 'Withheld minus tax. 6,100 − 3,742.'
      })
    ]
  };
}

function medicalCase() {
  return {
    id: uid(),
    title: 'Amina Rahman, amoxicillin',
    brief: 'The dose is due now. Check who this is, then decide whether it can be given.',
    picture: 'ward',
    result: 'You held the dose and called pharmacy. Passed.',
    steps: [
      step('tap', {
        prompt: 'Confirm who is in the bed',
        correct: 'wristband',
        wrongNote: 'Identity is on the wristband, before the medication.'
      }),
      step('choose', {
        prompt: 'What do you do with this dose?',
        options: ['Give it now', 'Hold and call pharmacy', 'Give half the dose'],
        correct: 1,
        wrongNote: 'Amoxicillin is a penicillin. The band lists a penicillin allergy.'
      }),
      step('choose', {
        prompt: 'Why are you holding it?',
        options: ['The patient is asleep', 'Penicillin allergy', 'The dose looks large'],
        correct: 1,
        wrongNote: 'The reason pharmacy needs is the allergy family.'
      })
    ]
  };
}

function sensorCase() {
  return {
    id: uid(),
    title: 'Pharmacy fridge 2, 9.4°C',
    brief:
      'Valley Health, pharmacy fridge 2. The Slack alert is already with the shift lead. No work order is open.',
    picture: 'facility',
    result: 'Stock is moved and the excursion is on a work order. Passed.',
    steps: [
      step('choose', {
        prompt: 'First action',
        options: [
          'Silence the Slack alert',
          'Move the vaccines and open a work order',
          'Wait for the next reading'
        ],
        correct: 1,
        wrongNote: '9.4°C is already above 8°C. The stock should not stay in that fridge.'
      }),
      step('tap', {
        prompt: 'Which unit is in excursion?',
        correct: 'pharmacy',
        wrongNote: 'The alert names pharmacy fridge 2, not the break room.'
      }),
      step('fill', {
        prompt: 'Temperature you are documenting',
        correct: '9.4',
        wrongNote: 'Document the reading on the alert, 9.4°C.'
      })
    ]
  };
}

function makeCourse(id, simulation) {
  const meta = COURSE_META[id];
  return {
    id,
    title: meta.title,
    person: meta.person,
    help: meta.help,
    quotaHint: meta.quota,
    nameHint: meta.nameHint,
    sections: meta.sections.map((section) => ({
      title: section.title,
      lessons: section.lessons.map((lesson) => ({ ...lesson, id: uid() }))
    })),
    practice: meta.practice,
    simulation
  };
}

function boot() {
  if (MODE === 'learn') {
    courses.tax = makeCourse('tax', {
      name: 'Tax form practice',
      quota: 100,
      passedBefore: 13,
      cases: [taxCase()]
    });
    courses.medical = makeCourse('medical', {
      name: 'Medication hold practice',
      quota: 12,
      passedBefore: 2,
      cases: [medicalCase()]
    });
    courses.sensor = makeCourse('sensor', {
      name: 'Excursion on call',
      quota: 8,
      passedBefore: 1,
      cases: [sensorCase()]
    });
    return;
  }

  courses.tax = makeCourse('tax', null);
  courses.medical = makeCourse('medical', null);
  courses.sensor = makeCourse('sensor', null);
}

function course() {
  return courses[state.courseId];
}

function icon(name) {
  const paths = {
    lesson: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    exercise:
      '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    sim: '<path d="M4 7h16v10H4z"/><path d="M8 7V5h8v2"/><path d="M9 12h6"/>'
  };
  return `<svg class="icon ${name === 'sim' ? 'sim-mark' : ''}" viewBox="0 0 24 24">${paths[name]}</svg>`;
}

function shell(main) {
  const current = course();
  const [name, role, initials] = current.person;
  const links = ['tax', 'medical', 'sensor']
    .map((id) => {
      const active = id === state.courseId ? ' active' : '';
      return `<button class="nav-item${active}" data-action="course" data-id="${id}">${esc(COURSE_META[id].title)}</button>`;
    })
    .join('');

  return `<form autocomplete="off" onsubmit="return false"><div class="app">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">C</div><div class="brand-name">ClassroomIO</div></div>
      <div class="nav-label">Courses</div>
      <div class="course-switch">${links}</div>
      <div class="sidebar-foot">
        <div class="avatar">${esc(initials)}</div>
        <div class="who"><div class="nm">${esc(name)}</div><div class="rl">${esc(role)}</div></div>
      </div>
    </aside>
    <div class="main">${main}</div>
  </div>${state.modal ? modalHtml() : ''}</form>`;
}

function header(label) {
  return `<header class="chead">
    <span class="label-here">${esc(label)}</span>
    <span class="spacer"></span>
    <span class="badge">${MODE === 'learn' ? 'Learner' : 'Author'}</span>
  </header>`;
}

function outlineHtml() {
  const current = course();
  const lessonCount = current.sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const sections = current.sections
    .map((section) => {
      const rows = section.lessons
        .map(
          (lesson) =>
            `<button class="row" data-action="lesson" data-id="${lesson.id}">${icon('lesson')}<span>${esc(lesson.title)}</span></button>`
        )
        .join('');
      return `<div class="section"><div class="section-h">${esc(section.title)}<span class="count">${section.lessons.length} lessons</span></div>${rows}</div>`;
    })
    .join('');

  let practiceRow = '';
  if (current.simulation) {
    const sim = current.simulation;
    const meta =
      MODE === 'learn'
        ? `Case ${sim.passedBefore + 1} of ${sim.quota}`
        : `Pass ${sim.quota} cases · ${sim.cases.length} in the bank`;
    practiceRow = `<button class="row" data-action="open-sim">${icon('sim')}<span>${esc(sim.name)}</span><span class="meta">${esc(meta)}</span></button>`;
  }

  const add =
    MODE === 'author'
      ? `<div style="margin-top:10px"><button class="btn btn-primary btn-sm" data-action="add">Add content</button></div>`
      : '';

  return `${header('Content')}
    <div class="page">
      <div class="page-head">
        <div>
          <h1>${esc(current.title)}</h1>
          <p>${lessonCount} lessons${current.simulation ? ' · 1 simulation' : ''}</p>
        </div>
      </div>
      ${sections}
      <div class="section">
        <div class="section-h">${esc(current.practice)}<span class="count">${current.simulation ? '1 simulation' : 'Empty'}</span></div>
        ${practiceRow}
        ${add}
      </div>
    </div>`;
}

function lessonHtml() {
  const lesson = state.lesson;
  return `${header('Lesson')}
    <div class="page">
      <button class="btn btn-ghost btn-sm back" data-action="outline">Back to content</button>
      <h1 style="margin:0 0 12px;font-size:22px;letter-spacing:-.03em">${esc(lesson.title)}</h1>
      <p class="lesson-body">${esc(lesson.body)}</p>
    </div>`;
}

function modalHtml() {
  const current = course();
  if (state.modal === 'setup') {
    const isSim = state.addType === 'simulation';
    const title =
      state.addType === 'lesson' ? 'New lesson' : state.addType === 'exercise' ? 'New exercise' : state.addType === 'section' ? 'New section' : 'New simulation';
    return `<div class="overlay"><div class="modal" role="dialog" aria-label="${title}">
      <h2>${title}</h2>
      <p class="lede">${isSim ? 'A simulation is a queue of cases. Each case is one situation the learner works through.' : 'It is added to this course beside the other content.'}</p>
      <div class="field"><label for="setup-name">Name</label>
        <input id="setup-name" data-field="setup-name" placeholder="${esc(isSim ? current.nameHint : 'Name')}" value="${esc(state.setup.name)}" />
      </div>
      ${
        isSim
          ? `<div class="field"><label for="setup-quota">Cases a learner must pass</label>
        <input id="setup-quota" data-field="setup-quota" inputmode="numeric" placeholder="${esc(current.quotaHint)}" value="${esc(state.setup.quota)}" />
      </div><p class="help">${esc(current.help)}</p>`
          : ''
      }
      <div class="modal-actions">
        <button class="btn btn-outline" data-action="close-modal">Cancel</button>
        <button class="btn btn-primary" data-action="create-content" ${state.setup.name.trim() ? '' : 'disabled'}>${isSim ? 'Create simulation' : 'Add'}</button>
      </div>
    </div></div>`;
  }

  const cards = [
    ['section', 'Section', 'A group of lessons and practice'],
    ['lesson', 'Lesson', 'Reading the learner does first'],
    ['exercise', 'Exercise', 'Questions and a score'],
    ['simulation', 'Simulation', 'A job the learner practices, one case at a time, until they pass enough']
  ]
    .map(([id, title, body]) => {
      const selected = state.addType === id ? ' selected' : '';
      return `<button class="type-card${selected}" data-action="pick-type" data-id="${id}"><strong>${title}</strong><span>${body}</span></button>`;
    })
    .join('');

  return `<div class="overlay"><div class="modal" role="dialog" aria-label="Add content">
    <h2>Add content</h2>
    <p class="lede">Simulation sits in the course with lessons and exercises.</p>
    <div class="type-grid">${cards}</div>
    <div class="modal-actions">
      <button class="btn btn-outline" data-action="close-modal">Cancel</button>
      <button class="btn btn-primary" data-action="continue-add">Continue</button>
    </div>
  </div></div>`;
}

function boardHtml() {
  const sim = course().simulation;
  const cards = sim.cases
    .map((item, index) => {
      return `<div style="display:flex;gap:8px;align-items:stretch">
        <button class="case-card" data-action="edit-case" data-id="${item.id}" style="flex:1">
          <div><strong>Case ${index + 1} · ${esc(item.title)}</strong><span>${item.steps.length} steps · ${esc(PICTURES[item.picture].label)}</span></div>
        </button>
        <button class="btn btn-outline" data-action="duplicate" data-id="${item.id}">Duplicate</button>
      </div>`;
    })
    .join('');

  const body = sim.cases.length
    ? `<div class="cards">${cards}</div>`
    : `<div class="empty-board"><h2>No cases yet</h2><p>A case is one situation, a few steps, and a result. Duplicate a case to grow the bank.</p><button class="btn btn-primary" data-action="new-case">New case</button></div>`;

  return `${header(sim.name)}
    <div class="page">
      <button class="btn btn-ghost btn-sm back" data-action="outline">Back to content</button>
      <div class="page-head">
        <div>
          <h1>${esc(sim.name)}</h1>
          <p>Learners pass ${sim.quota} unique cases. ${sim.cases.length} in the bank.</p>
        </div>
        ${sim.cases.length ? '<button class="btn btn-primary" data-action="new-case">New case</button>' : ''}
      </div>
      ${body}
    </div>`;
}

function picturePicker(selected) {
  return Object.entries(PICTURES)
    .map(([id, picture]) => {
      const on = id === selected ? ' selected' : '';
      return `<button class="pic${on}" data-action="picture" data-id="${id}">
        <div class="thumb"><i class="on"></i><i></i><i style="width:${id === 'facility' ? '40%' : '55%'}"></i></div>
        <span>${esc(picture.label)}</span>
      </button>`;
    })
    .join('');
}

function regionButtons(pictureId, selected, stepId) {
  return PICTURES[pictureId].regions
    .map((region) => {
      const on = region.id === selected ? ' correct' : '';
      return `<button class="region${on}" data-action="region" data-step="${stepId}" data-id="${region.id}">${esc(region.label)}</button>`;
    })
    .join('');
}

function stepCard(item, index) {
  const kindLabel = item.kind === 'choose' ? 'Choose' : item.kind === 'fill' ? 'Fill a value' : 'Tap the picture';
  let body = '';
  if (item.kind === 'choose') {
    body = item.options
      .map((option, optionIndex) => {
        return `<div class="option-line">
          <label class="right-mark"><input type="radio" name="correct-${item.id}" data-action="correct-option" data-step="${item.id}" data-index="${optionIndex}" ${item.correct === optionIndex ? 'checked' : ''} /> Right</label>
          <input data-field="option" data-step="${item.id}" data-index="${optionIndex}" placeholder="Option ${optionIndex + 1}" value="${esc(option)}" />
        </div>`;
      })
      .join('');
    body = `<label>Options. Mark the right one.</label>${body}`;
  } else if (item.kind === 'fill') {
    body = `<div class="field"><label>Value that passes</label><input data-field="correct" data-step="${item.id}" name="correct-${item.id}" autocomplete="off" value="${esc(item.correct)}" placeholder="The value that passes" /></div>`;
  } else {
    body = `<label>Click the right spot on the picture.</label><div class="regions">${regionButtons(state.draft.picture, item.correct, item.id)}</div>`;
  }

  return `<div class="step-card">
    <div class="step-top"><span>Step ${index + 1} · ${kindLabel}</span>
      <button class="btn btn-ghost btn-sm" data-action="remove-step" data-id="${item.id}" style="margin-left:auto">Remove</button>
    </div>
    <div class="field"><label>What the learner does</label>
      <input data-field="prompt" data-step="${item.id}" value="${esc(item.prompt)}" placeholder="Filing status" />
    </div>
    ${body}
    <div class="field"><label>If they get it wrong</label>
      <input data-field="wrong" data-step="${item.id}" value="${esc(item.wrongNote)}" placeholder="One line they see, then they try again" />
    </div>
  </div>`;
}

function draftProblems(draft) {
  if (!draft.title.trim()) return 'Name the case.';
  if (!draft.brief.trim()) return 'Write the situation.';
  if (!draft.result.trim()) return 'Write the line they see when they pass.';
  if (!draft.steps.length) return 'Add at least one step.';
  for (let index = 0; index < draft.steps.length; index += 1) {
    const item = draft.steps[index];
    const label = `Step ${index + 1}`;
    if (!item.prompt.trim()) return `${label} needs a prompt.`;
    if (item.kind === 'choose') {
      const filled = item.options.map((option) => option.trim()).filter(Boolean);
      if (filled.length < 2) return `${label} needs two options.`;
      if (!String(item.options[item.correct] || '').trim()) return `${label} needs the correct option filled in.`;
    }
    if (item.kind === 'fill' && !String(item.correct).trim()) return `${label} needs the value that passes.`;
    if (item.kind === 'tap' && !item.correct) return `${label} needs a spot on the picture.`;
  }
  return '';
}

function editorHtml() {
  const draft = state.draft;
  const problem = draftProblems(draft);
  const steps = draft.steps.map(stepCard).join('');
  const stepBody = steps || '<div class="steps-empty">No steps yet. Add what the learner does, in order.</div>';

  return `${header('Case')}
    <div class="page">
      <button class="btn btn-ghost btn-sm back" data-action="board">Back to cases</button>
      <div class="band">
        <h2>1. The situation</h2>
        <p class="lede">A few sentences and the picture of the workplace.</p>
        <div class="field"><label>Case name</label>
          <input data-field="title" name="title-${draft.id}" autocomplete="off" value="${esc(draft.title)}" placeholder="Name this case" />
        </div>
        <div class="field"><label>What is going on</label>
          <textarea data-field="brief" name="brief-${draft.id}" autocomplete="off" placeholder="What the learner walks into.">${esc(draft.brief)}</textarea>
        </div>
        <div class="pics">${picturePicker(draft.picture)}</div>
      </div>
      <div class="band">
        <h2>2. The steps</h2>
        <p class="lede">Each step is one action. Right moves them on. Wrong shows one line and lets them try again.</p>
        ${stepBody}
        <div class="kind-row">
          <button class="btn btn-outline btn-sm" data-action="add-step" data-kind="choose">Add a choice</button>
          <button class="btn btn-outline btn-sm" data-action="add-step" data-kind="fill">Add a value to fill</button>
          <button class="btn btn-outline btn-sm" data-action="add-step" data-kind="tap">Add a tap on the picture</button>
        </div>
      </div>
      <div class="band">
        <h2>3. The result</h2>
        <p class="lede">The line they see when the case is passed.</p>
        <div class="field"><label>Passed</label>
          <input data-field="result" name="result-${draft.id}" autocomplete="off" value="${esc(draft.result)}" placeholder="What they see when they pass." />
        </div>
      </div>
      <div class="editor-bar">
        <span class="save-hint">${esc(problem)}</span>
        <span style="display:flex;gap:8px">
          <button class="btn btn-outline" data-action="preview" ${problem ? 'disabled' : ''}>Preview</button>
          <button class="btn btn-primary" data-action="save-case" ${problem ? 'disabled' : ''}>Save case</button>
        </span>
      </div>
    </div>`;
}

function norm(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[$,\s°c]/g, '');
}

function sameValue(given, expected) {
  const left = norm(given);
  const right = norm(expected);
  if (left === right) return true;
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  return left !== '' && right !== '' && !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber) && leftNumber === rightNumber;
}

function answerFor(item) {
  return state.player.answers[item.id];
}

function shownAnswer(item) {
  if (!item || answerFor(item) === undefined || answerFor(item) === '') return '';
  if (item.kind === 'choose') return item.options[answerFor(item)] || '';
  return answerFor(item);
}

function taxWorkplace(itemCase, player) {
  const steps = itemCase.steps;
  const index = player.stepIndex;
  const filing = shownAnswer(steps[0]);
  const wages = shownAnswer(steps[1]);
  const withheld = shownAnswer(steps[2]);
  const showMath = wages && withheld && index >= 3;
  const math = showMath
    ? `<div class="math">Taxable income $33,250. Tax from the practice table $3,742. Withheld $${esc(withheld)}. Refund is withheld minus tax.</div>`
    : '';

  function field(stepIndex, label, display) {
    const item = steps[stepIndex];
    if (!item) return '';
    const now = index === stepIndex;
    if (item.kind === 'choose' && now) {
      return `<div class="form-row is-now"><span class="lbl">${esc(label)}</span><div class="choices">${item.options
        .map(
          (option, optionIndex) =>
            `<button class="choice is-now" data-action="pick" data-index="${optionIndex}">${esc(option)}</button>`
        )
        .join('')}</div></div>`;
    }
    if (item.kind === 'fill' && now) {
      return `<div class="form-row is-now"><label class="lbl" for="play-answer">${esc(label)}</label>
        <input id="play-answer" data-field="play-answer" value="${esc(player.answer)}" placeholder="Enter the number" /></div>`;
    }
    return `<div class="form-row"><span class="lbl">${esc(label)}</span><div class="locked">${esc(display || '—')}</div></div>`;
  }

  return `<div class="split">
    <div class="paper">
      <div class="k">W-2 · Jordan Hale</div>
      <div class="line"><span>Wages, box 1</span><b>$48,250</b></div>
      <div class="line"><span>Federal tax withheld, box 2</span><b>$6,100</b></div>
      <div class="line"><span>Intake sheet</span><b>Single</b></div>
    </div>
    <div class="paper">
      <div class="k">Practice return</div>
      ${field(0, 'Filing status', filing)}
      ${field(1, 'Wages', wages ? `$${wages}` : '')}
      ${field(2, 'Federal income tax withheld', withheld ? `$${withheld}` : '')}
      ${field(3, 'Refund', shownAnswer(steps[3]) ? `$${shownAnswer(steps[3])}` : '')}
      ${math}
    </div>
  </div>`;
}

function wardWorkplace(itemCase, player) {
  const steps = itemCase.steps;
  const index = player.stepIndex;
  const spots =
    index === 0
      ? `<div class="regions" style="margin-bottom:12px">
      <button class="spot is-now" data-action="tap" data-id="wristband">Wristband · Amina Rahman</button>
      <button class="spot" data-action="tap" data-id="iv">IV pole</button>
      <button class="spot" data-action="tap" data-id="cup">Med cup</button>
    </div>`
      : `<div class="locked" style="margin-bottom:12px">Wristband checked · Amina Rahman, MRN 441290</div>`;

  function choiceStep(stepIndex) {
    const item = steps[stepIndex];
    if (!item) return '';
    if (player.stepIndex !== stepIndex) {
      const picked = item.options[answerFor(item)];
      return picked ? `<div class="form-row"><span class="lbl">${esc(item.prompt)}</span><div class="locked">${esc(picked)}</div></div>` : '';
    }
    return `<div class="form-row is-now"><span class="lbl">${esc(item.prompt)}</span><div class="choices">${item.options
      .map(
        (option, optionIndex) =>
          `<button class="choice is-now" data-action="pick" data-index="${optionIndex}">${esc(option)}</button>`
      )
      .join('')}</div></div>`;
  }

  return `<div class="paper patient">
      <div><div class="k">In the bed</div><strong>Amina Rahman, 68</strong><div class="allergy">Allergy · penicillin</div></div>
      <div class="order"><div class="k">Order due now</div>Amoxicillin 500 mg by mouth</div>
    </div>
    ${spots}
    ${choiceStep(1)}
    ${choiceStep(2)}`;
}

function facilityWorkplace(itemCase, player) {
  const steps = itemCase.steps;
  const index = player.stepIndex;
  const moved = index > 0;
  const choices =
    index === 0
      ? `<div class="choices">${steps[0].options
          .map(
            (option, optionIndex) =>
              `<button class="choice is-now" data-action="pick" data-index="${optionIndex}">${esc(option)}</button>`
          )
          .join('')}</div>`
      : `<div class="locked" style="margin-bottom:12px">${esc(steps[0].options[answerFor(steps[0])])}</div>`;

  const floors =
    index === 1
      ? `<div class="floors">
      <button class="fridge is-now" data-action="tap" data-id="pharmacy">Pharmacy fridge 2<small>Alert attached · 9.4°C</small></button>
      <button class="fridge" data-action="tap" data-id="breakroom">Break room fridge<small>4.6°C · in range</small></button>
    </div>`
      : index > 1
        ? `<div class="locked">Pharmacy fridge 2 marked</div>`
        : '';

  const fill =
    index === 2
      ? `<div class="form-row is-now" style="margin-top:12px"><label class="lbl" for="play-answer">Temperature on the work order</label>
      <input id="play-answer" data-field="play-answer" value="${esc(player.answer)}" placeholder="9.4" /></div>`
      : '';

  const order = moved
    ? `<div class="work-order"><strong>Work order draft</strong><div>MaintainX · Pharmacy fridge 2 · Temperature excursion</div></div>`
    : '';

  return `<div class="alert-banner">
      <div><strong>Pharmacy fridge 2</strong><div>Limit 2–8°C · Slack alert sent · no work order</div></div>
      <div class="temp">9.4°</div>
    </div>
    ${choices}
    ${floors}
    ${order}
    ${fill}`;
}

function workplace(itemCase, player) {
  if (itemCase.picture === 'return') return taxWorkplace(itemCase, player);
  if (itemCase.picture === 'ward') return wardWorkplace(itemCase, player);
  return facilityWorkplace(itemCase, player);
}

function playerHtml() {
  const current = course();
  const sim = current.simulation;
  const itemCase = sim.cases.find((item) => item.id === state.player.caseId);
  const player = state.player;

  if (player.done) {
    const passed = sim.passedBefore;
    return `${header(sim.name)}
      <div class="page"><div class="pass">
        <div class="check"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg></div>
        <h2>Passed</h2>
        <p>${esc(itemCase.result)}</p>
        <p>${passed} of ${sim.quota} cases passed.</p>
        <p>A certificate is issued at ${sim.quota}.</p>
        <button class="btn btn-primary" data-action="outline" style="margin-top:12px">Back to the course</button>
      </div></div>`;
  }

  const item = itemCase.steps[player.stepIndex];
  const feedback = player.feedback
    ? `<div class="note ${player.feedback.ok ? 'good' : 'bad'}">${esc(player.feedback.text)}</div>`
    : '';
  const check =
    item.kind === 'fill'
      ? `<button class="btn btn-primary" data-action="check-fill">Check</button>`
      : '<span></span>';

  return `${header(sim.name)}
    <div class="page">
      <button class="btn btn-ghost btn-sm back" data-action="leave-player">${player.returnTo === 'editor' ? 'Back to editing' : 'Back to the course'}</button>
      <div class="crumb">Case ${sim.passedBefore + 1} of ${sim.quota} · ${esc(itemCase.title)}</div>
      <p class="brief">${esc(itemCase.brief)}</p>
      <div class="step-label">Step ${player.stepIndex + 1} of ${itemCase.steps.length} · ${esc(item.prompt)}</div>
      <div class="workplace">${workplace(itemCase, player)}</div>
      ${feedback}
      <div class="player-bar">${check}</div>
    </div>`;
}

function render() {
  const main =
    state.screen === 'editor'
      ? editorHtml()
      : state.screen === 'board'
        ? boardHtml()
        : state.screen === 'player'
          ? playerHtml()
          : state.screen === 'lesson'
            ? lessonHtml()
            : outlineHtml();
  document.getElementById('root').innerHTML = shell(main);
  document.querySelectorAll('button').forEach((button) => {
    button.type = 'button';
  });
  document.querySelectorAll('input, textarea').forEach((field) => {
    field.setAttribute('autocomplete', 'off');
    field.setAttribute('autocorrect', 'off');
    field.setAttribute('spellcheck', 'false');
  });
}

function findStep(id) {
  return state.draft.steps.find((item) => item.id === id);
}

function openPlayer(caseId, returnTo) {
  state.player = { caseId, stepIndex: 0, answers: {}, answer: '', feedback: null, done: false, returnTo };
  state.screen = 'player';
  render();
}

let advanceTimer = 0;

function succeed(item) {
  const player = state.player;
  player.feedback = { ok: true, text: 'That’s the one.' };
  player.answers[item.id] = item.kind === 'choose' ? item.correct : item.kind === 'tap' ? item.correct : player.answer;
  render();
  clearTimeout(advanceTimer);
  advanceTimer = setTimeout(() => {
    const sim = course().simulation;
    const itemCase = sim.cases.find((entry) => entry.id === player.caseId);
    if (player.stepIndex < itemCase.steps.length - 1) {
      player.stepIndex += 1;
      player.feedback = null;
      player.answer = '';
    } else {
      player.done = true;
      if (!player.counted) {
        sim.passedBefore += 1;
        player.counted = true;
      }
    }
    render();
  }, 650);
}

function fail(item) {
  state.player.feedback = { ok: false, text: item.wrongNote || 'Try that step again.' };
  render();
}

function onClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const current = course();

  if (action === 'course') {
    state.courseId = target.dataset.id;
    state.screen = 'outline';
    state.modal = null;
    state.draft = null;
    state.player = null;
    render();
    return;
  }
  if (action === 'outline' || action === 'close-modal') {
    state.modal = null;
    if (action === 'outline') {
      state.screen = 'outline';
      state.player = null;
    }
    render();
    return;
  }
  if (action === 'lesson') {
    const lesson = current.sections.flatMap((section) => section.lessons).find((item) => item.id === target.dataset.id);
    state.lesson = lesson;
    state.screen = 'lesson';
    render();
    return;
  }
  if (action === 'add') {
    state.modal = 'add';
    state.addType = 'simulation';
    render();
    return;
  }
  if (action === 'pick-type') {
    state.addType = target.dataset.id;
    render();
    return;
  }
  if (action === 'continue-add') {
    if (state.addType === 'simulation' && current.simulation) {
      state.modal = null;
      state.screen = 'board';
      render();
      return;
    }
    state.setup = { name: '', quota: state.addType === 'simulation' ? current.quotaHint : '' };
    state.modal = 'setup';
    render();
    const input = document.getElementById('setup-name');
    if (input) input.focus();
    return;
  }
  if (action === 'create-content') {
    const name = state.setup.name.trim();
    if (!name) return;
    if (state.addType === 'simulation') {
      const quota = Number(state.setup.quota || current.quotaHint);
      current.simulation = {
        name,
        quota: Number.isFinite(quota) && quota > 0 ? quota : Number(current.quotaHint),
        passedBefore: 0,
        cases: []
      };
      state.modal = null;
      state.screen = 'board';
      render();
      return;
    }
    if (state.addType === 'section') {
      current.sections.push({ title: name, lessons: [] });
    } else if (state.addType === 'lesson') {
      current.sections[0].lessons.push({ id: uid(), title: name, body: 'A short reading for this course.' });
    } else if (state.addType === 'exercise') {
      current.sections[0].lessons.push({
        id: uid(),
        title: name,
        body: 'An exercise scores answers. A simulation is the practice beside it, one case at a time.'
      });
    }
    state.modal = null;
    state.screen = 'outline';
    render();
    return;
  }
  if (action === 'open-sim') {
    if (MODE === 'learn') {
      openPlayer(current.simulation.cases[0].id, 'outline');
      return;
    }
    state.screen = 'board';
    render();
    return;
  }
  if (action === 'new-case') {
    state.draft = {
      id: uid(),
      title: '',
      brief: '',
      picture: state.courseId === 'medical' ? 'ward' : state.courseId === 'sensor' ? 'facility' : 'return',
      result: '',
      steps: [],
      isNew: true
    };
    state.screen = 'editor';
    render();
    return;
  }
  if (action === 'edit-case') {
    const found = current.simulation.cases.find((item) => item.id === target.dataset.id);
    state.draft = JSON.parse(JSON.stringify(found));
    state.draft.isNew = false;
    state.screen = 'editor';
    render();
    return;
  }
  if (action === 'duplicate') {
    const found = current.simulation.cases.find((item) => item.id === target.dataset.id);
    const copy = JSON.parse(JSON.stringify(found));
    copy.id = uid();
    copy.title = `Copy of ${found.title}`;
    copy.steps.forEach((item) => {
      item.id = uid();
    });
    current.simulation.cases.push(copy);
    render();
    return;
  }
  if (action === 'board') {
    state.screen = 'board';
    state.draft = null;
    render();
    return;
  }
  if (action === 'picture') {
    state.draft.picture = target.dataset.id;
    state.draft.steps.forEach((item) => {
      if (item.kind === 'tap') item.correct = '';
    });
    render();
    return;
  }
  if (action === 'add-step') {
    const item = step(target.dataset.kind);
    if (item.kind === 'tap') item.correct = '';
    state.draft.steps.push(item);
    render();
    return;
  }
  if (action === 'remove-step') {
    state.draft.steps = state.draft.steps.filter((item) => item.id !== target.dataset.id);
    render();
    return;
  }
  if (action === 'correct-option') {
    const item = findStep(target.dataset.step);
    item.correct = Number(target.dataset.index);
    return;
  }
  if (action === 'region') {
    const item = findStep(target.dataset.step);
    if (item) item.correct = target.dataset.id;
    render();
    return;
  }
  if (action === 'save-case') {
    if (draftProblems(state.draft)) return;
    const saved = JSON.parse(JSON.stringify(state.draft));
    delete saved.isNew;
    const list = current.simulation.cases;
    const index = list.findIndex((item) => item.id === saved.id);
    if (index >= 0) list[index] = saved;
    else list.push(saved);
    state.draft = null;
    state.screen = 'board';
    render();
    return;
  }
  if (action === 'preview') {
    if (draftProblems(state.draft)) return;
    const saved = JSON.parse(JSON.stringify(state.draft));
    delete saved.isNew;
    const list = current.simulation.cases;
    const index = list.findIndex((item) => item.id === saved.id);
    if (index >= 0) list[index] = saved;
    else list.push(saved);
    state.draft.isNew = false;
    openPlayer(saved.id, 'editor');
    return;
  }
  if (action === 'leave-player') {
    clearTimeout(advanceTimer);
    const returnTo = state.player.returnTo;
    state.player = null;
    state.screen = returnTo === 'editor' ? 'editor' : 'outline';
    render();
    return;
  }
  if (action === 'pick') {
    const itemCase = current.simulation.cases.find((item) => item.id === state.player.caseId);
    const item = itemCase.steps[state.player.stepIndex];
    if (item.kind !== 'choose' || state.player.feedback?.ok) return;
    const picked = Number(target.dataset.index);
    if (picked === item.correct) succeed(item);
    else fail(item);
    return;
  }
  if (action === 'tap') {
    const itemCase = current.simulation.cases.find((item) => item.id === state.player.caseId);
    const item = itemCase.steps[state.player.stepIndex];
    if (item.kind !== 'tap' || state.player.feedback?.ok) return;
    if (target.dataset.id === item.correct) succeed(item);
    else fail(item);
    return;
  }
  if (action === 'check-fill') {
    const itemCase = current.simulation.cases.find((item) => item.id === state.player.caseId);
    const item = itemCase.steps[state.player.stepIndex];
    if (item.kind !== 'fill' || state.player.feedback?.ok) return;
    const typed = document.getElementById('play-answer');
    if (typed) state.player.answer = typed.value;
    if (sameValue(state.player.answer, item.correct)) succeed(item);
    else fail(item);
  }
}

function onInput(event) {
  const field = event.target.dataset.field;
  if (!field) return;
  if (field === 'setup-name') state.setup.name = event.target.value;
  if (field === 'setup-quota') state.setup.quota = event.target.value;
  if (field === 'play-answer') state.player.answer = event.target.value;
  if (field === 'title') state.draft.title = event.target.value;
  if (field === 'brief') state.draft.brief = event.target.value;
  if (field === 'result') state.draft.result = event.target.value;
  if (field === 'prompt') findStep(event.target.dataset.step).prompt = event.target.value;
  if (field === 'wrong') findStep(event.target.dataset.step).wrongNote = event.target.value;
  if (field === 'correct') findStep(event.target.dataset.step).correct = event.target.value;
  if (field === 'option') findStep(event.target.dataset.step).options[Number(event.target.dataset.index)] = event.target.value;

  if (field === 'setup-name' || field === 'title' || field === 'brief' || field === 'result' || field === 'prompt' || field === 'correct' || field === 'option' || field === 'wrong') {
    const hint = document.querySelector('.save-hint');
    const create = document.querySelector('[data-action="create-content"]');
    if (state.screen === 'editor' && state.draft && hint) hint.textContent = draftProblems(state.draft);
    const problem = state.screen === 'editor' && state.draft ? draftProblems(state.draft) : 'x';
    document.querySelectorAll('[data-action="save-case"], [data-action="preview"]').forEach((button) => {
      button.disabled = Boolean(problem);
    });
    if (create) create.disabled = !state.setup.name.trim();
  }
}

document.addEventListener('click', onClick);
document.addEventListener('input', onInput);

boot();
render();
