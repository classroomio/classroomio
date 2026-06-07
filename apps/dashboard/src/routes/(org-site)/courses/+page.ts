import { normalizeLandingPageSettings, importThemeBundle } from '$features/org/utils/landing-page';

export const load = async ({ data }) => {
  const settings = normalizeLandingPageSettings(data.org?.landingpage);
  const bundle = await importThemeBundle(settings.theme);

  return {
    ...data,
    theme: {
      Nav: bundle.nav,
      Hero: bundle.hero,
      CourseCard: bundle.courseCard,
      coursesGridClass: bundle.coursesGridClass
    }
  };
};
