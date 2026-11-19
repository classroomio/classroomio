(function () {
  var ORG = 'Acme Academy';
  var ARROW =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var top = document.getElementById('os-top');
  if (top)
    top.outerHTML =
      '<section class="os-hero"><div class="os-nav-wrap"><header class="os-nav">' +
      '<a class="os-brand" href="#"><span class="os-logo">A</span>' +
      ORG +
      '</a>' +
      '<div class="os-right"><nav class="os-links"><a href="#">Courses</a><a href="#">Learning paths</a><a href="#">About</a></nav>' +
      '<a class="os-cta" href="#"><span>Login</span>' +
      ARROW +
      '</a></div></header></div></section>';
  var foot = document.getElementById('os-foot');
  if (foot)
    foot.outerHTML =
      '<footer class="os-foot"><div class="os-foot-in"><div class="os-foot-grid">' +
      '<div><a class="os-brand" href="#"><span class="os-logo">A</span>' +
      ORG +
      '</a><p class="os-tag">Practical food safety training for kitchens and teams.</p></div>' +
      '<div><h3>Learn</h3><ul><li><a href="#">Courses</a></li><li><a href="#">Learning paths</a></li></ul></div>' +
      '<div><h3>Company</h3><ul><li><a href="#">About</a></li><li><a href="#">Contact</a></li></ul></div>' +
      '</div><div class="os-bottom"><p>© 2026 ' +
      ORG +
      '</p><div class="l"><a href="#">Privacy</a><a href="#">Terms</a></div></div></div></footer>';
})();
