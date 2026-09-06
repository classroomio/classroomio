/*
  Learner menu prototype behaviour.

  Stands in for base/popover (bits-ui) + the theme segmented control.
  Only the interactions that matter for review: open/close, escape-to-close,
  outside click, arrow-key roving, and the theme row not closing the panel.
*/

(function () {
  function closeAll(except) {
    document.querySelectorAll('.lm.open').forEach(function (menu) {
      if (menu === except) return;

      menu.classList.remove('open');
      menu.querySelector('.lm-trigger').setAttribute('aria-expanded', 'false');
    });
  }

  function wireMenu(menu) {
    var trigger = menu.querySelector('.lm-trigger');
    var panel = menu.querySelector('.lm-panel');
    if (!trigger || !panel || panel.classList.contains('static')) return;

    if (trigger.getAttribute('aria-disabled') === 'true') {
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
      });
      return;
    }

    trigger.addEventListener('click', function (event) {
      event.stopPropagation();
      var willOpen = !menu.classList.contains('open');
      closeAll(menu);
      menu.classList.toggle('open', willOpen);
      trigger.setAttribute('aria-expanded', String(willOpen));

      if (willOpen) {
        var first = panel.querySelector('.lm-item');
        if (first) first.setAttribute('tabindex', '0');
      }
    });

    panel.addEventListener('click', function (event) {
      // The theme row is a preference control, not a destination — keep the panel open.
      if (event.target.closest('.lm-theme-row')) {
        event.stopPropagation();
        return;
      }
    });

    panel.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

      event.preventDefault();
      var rows = Array.prototype.slice.call(panel.querySelectorAll('.lm-item'));
      var index = rows.indexOf(document.activeElement);
      var next = event.key === 'ArrowDown' ? index + 1 : index - 1;
      if (next < 0) next = rows.length - 1;
      if (next >= rows.length) next = 0;
      rows[next].focus();
    });
  }

  function wireThemeSegments() {
    document.querySelectorAll('.lm-seg').forEach(function (seg) {
      seg.addEventListener('click', function (event) {
        var button = event.target.closest('button');
        if (!button) return;

        seg.querySelectorAll('button').forEach(function (other) {
          other.setAttribute('aria-pressed', String(other === button));
        });
      });
    });
  }

  function wireThemeSwitcher() {
    var select = document.querySelector('[data-proto-theme]');
    if (!select) return;

    select.addEventListener('change', function () {
      document.documentElement.setAttribute('data-landing-theme', select.value);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.lm').forEach(wireMenu);
    wireThemeSegments();
    wireThemeSwitcher();

    document.addEventListener('click', function () {
      closeAll(null);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;

      var open = document.querySelector('.lm.open');
      if (!open) return;

      closeAll(null);
      open.querySelector('.lm-trigger').focus();
    });

    // Pages can request the menu render open on load (the reference screenshot state).
    var autoOpen = document.querySelector('.lm[data-open-on-load]');
    if (autoOpen) {
      autoOpen.classList.add('open');
      autoOpen.querySelector('.lm-trigger').setAttribute('aria-expanded', 'true');
    }
  });
})();
