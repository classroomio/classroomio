import type { Component } from 'svelte';
import CoursesPage from './pages/Courses.svelte';
import HomePage from './pages/Home.svelte';
import Navigation from './Navigation.svelte';
import Footer from './Footer.svelte';
import Button from './PrimaryButton.svelte';
import type { TemplateComponents } from '$lib/utils/types/template';

export const components: TemplateComponents = {
  navigation: Navigation as unknown as Component,
  footer: Footer as unknown as Component,
  button: Button as unknown as Component,
  coursespage: CoursesPage as unknown as Component,
  homepage: HomePage as unknown as Component
};
