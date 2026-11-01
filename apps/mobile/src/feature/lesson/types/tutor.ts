export type TutorMessage = { id: string; role: 'user' | 'assistant'; text: string };

/** Why the tutor cannot answer, mapped from the API's error codes. */
export type TutorUnavailableReason = 'cap_reached' | 'pool_exhausted' | 'disabled' | 'not_configured';
