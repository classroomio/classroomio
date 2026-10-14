document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-menu]');
  document.querySelectorAll('.menu.open').forEach((menu) => {
    if (!trigger || !menu.contains(trigger)) menu.classList.remove('open');
  });
  if (trigger) trigger.closest('.menu').classList.toggle('open');

  if (event.target.closest('[data-theme]')) document.documentElement.classList.toggle('dark');
});
