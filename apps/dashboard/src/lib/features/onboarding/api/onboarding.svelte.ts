import type { OnboardingField, OnboardingStep } from '../utils/types';
import { currentOrg, orgs } from '$lib/utils/store/org';

import { ONBOARDING_STEPS } from '../utils/constants';
import { classroomio } from '$lib/utils/services/api';
import { goto } from '$app/navigation';
import { handleLocaleChange } from '$lib/utils/functions/translations';
import { onboardingValidation } from '../utils/validations';
import { profile } from '$lib/utils/store/user';
import { resolve } from '$app/paths';
import { snackbar } from '$lib/components/Snackbar/store';

export class OnboardingApi {
  isLoading = $state(false);
  errors = $state<Record<string, string>>({});
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

    this.isLoading = true;

    try {
      const response = await classroomio.onboarding.step1.$post({
        json: data
      });

      const result = await response.json();
      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : result.message;
        if ('field' in result && result.field) {
          this.errors = { [result.field]: errorMessage };
        } else {
          this.errors = { general: errorMessage };
        }

        snackbar.error(errorMessage);
        return false;
      }

      console.log('got response', result);

      const { organizations } = result.data;

      orgs.set(organizations);
      currentOrg.set(organizations[0]);

      this.errors = {};
      this.step = ONBOARDING_STEPS.USER_METADATA;

      return true;
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  async submitUserMetada(data: OnboardingField) {
    const errors = onboardingValidation(data, ONBOARDING_STEPS.USER_METADATA);
    if (errors) {
      this.errors = errors;
      return false;
    }

    this.isLoading = true;

    try {
      const response = await classroomio.onboarding.step2.$post({
        json: data
      });

      const result = await response.json();
      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : result.message;
        if ('field' in result && result.field) {
          this.errors = { [result.field]: errorMessage };
        } else {
          snackbar.error(errorMessage);
        }
        return false;
      }

      profile.set(result.data);
      handleLocaleChange(result.data.locale ?? 'en');

      this.errors = {};

      const welcomePopup = `${result.data.isEmailVerified}`;

      return goto(resolve(`/org/${data.siteName}?welcomePopup=${welcomePopup}`, {}));
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  reset() {
    this.isLoading = false;
    this.errors = {};
  }
}

export const onboardingApi = new OnboardingApi();
