import { BaseApi, classroomio } from '$lib/utils/services/api';

import type {
  PersonalLearningAcceptRequest,
  PersonalLearningAcceptSuccess,
  PersonalLearningChatRequest,
  PersonalLearningChatSuccess,
  PersonalLearningDismissRequest,
  PersonalLearningJourneyChatRequest,
  PersonalLearningJourneyChatSuccess,
  PersonalLearningJourneyStatusRequest,
  PersonalLearningJourneyStatusSuccess,
  PersonalLearningRetryRequest,
  PersonalLearningRetrySuccess
} from '../utils/types';
import type { DailyMinutes, PersonalLearningMessage, StudyDays } from '../personal-learning-state';

class PersonalLearningApi extends BaseApi {
  async ask(message: string, conversationId: string | null): Promise<PersonalLearningChatSuccess | null> {
    let result: PersonalLearningChatSuccess | null = null;
    await this.execute<PersonalLearningChatRequest>({
      requestFn: () =>
        classroomio.learning.chat.$post({ json: { message, conversationId: conversationId ?? undefined } }),
      logContext: 'answering personal learning question',
      onSuccess: (response) => {
        result = response;
      }
    });

    return result;
  }

  async dismiss(offerId: string): Promise<boolean> {
    let dismissed = false;
    await this.execute<PersonalLearningDismissRequest>({
      requestFn: () => classroomio.learning.offers[':offerId'].dismiss.$post({ param: { offerId } }),
      logContext: 'dismissing personal learning offer',
      onSuccess: () => {
        dismissed = true;
      }
    });

    return dismissed;
  }

  async accept(input: {
    offerId: string;
    goal: string;
    language: string;
    targetStudyDays: StudyDays;
    dailyMinutes: DailyMinutes;
  }): Promise<PersonalLearningAcceptSuccess | null> {
    let result: PersonalLearningAcceptSuccess | null = null;
    await this.execute<PersonalLearningAcceptRequest>({
      requestFn: () =>
        classroomio.learning.offers[':offerId'].accept.$post({
          param: { offerId: input.offerId },
          json: {
            consent: true,
            goal: input.goal,
            language: input.language,
            targetStudyDays: input.targetStudyDays,
            dailyMinutes: input.dailyMinutes
          }
        }),
      logContext: 'creating personal learning course',
      onSuccess: (response) => {
        result = response;
      }
    });

    return result;
  }

  async getJourney(journeyId: string): Promise<PersonalLearningJourneyStatusSuccess | null> {
    let result: PersonalLearningJourneyStatusSuccess | null = null;
    await this.execute<PersonalLearningJourneyStatusRequest>({
      requestFn: () => classroomio.learning.journeys[':journeyId'].$get({ param: { journeyId } }),
      logContext: 'loading personal learning journey',
      onSuccess: (response) => {
        result = response;
      }
    });

    return result;
  }

  async askAboutLesson(journeyId: string, message: string): Promise<PersonalLearningJourneyChatSuccess | null> {
    let result: PersonalLearningJourneyChatSuccess | null = null;
    await this.execute<PersonalLearningJourneyChatRequest>({
      requestFn: () =>
        classroomio.learning.journeys[':journeyId'].chat.$post({
          param: { journeyId },
          json: { message }
        }),
      logContext: 'answering personal lesson question',
      onSuccess: (response) => {
        result = response;
      }
    });

    return result;
  }

  async retryWithSources(journeyId: string, sourceUrls: string[]): Promise<PersonalLearningRetrySuccess | null> {
    let result: PersonalLearningRetrySuccess | null = null;
    await this.execute<PersonalLearningRetryRequest>({
      requestFn: () =>
        classroomio.learning.journeys[':journeyId'].retry.$post({ param: { journeyId }, json: { sourceUrls } }),
      logContext: 'retrying personal learning session',
      onSuccess: (response) => {
        result = response;
      }
    });

    return result;
  }
}

export const personalLearningApi = new PersonalLearningApi();
