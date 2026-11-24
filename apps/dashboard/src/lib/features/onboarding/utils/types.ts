import type { z } from 'zod/v4';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import type {
  ZOnboardingBusiness,
  ZOnboardingBusinessDraft,
  ZOnboardingComplete,
  ZOnboardingCustomise,
  ZOnboardingTourUpdate,
  ZOnboardingWorkspace
} from '@cio/utils/validation/onboarding';

export type OnboardingStateRequest = typeof classroomio.onboarding.state.$get;
export type OnboardingStartRequest = typeof classroomio.onboarding.start.$post;
export type OnboardingBusinessDraftRequest = (typeof classroomio.onboarding.business)['draft']['$put'];
export type OnboardingBusinessRequest = typeof classroomio.onboarding.business.$post;
export type OnboardingSiteNameCheckRequest = (typeof classroomio.onboarding)['site-name']['check']['$post'];
export type OnboardingWorkspaceRequest = typeof classroomio.onboarding.workspace.$post;
export type OnboardingStarterRequest = typeof classroomio.onboarding.starter.$get;
export type OnboardingStarterRegenerateRequest = typeof classroomio.onboarding.starter.regenerate.$post;
export type OnboardingCustomiseRequest = typeof classroomio.onboarding.customise.$post;
export type OnboardingCompleteRequest = typeof classroomio.onboarding.complete.$post;
export type WelcomeEmailPendingRequest = (typeof classroomio.onboarding)['welcome-email-pending']['$post'];
export type OnboardingTourRequest = typeof classroomio.onboarding.tour.$put;

export type OnboardingStateSuccess = Extract<InferResponseType<OnboardingStateRequest>, { success: true }>;
export type OnboardingState = OnboardingStateSuccess['data'];

export type OnboardingSiteNameSuccess = Extract<InferResponseType<OnboardingSiteNameCheckRequest>, { success: true }>;
export type OnboardingSiteNameCheck = OnboardingSiteNameSuccess['data'];

export type OnboardingStarterSuccess = Extract<InferResponseType<OnboardingStarterRequest>, { success: true }>;
export type OnboardingStarterStatus = OnboardingStarterSuccess['data'];
export type OnboardingStarterDraft = OnboardingStarterStatus['drafts'][number];

export type OnboardingBusinessInput = z.input<typeof ZOnboardingBusiness>;
export type OnboardingBusinessDraftInput = z.input<typeof ZOnboardingBusinessDraft>;
export type OnboardingWorkspaceInput = z.input<typeof ZOnboardingWorkspace>;
export type OnboardingCustomiseInput = z.input<typeof ZOnboardingCustomise>;
export type OnboardingTourUpdateInput = z.input<typeof ZOnboardingTourUpdate>;
export type OnboardingCompleteVia = z.input<typeof ZOnboardingComplete>['via'];

export type ColourFormat = 'hex' | 'rgb';
export type RgbColour = { r: number; g: number; b: number };

export type TemplateSegment = { kind: 'text'; text: string } | { kind: 'slot'; name: string };

export type CustomiseHandoff = {
  orgName: string;
  brandColour: OnboardingCustomiseInput['brandColour'];
  theme: OnboardingCustomiseInput['landingTheme'];
};
