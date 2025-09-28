import Button from './PrimaryButton.svelte';
import type { Component } from 'svelte';
import CoursesPage from './pages/Courses.svelte';
import Footer from './Footer.svelte';
import HomePage from './pages/Home.svelte';
import Navigation from './Navigation.svelte';
import type { TemplateComponents } from '$lib/utils/types/template';

export const components: TemplateComponents = {
  navigation: Navigation as unknown as Component,
  footer: Footer as unknown as Component,
  button: Button as unknown as Component,
  coursespage: CoursesPage as unknown as Component,
  homepage: HomePage as unknown as Component
};

export const utils = {
  fontLink: 'https://fonts.googleapis.com/css2?family=Cal+Sans&display=swap'
};
