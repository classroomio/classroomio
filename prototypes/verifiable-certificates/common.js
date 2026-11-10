(function () {
  var themeBtn = document.getElementById('theme');
  if (themeBtn) {
    themeBtn.onclick = function () {
      var dark = document.documentElement.classList.toggle('dark');
      localStorage.cioTheme = dark ? 'dark' : 'light';
    };
  }

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rng(seed) {
    var s = hash(seed) || 1;
    return function () {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      return s / 4294967296;
    };
  }

  function drawQr(el) {
    var n = 25;
    var rand = rng(el.getAttribute('data-qr') || 'x');
    var cells = [];
    for (var y = 0; y < n; y++) {
      cells[y] = [];
      for (var x = 0; x < n; x++) cells[y][x] = rand() > 0.5;
    }
    function finder(ox, oy) {
      for (var y = -1; y <= 7; y++) {
        for (var x = -1; x <= 7; x++) {
          var yy = oy + y,
            xx = ox + x;
          if (yy < 0 || xx < 0 || yy >= n || xx >= n) continue;
          var edge = x === 0 || x === 6 || y === 0 || y === 6;
          var core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
          cells[yy][xx] = x >= 0 && x <= 6 && y >= 0 && y <= 6 && (edge || core);
        }
      }
    }
    finder(0, 0);
    finder(n - 7, 0);
    finder(0, n - 7);
    var d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (cells[r][c]) d += 'M' + c + ' ' + r + 'h1v1h-1z';
    el.innerHTML =
      '<svg viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges"><path fill="#111" d="' + d + '"/></svg>';
  }

  window.drawAllQr = function (root) {
    (root || document).querySelectorAll('[data-qr]').forEach(drawQr);
  };
  window.drawAllQr();

  window.certHtml = function (o) {
    var esc = function (v) {
      return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    };
    var sig = function (g) {
      return (
        '<div class="cq-sig' +
        (g && g.on ? '' : ' off') +
        '"><div class="n">' +
        esc(g && g.name) +
        '</div><div class="r">' +
        esc(g && g.role) +
        '</div></div>'
      );
    };
    var fields = (o.fields || [])
      .map(function (f) {
        return '<span>' + esc(f[0]) + ' <b>' + esc(f[1]) + '</b></span>';
      })
      .join('');
    var host = o.host || 'learn.acme.com';
    return (
      '<div class="cq' +
      (o.revoked ? ' revoked' : '') +
      '" style="--a:' +
      esc(o.accent || '#7a1f1f') +
      '">' +
      '<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>' +
      '<div class="cq-verify"><div class="qr" data-qr="' +
      esc((o.code || '').replace('-', '')) +
      '"></div><div class="c">' +
      esc(o.code) +
      '</div><div class="l">Verify</div></div>' +
      '<div class="cq-in">' +
      '<div class="cq-org">' +
      esc(o.org) +
      '</div>' +
      '<div class="cq-title">' +
      esc(o.title) +
      '</div>' +
      (o.subtitle ? '<div class="cq-sub">' + esc(o.subtitle) + '</div>' : '') +
      '<div class="cq-certify">— this is to certify that —</div>' +
      '<div class="cq-name">' +
      esc(o.name) +
      '</div>' +
      (o.desc ? '<div class="cq-desc">' + esc(o.desc) + '</div>' : '') +
      (fields ? '<div class="cq-fields">' + fields + '</div>' : '') +
      '<div class="cq-bottom">' +
      sig(o.sig1) +
      '<div class="cq-seal"><span class="st">★</span><span class="y">' +
      esc(o.year || '2026') +
      '</span><span class="no">' +
      esc(o.idText || 'N° 0247') +
      '</span></div>' +
      sig(o.sig2) +
      '</div></div></div>'
    );
  };

  var toast = document.getElementById('toast');
  window.showToast = function (msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(window.__toastT);
    window.__toastT = setTimeout(function () {
      toast.classList.remove('show');
    }, 1800);
  };

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-copy]');
    if (!t) return;
    e.preventDefault();
    var text = t.getAttribute('data-copy');
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {});
    window.showToast('Copied ' + text);
  });

  var sw = document.querySelector('.proto-bar .sw');
  if (sw) {
    sw.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      sw.querySelectorAll('button').forEach(function (x) {
        x.classList.toggle('on', x === b);
      });
      var code = document.querySelector('.proto-bar .url').getAttribute('data-code');
      var host = b.getAttribute('data-host');
      document.querySelector('.proto-bar .url').textContent = 'https://' + host + '/verify' + (code ? '/' + code : '');
      var note = document.querySelector('.proto-bar .note');
      if (note) note.textContent = b.getAttribute('data-note');
    });
  }
})();
