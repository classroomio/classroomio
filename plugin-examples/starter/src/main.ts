import '@classroomio/plugin-design/tokens.css';
import '@classroomio/plugin-design/components.css';
import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('app');
if (target) {
  mount(App, { target });
}
