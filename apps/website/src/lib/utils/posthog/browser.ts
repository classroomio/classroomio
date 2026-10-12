import posthog from 'posthog-js';
import { POSTHOG_HOST, POSTHOG_KEY, POSTHOG_UI_HOST } from './constants';

export function initPosthog(): void {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: POSTHOG_UI_HOST,
    cross_subdomain_cookie: true,
    person_profiles: 'identified_only',
    session_recording: { maskAllInputs: true }
  });
}
