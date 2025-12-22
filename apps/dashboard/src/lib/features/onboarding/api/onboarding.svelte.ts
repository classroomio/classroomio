import type { OnboardingField, OnboardingStep } from '../utils/types';
import { currentOrg, orgs } from '$lib/utils/store/org';

import { ONBOARDING_STEPS } from '../utils/constants';
import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { goto } from '$app/navigation';
import { handleLocaleChange } from '$lib/utils/functions/translations';
import { onboardingValidation } from '../utils/validations';
import { profile } from '$lib/utils/store/user';
import { resolve } from '$app/paths';
import { snackbar } from '$features/ui/snackbar/store';

export class OnboardingApi extends BaseApiWithErrors {
  step: OnboardingStep = $state(ONBOARDING_STEPS.ORG_SETUP);

  async submit(data: OnboardingField) {
    if (this.step === ONBOARDING_STEPS.ORG_SETUP) {
      return this.submitOrgSetup(data);
    }

    if (this.step === ONBOARDING_STEPS.USER_METADATA) {
      return this.submitUserMetada(data);
    }

    return false;
  }

  async submitOrgSetup(data: OnboardingField) {
    const errors = onboardingValidation(data, ONBOARDING_STEPS.ORG_SETUP);
    if (errors) {
      this.errors = errors;
      return false;
    }

    await this.execute<(typeof classroomio.onboarding)['create-org']['$post']>({
      requestFn: () => classroomio.onboarding['create-org'].$post({ json: data }),
      logContext: 'submitting organization setup',
      onSuccess: (result) => {
        const { organizations } = result.data;

        orgs.set(organizations);
        currentOrg.set(organizations[0]);

        this.errors = {};
        this.step = ONBOARDING_STEPS.USER_METADATA;
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

  async submitUserMetada(data: OnboardingField) {
    const errors = onboardingValidation(data, ONBOARDING_STEPS.USER_METADATA);
    if (errors) {
      this.errors = errors;
      return false;
    }

    await this.execute<(typeof classroomio.onboarding)['update-metadata']['$post']>({
      requestFn: () => classroomio.onboarding['update-metadata'].$post({ json: data }),
      logContext: 'submitting organization setup',
      onSuccess: (result) => {
        profile.set(result.data);
        handleLocaleChange(result.data.locale ?? 'en');

        const welcomePopup = `${result.data.isEmailVerified}`;

        return goto(resolve(`/org/${data.siteName}?welcomePopup=${welcomePopup}`, {}));
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
