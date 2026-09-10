// zap-builder.js: step logic for the Zap builder wizard prototype.
// Trigger/app/action data comes from apps-catalog.js (window.ZI) so the
// directory, app-detail pages, and this builder never drift out of sync.

(function () {
  var TRIGGERS = ZI.TRIGGERS;
  var SAMPLE_VALUES = ZI.SAMPLE_VALUES;
  var APPS = ZI.APPS;

  // A curated subset shown as tiles in step 2. The full catalog is reachable
  // via the App Directory, and any app in it works through ?startApp=.
  var FEATURED_APP_SLUGS = [
    'slack',
    'sheets',
    'hubspot',
    'mailchimp',
    'drive',
    'notion',
    'salesforce',
    'teams',
    'zendesk',
    'stripe'
  ];

  var TEMPLATES = {
    'completed-slack': { trigger: 'course_completed', app: 'slack', name: 'Course completed → Slack notification' },
    'certificate-drive': { trigger: 'certificate_issued', app: 'drive', name: 'Certificate issued → Save to Drive' },
    'payment-hubspot': { trigger: 'payment_request', app: 'hubspot', name: 'Payment request → HubSpot deal' },
    'enrolled-mailchimp': { trigger: 'student_enrolled', app: 'mailchimp', name: 'Student enrolled → Mailchimp' }
  };

  var params = new URLSearchParams(location.search);
  var templateKey = params.get('template');
  var startApp = params.get('startApp');

  if (templateKey === 'crm-enroll') {
    document.getElementById('wizardView').hidden = true;
    document.getElementById('handoffView').hidden = false;
    return;
  }

  var state = {
    step: 1,
    trigger: null,
    app: null,
    lastFocusedInput: null,
    triggerTested: false
  };

  var template = templateKey && TEMPLATES[templateKey] ? TEMPLATES[templateKey] : null;

  // ---------- render: trigger picker (step 1) ----------
  var triggerGrid = document.getElementById('triggerGrid');
  Object.keys(TRIGGERS).forEach(function (key) {
    var trig = TRIGGERS[key];
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'zi-pick-card';
    card.dataset.trigger = key;
    card.innerHTML =
      '<div class="zi-pick-ico">' +
      trig.icon +
      '</div>' +
      '<div class="zi-pick-text"><div class="t">' +
      trig.label +
      '</div><div class="d">' +
      trig.desc +
      '</div></div>' +
      '<div class="zi-pick-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5"/></svg></div>';
    card.addEventListener('click', function () {
      selectTrigger(key);
    });
    triggerGrid.appendChild(card);
  });

  function selectTrigger(key) {
    state.trigger = key;
    state.triggerTested = false;
    triggerGrid.querySelectorAll('.zi-pick-card').forEach(function (el) {
      el.classList.toggle('selected', el.dataset.trigger === key);
    });
    var trig = TRIGGERS[key];
    document.getElementById('triggerConfig').hidden = false;
    document.getElementById('courseFilterRow').hidden = !trig.filters.course;
    document.getElementById('tagFilterRow').hidden = !trig.filters.tag;
    document.getElementById('step1Continue').disabled = false;

    // If an app was already chosen (via ?startApp=, before any trigger was
    // picked), its "insert data from..." pills couldn't be rendered yet.
    // Do it now that we know the trigger.
    if (state.app) {
      document.getElementById('sourceTriggerName').textContent = trig.label;
      renderSourcePills();
    }
  }

  // ---------- render: app picker (step 2) ----------
  var appGrid = document.getElementById('appGrid');
  var appSlugsForGrid = FEATURED_APP_SLUGS.slice();
  if (startApp && APPS[startApp] && appSlugsForGrid.indexOf(startApp) === -1) {
    appSlugsForGrid.unshift(startApp);
  }
  appSlugsForGrid.forEach(function (key) {
    var app = APPS[key];
    var tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'zi-app-tile';
    tile.dataset.app = key;
    tile.innerHTML = ZI.badgeHTML(key) + '<span>' + app.name + '</span>';
    tile.addEventListener('click', function () {
      selectApp(key);
    });
    appGrid.appendChild(tile);
  });
  var moreTile = document.createElement('a');
  moreTile.className = 'zi-app-tile';
  moreTile.href = 'app-directory.html';
  moreTile.innerHTML =
    '<div class="app-badge" style="background:var(--muted);color:var(--muted-foreground)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width:16px;height:16px;stroke-width:2"><path d="M12 5v14M5 12h14"/></svg></div><span>More apps</span>';
  appGrid.appendChild(moreTile);

  function selectApp(key) {
    state.app = key;
    appGrid.querySelectorAll('.zi-app-tile').forEach(function (el) {
      el.classList.toggle('selected', el.dataset.app === key);
    });
    var app = APPS[key];
    var action = ZI.getAction(key);
    document.getElementById('actionConfig').hidden = false;
    document.getElementById('actionAppBadge').innerHTML = ZI.badgeHTML(key);
    document.getElementById('actionName').textContent = action.label + ' in ' + app.name;
    document.getElementById('step2Continue').disabled = false;
    renderFieldMap(action);

    // The "insert data from…" pills need a trigger to be chosen first. If one
    // already is (template preload, or the user reached step 2 normally),
    // render them now; otherwise selectTrigger() fills this in once it runs.
    if (state.trigger) {
      document.getElementById('sourceTriggerName').textContent = TRIGGERS[state.trigger].label;
      renderSourcePills();
    }
  }

  function renderFieldMap(action) {
    var wrap = document.getElementById('fieldMapRows');
    wrap.innerHTML = '';
    action.fields.forEach(function (field) {
      var row = document.createElement('div');
      row.className = 'zi-map-row';
      if (field.type === 'select') {
        row.innerHTML =
          '<div class="zi-map-label">' +
          field.label +
          '</div>' +
          '<select class="select">' +
          field.options
            .map(function (o) {
              return '<option>' + o + '</option>';
            })
            .join('') +
          '</select>';
      } else {
        row.innerHTML =
          '<div class="zi-map-label">' +
          field.label +
          '</div>' +
          '<div class="zi-map-input"><input type="text" value="' +
          field.default +
          '" data-field="' +
          field.key +
          '" /></div>';
      }
      wrap.appendChild(row);
    });
    wrap.querySelectorAll('.zi-map-input input').forEach(function (input) {
      input.addEventListener('focus', function () {
        state.lastFocusedInput = input;
      });
    });
    var firstInput = wrap.querySelector('.zi-map-input input');
    if (firstInput) state.lastFocusedInput = firstInput;
  }

  function renderSourcePills() {
    var wrap = document.getElementById('sourcePills');
    wrap.innerHTML = '';
    TRIGGERS[state.trigger].fields.forEach(function (fieldName) {
      var pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'zi-pill';
      pill.textContent = fieldName;
      pill.addEventListener('click', function () {
        var target = state.lastFocusedInput || document.querySelector('.zi-map-input input');
        if (!target) return;
        var token = '{{' + fieldName + '}}';
        var pos = target.selectionStart == null ? target.value.length : target.selectionStart;
        target.value = target.value.slice(0, pos) + token + target.value.slice(pos);
        target.focus();
      });
      wrap.appendChild(pill);
    });
  }

  // ---------- step navigation ----------
  var stepBodies = document.querySelectorAll('.zi-step-body');
  var stepperNodes = document.querySelectorAll('#stepperNodes .snode');
  var sbars = document.querySelectorAll('#stepperNodes .sbar');

  function goToStep(n) {
    state.step = n;
    stepBodies.forEach(function (el) {
      el.classList.toggle('active', el.id === 'step' + n);
    });
    stepperNodes.forEach(function (el) {
      var s = Number(el.dataset.step);
      el.classList.toggle('current', s === n);
      el.classList.toggle('done', s < n);
    });
    sbars.forEach(function (el, i) {
      el.classList.toggle('filled', i < n - 1);
    });
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  document.getElementById('step1Continue').addEventListener('click', function () {
    goToStep(2);
  });
  document.getElementById('step2Back').addEventListener('click', function () {
    goToStep(1);
  });
  document.getElementById('step2Continue').addEventListener('click', function () {
    goToStep(3);
  });
  document.getElementById('step3Back').addEventListener('click', function () {
    goToStep(2);
  });
  document.getElementById('step3Continue').addEventListener('click', function () {
    renderReview();
    goToStep(4);
  });
  document.getElementById('step4Back').addEventListener('click', function () {
    goToStep(3);
  });

  // ---------- step 3: test ----------
  document.getElementById('testTriggerBtn').addEventListener('click', function () {
    var box = document.getElementById('testTriggerResult');
    box.className = 'zi-test-result show loading';
    box.innerHTML = '<div class="zi-spinner-sm"></div><span>Looking for a recent matching record…</span>';
    setTimeout(function () {
      var trig = TRIGGERS[state.trigger];
      var rows = trig.fields
        .map(function (f) {
          return '<dt>' + f + '</dt><dd>' + (SAMPLE_VALUES[f] || 'N/A') + '</dd>';
        })
        .join('');
      box.className = 'zi-test-result show success';
      box.innerHTML =
        '<div class="zi-test-result-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5"/></svg>Sample record found</div>' +
        '<dl class="zi-sample-record">' +
        rows +
        '</dl>';
      state.triggerTested = true;
      document.getElementById('step3Continue').disabled = false;
    }, 900);
  });

  function runActionTest(forceFail) {
    var box = document.getElementById('testActionResult');
    var appName = APPS[state.app].name;
    box.className = 'zi-test-result show loading';
    box.innerHTML = '<div class="zi-spinner-sm"></div><span>Sending test to ' + appName + '…</span>';
    setTimeout(function () {
      if (forceFail) {
        box.className = 'zi-test-result show error';
        box.innerHTML =
          '<div class="zi-test-result-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>Test failed</div>' +
          "<div>We couldn't reach " +
          appName +
          '. The connection may have expired.</div>' +
          '<button class="btn btn-outline btn-sm" style="margin-top:10px" id="reconnectBtn" type="button">Reconnect ' +
          appName +
          '</button>';
        var reconnectBtn = document.getElementById('reconnectBtn');
        if (reconnectBtn) {
          reconnectBtn.addEventListener('click', function () {
            runActionTest(false);
          });
        }
      } else {
        box.className = 'zi-test-result show success';
        box.innerHTML =
          '<div class="zi-test-result-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5"/></svg>Test sent</div>' +
          '<div>Delivered to ' +
          appName +
          ' using the sample record above. Check there to confirm it looks right.</div>';
      }
    }, 900);
  }

  document.getElementById('testActionBtn').addEventListener('click', function () {
    runActionTest(false);
  });
  document.getElementById('simulateFail').addEventListener('click', function () {
    runActionTest(true);
  });

  // ---------- step 4: review ----------
  function renderReview() {
    var trig = TRIGGERS[state.trigger];
    var app = APPS[state.app];
    var action = ZI.getAction(state.app);

    document.getElementById('reviewTriggerIco').innerHTML = trig.icon;
    document.getElementById('reviewTriggerIco').style.background = 'var(--primary)';
    document.getElementById('reviewTriggerName').textContent = trig.label;

    var course = document.getElementById('courseFilter')
      ? document.getElementById('courseFilter').value
      : 'All courses';
    var tag = document.getElementById('tagFilter') ? document.getElementById('tagFilter').value : 'Any tag';
    var filterBits = [];
    if (!document.getElementById('courseFilterRow').hidden && course !== 'All courses') filterBits.push(course);
    if (!document.getElementById('tagFilterRow').hidden && tag !== 'Any tag') filterBits.push('tag: ' + tag);
    document.getElementById('reviewTriggerFilters').textContent = filterBits.length
      ? filterBits.join(' · ')
      : 'All courses · any tag';

    document.getElementById('reviewActionIco').innerHTML = ZI.badgeHTML(
      state.app,
      'width:100%;height:100%;border-radius:var(--radius-md)'
    );
    document.getElementById('reviewActionIco').style.background = 'transparent';
    document.getElementById('reviewActionEyebrow').textContent = 'Action · ' + app.name;
    document.getElementById('reviewActionName').textContent = action.label;

    var dataWrap = document.getElementById('reviewDataRows');
    dataWrap.innerHTML = '';
    action.fields.forEach(function (field) {
      var value;
      if (field.type === 'select') {
        var rows = document.querySelectorAll('#fieldMapRows .zi-map-row');
        value = field.options[0];
        rows.forEach(function (row) {
          if (row.querySelector('.zi-map-label').textContent === field.label) {
            var sel = row.querySelector('select');
            if (sel) value = sel.value;
          }
        });
      } else {
        var input = document.querySelector('.zi-map-input input[data-field="' + field.key + '"]');
        value = input ? input.value : field.default;
      }
      var row = document.createElement('div');
      row.className = 'zi-review-data-row';
      row.innerHTML = '<div class="f">' + field.label + '</div><div class="v">' + value + '</div>';
      dataWrap.appendChild(row);
    });

    if (!document.getElementById('courseFilterRow').hidden) {
      var courseRow = document.createElement('div');
      courseRow.className = 'zi-review-data-row';
      courseRow.innerHTML =
        '<div class="f">Only run for</div><div class="v">' +
        course +
        (tag !== 'Any tag' && !document.getElementById('tagFilterRow').hidden ? ' · ' + tag : '') +
        '</div>';
      dataWrap.insertBefore(courseRow, dataWrap.firstChild);
    }
  }

  // ---------- enable ----------
  document.getElementById('enableBtn').addEventListener('click', function () {
    var btn = this;
    btn.disabled = true;
    btn.textContent = 'Turning on…';
    setTimeout(function () {
      var name = document.getElementById('zapName').value || 'Untitled Zap';
      sessionStorage.setItem('ziNewZap', JSON.stringify({ name: name, trigger: state.trigger, app: state.app }));
      window.location.href = 'manage-zaps.html?enabled=1';
    }, 900);
  });

  // ---------- preload from template, or from an app chosen in the directory ----------
  if (template) {
    document.getElementById('zapName').value = template.name;
    selectTrigger(template.trigger);
    selectApp(template.app);
  } else {
    document.getElementById('step1Continue').disabled = true;
    if (startApp && APPS[startApp]) {
      // App was chosen first (via the App Directory / app detail page). Leave
      // the trigger step for the user, but preselect the app for step 2 so
      // it's waiting for them when they get there.
      selectApp(startApp);
      var banner = document.createElement('div');
      banner.className = 'card card-pad';
      banner.style.cssText =
        'display:flex;align-items:center;gap:10px;margin-bottom:16px;border-color:color-mix(in oklab, var(--primary) 25%, var(--border));background:color-mix(in oklab, var(--primary) 5%, transparent)';
      banner.innerHTML =
        ZI.badgeHTML(startApp, 'width:26px;height:26px;font-size:11px') +
        '<div style="font-size:12.5px">Building for <strong>' +
        APPS[startApp].name +
        '</strong>. Pick the ClassroomIO event that should trigger it.</div>';
      document.getElementById('step1').querySelector('.card').prepend(banner);
    }
  }
})();
