/*
 * public-courses.js — (org-site)/courses: the academy's public catalog. The page itself is the production
 * catalog (tools/academy-bundle/catalog-page.svelte); this file hands it the published courses and the chrome.
 */
(function () {
  const A = window.academy;
  const S = A.load();
  const root = document.getElementById('site-root');

  document.title = A.T('public_courses.page_title');
  A.paintRoot(root, S);
  A.wireLogout(S);

  window.CioAcademy.catalog(root, {
    ...A.chromeProps(S),
    hero: A.heroOf(S),
    courses: A.publishedCourses(S).map((course) => A.catalogItem(S, course)),
    tagGroups: [],
    perPage: 6
  });

  A.mountEditBar(S, {
    label: 'Viewing as owner',
    actions: [
      { label: 'Edit courses', href: A.M.R.courses() },
      { label: 'Edit page design', href: A.M.R.landingEditor() }
    ]
  });
  A.mountPoweredBy(S);
})();
