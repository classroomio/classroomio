// proto.js: shared chrome behavior for the Zapier Integration prototype.
// Page-specific interactions (builder steps, consent flow, test states) live
// inline in each page's own <script> block.

(function () {
  var themeBtn = document.getElementById('theme');
  if (themeBtn) {
    themeBtn.onclick = function () {
      var dark = document.documentElement.classList.toggle('dark');
      localStorage.cioTheme = dark ? 'dark' : 'light';
    };
  }

  var appShell = document.querySelector('.app');
  var mobileNavBtn = document.getElementById('mobileNavBtn');
  var mobileBackdrop = document.getElementById('mobileBackdrop');
  if (mobileNavBtn && appShell) {
    mobileNavBtn.addEventListener('click', function () {
      appShell.classList.add('mobile-nav-open');
    });
  }
  if (mobileBackdrop && appShell) {
    mobileBackdrop.addEventListener('click', function () {
      appShell.classList.remove('mobile-nav-open');
    });
  }
})();

// Lightweight toast used across pages (revoke, save, test actions).
function ziToast(message) {
  var el = document.getElementById('ziToast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'zi-toast';
    el.id = 'ziToast';
    el.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6 9 17l-5-5"/></svg><span></span>';
    document.body.appendChild(el);
  }
  el.querySelector('span').textContent = message;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(function () {
    el.classList.remove('show');
  }, 2600);
}
