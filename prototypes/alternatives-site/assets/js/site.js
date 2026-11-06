(function () {
  var triggers = document.querySelectorAll('[data-menu]');

  function closeMenus(except) {
    triggers.forEach(function (trigger) {
      if (trigger === except) return;
      trigger.setAttribute('aria-expanded', 'false');
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (panel) panel.classList.remove('open');
    });
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener('click', function (event) {
      event.stopPropagation();
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      var willOpen = trigger.getAttribute('aria-expanded') !== 'true';
      closeMenus(trigger);
      trigger.setAttribute('aria-expanded', String(willOpen));
      panel.classList.toggle('open', willOpen);
    });
  });

  document.addEventListener('click', function () {
    closeMenus(null);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMenus(null);
  });

  var burger = document.querySelector('[data-burger]');
  var mobileNav = document.getElementById('mobile-nav');
  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var willOpen = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(willOpen));
      mobileNav.classList.toggle('open', willOpen);
    });
  }

  document.querySelectorAll('.faq-item').forEach(function (item) {
    var button = item.querySelector('.faq-q');
    button.addEventListener('click', function () {
      var willOpen = !item.classList.contains('open');
      item.classList.toggle('open', willOpen);
      button.setAttribute('aria-expanded', String(willOpen));
    });
  });

  document.querySelectorAll('[data-proto-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var done = form.querySelector('.form-done');
      if (done) done.classList.add('show');
    });
  });
})();
