import type { OnboardingField, OnboardingStep } from '../utils/types';
import { currentOrg, mergeAccountOrgFromServer, orgs } from '$lib/utils/store/org';
import { getNextStep, getPreviousStep, ONBOARDING_STEPS } from '../utils/constants';
import { validateMetadata, validateOrgSetup, validateQuestionStep } from '../utils/validations';
import { hasManagedOrganization } from '../utils/completeness';

import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { handleLocaleChange } from '$lib/utils/functions/translations';
import { profile } from '$lib/utils/store/user';
import { get } from 'svelte/store';
import { resolve } from '$app/paths';
import { snackbar } from '$features/ui/snackbar/store';
import { authClient } from '$lib/utils/services/auth/client';

export class OnboardingApi extends BaseApiWithErrors {
  step: OnboardingStep = $state(ONBOARDING_STEPS.ORG_SETUP);
  isRedirecting = $state(false);

  async markWelcomeEmailPending(): Promise<boolean> {
    const result = await this.execute<(typeof classroomio.onboarding)['welcome-email-pending']['$post']>({
      requestFn: () => classroomio.onboarding['welcome-email-pending'].$post({}),
      logContext: 'marking welcome email pending'
    });

    return result !== undefined;
  }

  async next(data: OnboardingField) {
    if (this.step === ONBOARDING_STEPS.ORG_SETUP) {
      if (!hasManagedOrganization(get(currentOrg))) return this.submitOrgSetup(data);

      this.errors = {};
      this.step = ONBOARDING_STEPS.USE_CASES;
      return true;
    }

    const errors = validateQuestionStep(data, this.step);
    if (errors) {
      this.errors = errors;
      return false;
    }

    this.errors = {};

    if (this.step === ONBOARDING_STEPS.SOURCE) {
      return this.submitUserMetadata(data);
    }

    this.step = getNextStep(this.step);
    return true;
  }

  back() {
    if (this.step === ONBOARDING_STEPS.ORG_SETUP) return;

    this.errors = {};
    this.step = getPreviousStep(this.step);
  }

  async skip(data: OnboardingField) {
    return this.submitUserMetadata({
      ...data,
      source: '',
      sourceOther: '',
      aiProvider: '',
      aiProviderOther: ''
    });
  }

  async submitOrgSetup(data: OnboardingField) {
    const errors = validateOrgSetup(data);
    if (errors) {
      this.errors = errors;
      return false;
    }

    await this.execute<(typeof classroomio.onboarding)['create-org']['$post']>({
      requestFn: () => classroomio.onboarding['create-org'].$post({ json: data }),
      logContext: 'submitting organization setup',
      onSuccess: (result) => {
        const { organizations } = result.data;

        orgs.set(organizations.map((org) => mergeAccountOrgFromServer(org)));
        currentOrg.set(mergeAccountOrgFromServer(organizations[0]));
        profile.update((current) => ({ ...current, fullname: data.fullname }));

        this.errors = {};
        this.step = ONBOARDING_STEPS.USE_CASES;
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
          return;
        }

        if ('message' in result) {
          snackbar.error(result.message);
          return;
        }

        if ('error' in result) {
          // Specific handling for siteName / orgName
          if (result.code === 'SITENAME_EXISTS' || result.field === 'siteName') {
            this.errors = { ...this.errors, siteName: result.error };
            return;
          }

          if (result.code === 'ORGNAME_EXISTS' || result.field === 'orgName') {
            this.errors = { ...this.errors, orgName: result.error };
            return;
          }

          // Fallback to generic
          this.handleValidationError(result);
        }
      }
    });
  }

  async submitUserMetadata(data: OnboardingField) {
    const errors = validateMetadata(data);
    if (errors) {
      this.errors = errors;
      return false;
    }

    await this.execute<(typeof classroomio.onboarding)['update-metadata']['$post']>({
      requestFn: () => classroomio.onboarding['update-metadata'].$post({ json: data }),
      logContext: 'submitting onboarding metadata',
      onSuccess: async (result) => {
        profile.set(result.data);
        handleLocaleChange(result.data.locale ?? 'en');

        const welcomePopup = `${result.data.isEmailVerified}`;
        const siteName = get(currentOrg)?.siteName ?? data.siteName;
        const orgPath = resolve(`/org/${siteName}?welcomePopup=${welcomePopup}`, {});

        await authClient.getSession({ query: { disableCookieCache: true } });
        this.isRedirecting = true;
        window.location.href = orgPath;
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
          return;
        }

        if ('message' in result) {
          snackbar.error(result.message);
          return;
        }

        // map api validation back to frontend fields
        if ('error' in result) {
          this.handleValidationError(result);
        }
      }
    });
  }

  override reset() {
    super.reset();
  }
}

export const onboardingApi = new OnboardingApi();
