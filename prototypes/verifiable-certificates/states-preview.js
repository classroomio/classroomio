(function () {
  var SAMPLE = {
    valid: { name: 'Ada Okafor', code: '7KQM-4XH2', issued: 'January 28, 2026', date: 'January 28, 2028' },
    expired: { name: 'Tunde Bello', code: 'R9TD-W3FN', issued: 'March 5, 2024', date: 'March 4, 2026' },
    revoked: { name: 'Chidi Eze', code: 'B6ZC-P8VG', issued: 'June 11, 2026', date: 'October 2, 2026' }
  };
  var COPY = {
    valid: [
      'Valid',
      'Shown when the certificate is in date and has not been revoked. This is what a scan of the QR code normally returns.'
    ],
    expired: [
      'Expired',
      'Shown after the validity period ends. The certificate image is dimmed and stamped. The learner can still download it.'
    ],
    revoked: [
      'Revoked',
      'Shown when an admin revokes it. The image is greyed and stamped, and the reason is never shown to the public.'
    ]
  };
  var FRAME_W = 1100,
    FRAME_H = 760;

  window.verifyFrame = function (state, data) {
    var d = Object.assign({}, SAMPLE[state], data || {});
    var qs = ['embed=1'];
    ['name', 'code', 'issued', 'date', 'course'].forEach(function (k) {
      if (d[k]) qs.push(k + '=' + encodeURIComponent(d[k]));
    });
    return (
      '<div class="vf"><iframe title="Public page preview" src="verify-' +
      state +
      '.html?' +
      qs.join('&') +
      '" width="' +
      FRAME_W +
      '" height="' +
      FRAME_H +
      '" loading="lazy"></iframe></div>'
    );
  };
  window.fitFrames = function (root) {
    (root || document).querySelectorAll('.vf').forEach(function (vf) {
      var scale = vf.clientWidth / FRAME_W;
      vf.style.height = Math.round(FRAME_H * scale) + 'px';
      vf.firstElementChild.style.transform = 'scale(' + scale + ')';
    });
  };
  window.addEventListener('resize', function () {
    window.fitFrames();
  });

  var built = false,
    current = 'valid';
  function build() {
    if (built) return;
    built = true;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="overlay" id="spOverlay"></div>' +
      '<div class="dialog sp-dialog" id="spDialog" role="dialog" aria-modal="true" aria-labelledby="spTitle">' +
      '<div class="sp-actions"><button class="icon-btn" id="spOpen" type="button" aria-label="Open full page" title="Open full page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></button><button class="icon-btn" id="spClose" type="button" aria-label="Close" title="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>' +
      '<div class="dialog-head sp-head"><h2 id="spTitle">How the public page looks</h2><p>This is what anyone sees after scanning the QR code or opening the link. Sample learners, not real data.</p></div>' +
      '<div class="dialog-body"><div class="sp-tabs" role="tablist" id="spTabs"></div><div id="spNote" class="sp-note"></div><div id="spFrame"></div></div>' +
      '</div>';
    document.body.appendChild(wrap);
    document.getElementById('spTabs').innerHTML = ['valid', 'expired', 'revoked']
      .map(function (s) {
        return (
          '<button type="button" role="tab" class="sp-tab sp-' +
          s +
          '" data-s="' +
          s +
          '"><span class="sp-dot"></span>' +
          COPY[s][0] +
          '</button>'
        );
      })
      .join('');
    document.getElementById('spTabs').onclick = function (e) {
      var b = e.target.closest('[data-s]');
      if (b) show(b.getAttribute('data-s'));
    };
    document.getElementById('spOverlay').onclick = close;
    document.getElementById('spClose').onclick = close;
    document.getElementById('spOpen').onclick = function () {
      window.open('verify-' + current + '.html', '_blank');
    };
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }
  function show(state) {
    current = state;
    document.querySelectorAll('#spTabs .sp-tab').forEach(function (t) {
      var on = t.getAttribute('data-s') === state;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on);
    });
    document.getElementById('spNote').textContent = COPY[state][1];
    document.getElementById('spFrame').innerHTML = window.verifyFrame(state);
    window.fitFrames(document.getElementById('spFrame'));
  }
  function close() {
    document.getElementById('spOverlay').classList.remove('open');
    document.getElementById('spDialog').classList.remove('open');
  }
  window.openStatesPreview = function (state) {
    build();
    document.getElementById('spOverlay').classList.add('open');
    document.getElementById('spDialog').classList.add('open');
    show(state || 'valid');
  };
})();
