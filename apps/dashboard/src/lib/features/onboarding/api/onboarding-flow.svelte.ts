import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { get } from 'svelte/store';
import { ErrorCodes } from '@cio/utils/constants';
import { STARTER_JOB_CONTINUE_AFTER_MS } from '@cio/utils/constants/onboarding';
import { ZOnboardingBusiness, ZOnboardingCustomise, ZOnboardingWorkspace } from '@cio/utils/validation/onboarding';
import {
  BaseApiWithErrors,
  classroomio,
  getRequestBaseUrl,
  hasErrorCode,
  matchesError,
  type NormalizedApiError
} from '$lib/utils/services/api';
import { mapZodErrorsToTranslations } from '$lib/utils/validation/validation';
import { currentOrg } from '$lib/utils/store/org';
import { snackbar } from '$features/ui/snackbar/store';
import { ROUTE } from '$lib/utils/constants/routes';
import { ONBOARDING_SCREEN_ROUTES } from '../utils/constants';
import type {
  OnboardingBusinessDraftInput,
  OnboardingBusinessDraftRequest,
  OnboardingBusinessInput,
  OnboardingBusinessRequest,
  OnboardingCompleteRequest,
  OnboardingCompleteVia,
  OnboardingCustomiseInput,
  OnboardingCustomiseRequest,
  OnboardingSiteNameCheck,
  OnboardingStarterRegenerateRequest,
  OnboardingStarterRequest,
  OnboardingStarterStatus,
  OnboardingStartRequest,
  OnboardingState,
  OnboardingStateRequest,
  OnboardingTourRequest,
  OnboardingTourUpdateInput,
  WelcomeEmailPendingRequest,
  OnboardingWorkspaceInput,
  OnboardingWorkspaceRequest
} from '../utils/types';

const STARTER_POLL_INTERVAL_MS = 2000;

export class OnboardingFlowApi extends BaseApiWithErrors {
  state = $state<OnboardingState | null>(null);
  starter = $state<OnboardingStarterStatus | null>(null);
  siteNameCheck = $state<OnboardingSiteNameCheck | null>(null);
  isCheckingSiteName = $state(false);
  isSaving = $state(false);

  private siteNameRequestId = 0;
  private starterPoll: AbortController | null = null;

  async load() {
    await this.execute<OnboardingStateRequest>({
      requestFn: () => classroomio.onboarding.state.$get(),
      logContext: 'loading onboarding state',
      onSuccess: (result) => {
        this.state = result.data;
        this.syncOrg();
      }
    });
  }

  async goToScreen() {
    if (!this.state) return;

    if (this.state.screen === 'complete') {
      const siteName = this.state.organization?.siteName;

      if (siteName) {
        await goto(resolve(`/org/${siteName}/courses`, {}), { replaceState: true });
      }

      return;
    }

    const path = ONBOARDING_SCREEN_ROUTES[this.state.screen];
    await goto(resolve(path as '/', {}), { replaceState: true });
  }

  private syncOrg() {
    const organization = this.state?.organization;
    if (!organization) return;

    const activeOrgId = get(currentOrg).id;
    const isInFlow = window.location.pathname.startsWith(ROUTE.ONBOARDING);
    if (activeOrgId && activeOrgId !== organization.id && !isInFlow) return;

    currentOrg.update((current) => ({
      ...current,
      id: organization.id,
      name: organization.name,
      siteName: organization.siteName,
      avatarUrl: organization.avatarUrl,
      theme: organization.theme
    }));
  }

  private async handleFailure(error: NormalizedApiError) {
    if (hasErrorCode(error, ErrorCodes.ONBOARDING_PHASE_MISMATCH)) {
      await this.load();
      await this.goToScreen();

      return;
    }

    this.handleValidationError(error);

    if (!error.field) snackbar.error(error.message);
  }

  async markWelcomeEmailPending(): Promise<boolean> {
    const result = await this.execute<WelcomeEmailPendingRequest>({
      requestFn: () => classroomio.onboarding['welcome-email-pending'].$post({}),
      logContext: 'marking welcome email pending'
    });

    return result !== undefined;
  }

  async start(termsAccepted: boolean) {
    const result = await this.execute<OnboardingStartRequest>({
      requestFn: () => classroomio.onboarding.start.$post({ json: { termsAccepted } }),
      logContext: 'starting onboarding',
      onSuccess: (response) => {
        this.state = response.data;
      },
      onError: (error) => this.handleFailure(error)
    });

    return result !== undefined;
  }

  async saveBusinessDraft(draft: OnboardingBusinessDraftInput) {
    await this.execute<OnboardingBusinessDraftRequest>({
      requestFn: () => classroomio.onboarding.business.draft.$put({ json: draft }),
      logContext: 'saving onboarding answers'
    });
  }

  /**
   * Last-chance save on `pagehide`, when the RPC client would be cancelled. `keepalive` lets the request
   * outlive the page, so answers typed just before a refresh are not lost.
   */
  async flushBusinessDraft(draft: OnboardingBusinessDraftInput) {
    try {
      await fetch(`${getRequestBaseUrl()}/onboarding/business/draft`, {
        method: 'PUT',
        credentials: 'include',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
    } catch (error) {
      console.error('Error flushing onboarding answers:', error);
    }
  }

  async submitBusiness(business: OnboardingBusinessInput, options: { navigate?: boolean } = {}) {
    const parsed = ZOnboardingBusiness.safeParse(business);
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);

      return false;
    }

    this.errors = {};

    const result = await this.execute<OnboardingBusinessRequest>({
      requestFn: () => classroomio.onboarding.business.$post({ json: parsed.data }),
      logContext: 'submitting business answers',
      onSuccess: (response) => {
        this.state = response.data;
      },
      onError: (error) => this.handleFailure(error)
    });

    if (!result) return false;

    if (options.navigate !== false) await this.goToScreen();

    return true;
  }

