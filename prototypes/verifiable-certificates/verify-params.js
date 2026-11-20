(function () {
  var q = new URLSearchParams(location.search);
  window.vq = function (key, fallback) {
    return q.get(key) || fallback;
  };
  if (q.get('embed')) document.documentElement.classList.add('embed');
  window.applyVerifyParams = function () {
    var set = function (sel, text, all) {
      var el = document.querySelector(sel);
      if (el && text) el.textContent = text;
    };
    set('.vp-hero .name', q.get('name'));
    set('.vp-hero .course b', q.get('course'));
    set('.vp-code', q.get('code'));
    var dds = document.querySelectorAll('.vp-dl dd');
    if (dds[0] && q.get('issued')) dds[0].textContent = q.get('issued');
    if (dds[1] && q.get('date')) dds[1].textContent = q.get('date');
    var h1 = document.querySelector('.vp-status h1');
    if (h1 && q.get('date')) {
      if (/^Expired/.test(h1.textContent)) h1.textContent = 'Expired on ' + q.get('date');
      if (/^Revoked/.test(h1.textContent)) h1.textContent = 'Revoked on ' + q.get('date');
    }
  };
})();
