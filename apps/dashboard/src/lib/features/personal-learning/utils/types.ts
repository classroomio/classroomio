import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type PersonalLearningChatRequest = typeof classroomio.learning.chat.$post;
export type PersonalLearningChatSuccess = Extract<InferResponseType<PersonalLearningChatRequest>, { success: true }>;

export type PersonalLearningAcceptRequest = (typeof classroomio.learning.offers)[':offerId']['accept']['$post'];
export type PersonalLearningAcceptSuccess = Extract<
  InferResponseType<PersonalLearningAcceptRequest>,
  { success: true }
>;

export type PersonalLearningDismissRequest = (typeof classroomio.learning.offers)[':offerId']['dismiss']['$post'];
export type PersonalLearningDismissSuccess = Extract<
  InferResponseType<PersonalLearningDismissRequest>,
  { success: true }
>;

export type PersonalLearningJourneyStatusRequest = (typeof classroomio.learning.journeys)[':journeyId']['$get'];
export type PersonalLearningJourneyStatusSuccess = Extract<
  InferResponseType<PersonalLearningJourneyStatusRequest>,
  { success: true }
>;
export type PersonalLearningJourney = PersonalLearningJourneyStatusSuccess['journey'];
export type PersonalLearningJourneySession = PersonalLearningJourneyStatusSuccess['sessions'][number];

export type PersonalLearningJourneyChatRequest = (typeof classroomio.learning.journeys)[':journeyId']['chat']['$post'];
export type PersonalLearningJourneyChatSuccess = Extract<
  InferResponseType<PersonalLearningJourneyChatRequest>,
  { success: true }
>;

export type PersonalLearningRetryRequest = (typeof classroomio.learning.journeys)[':journeyId']['retry']['$post'];
export type PersonalLearningRetrySuccess = Extract<InferResponseType<PersonalLearningRetryRequest>, { success: true }>;