  async checkSiteName(siteName: string) {
    const requestId = ++this.siteNameRequestId;
    this.isCheckingSiteName = true;

    try {
      const response = await classroomio.onboarding['site-name'].check.$post({ json: { siteName } });
      const result = (await response.json()) as { success: boolean; data?: OnboardingSiteNameCheck };
      if (requestId !== this.siteNameRequestId) return;

      this.siteNameCheck = result.success && result.data ? result.data : null;
    } catch (error) {
      console.error('Error checking site name:', error);
    } finally {
      if (requestId === this.siteNameRequestId) this.isCheckingSiteName = false;
    }
  }

  clearSiteNameCheck() {
    this.siteNameRequestId++;
    this.siteNameCheck = null;
    this.isCheckingSiteName = false;
  }

  async submitWorkspace(fields: OnboardingWorkspaceInput) {
    const parsed = ZOnboardingWorkspace.safeParse(fields);
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);

      return false;
    }

    this.errors = {};

    const result = await this.execute<OnboardingWorkspaceRequest>({
      requestFn: () => classroomio.onboarding.workspace.$post({ json: parsed.data }),
      logContext: 'creating workspace',
      onSuccess: (response) => {
        this.state = response.data;
        this.syncOrg();
      },
      onError: async (error) => {
        if (matchesError(error, { code: ErrorCodes.SITENAME_EXISTS }) || matchesError(error, { field: 'siteName' })) {
          this.errors = { ...this.errors, siteName: error.message };

          return;
        }

        await this.handleFailure(error);
      }
    });

    if (!result) return false;

    await this.goToScreen();

    return true;
  }

  async refreshStarter() {
    await this.execute<OnboardingStarterRequest>({
      requestFn: () => classroomio.onboarding.starter.$get(),
      logContext: 'loading starter courses',
      onSuccess: (result) => {
        this.starter = result.data;
      }
    });
  }

  isStarterReady(now = Date.now()) {
    const starter = this.starter;
    if (!starter) return false;
    if (starter.status !== 'PENDING' && starter.status !== 'RUNNING') return true;

    return now - Date.parse(starter.createdAt) >= STARTER_JOB_CONTINUE_AFTER_MS;
  }

  async pollStarter(signal: AbortSignal) {
    while (!signal.aborted) {
      await this.refreshStarter();

      if (this.starter && this.starter.status !== 'PENDING' && this.starter.status !== 'RUNNING') return;

      await new Promise<void>((done) => {
        const stopWaiting = () => {
          clearTimeout(timer);
          done();
        };
        const timer = setTimeout(() => {
          signal.removeEventListener('abort', stopWaiting);
          done();
        }, STARTER_POLL_INTERVAL_MS);

        signal.addEventListener('abort', stopWaiting, { once: true });
      });
    }
  }

  /** Starts a fresh set of drafts and keeps polling until the new job finishes. */
  async regenerateStarter() {
    const result = await this.execute<OnboardingStarterRegenerateRequest>({
      requestFn: () => classroomio.onboarding.starter.regenerate.$post(),
      logContext: 'regenerating starter courses',
      onSuccess: (response) => {
        this.starter = response.data;
      },
      onError: (error) => this.handleFailure(error)
    });

    if (!result) return;

    this.starterPoll?.abort();
    this.starterPoll = new AbortController();
    void this.pollStarter(this.starterPoll.signal);
  }

  async applyCustomisation(input: OnboardingCustomiseInput) {
    const parsed = ZOnboardingCustomise.safeParse(input);
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);

      return false;
    }

    this.errors = {};
    this.isSaving = true;

    const result = await this.execute<OnboardingCustomiseRequest>({
      requestFn: () => classroomio.onboarding.customise.$post({ json: parsed.data }),
      logContext: 'applying customisation',
      onSuccess: (response) => {
        this.state = response.data;
        this.syncOrg();
      },
      onError: (error) => this.handleFailure(error)
    });

    this.isSaving = false;

    return Boolean(result);
  }

  async complete(via: OnboardingCompleteVia) {
    const result = await this.execute<OnboardingCompleteRequest>({
      requestFn: () => classroomio.onboarding.complete.$post({ json: { via } }),
      logContext: 'completing onboarding',
      onSuccess: (response) => {
        this.state = response.data;
      },
      onError: (error) => this.handleFailure(error)
    });

    if (!result) return false;

    const siteName = this.state?.organization?.siteName ?? get(currentOrg).siteName;
    window.location.href = resolve(`/org/${siteName}/courses`, {});

    return true;
  }

  async updateTour(update: OnboardingTourUpdateInput) {
    await this.execute<OnboardingTourRequest>({
      requestFn: () => classroomio.onboarding.tour.$put({ json: update }),
      logContext: 'updating tour',
      onSuccess: (result) => {
        if (this.state) this.state.tour = result.data;
      }
    });
  }
}

export const onboardingFlowApi = new OnboardingFlowApi();
