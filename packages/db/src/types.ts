// Database types generated from schema using Drizzle's built-in type inference
// This file contains all TypeScript types for the database
// Naming convention: T prefix for types

import * as schema from './schema';

export type TUser = typeof schema.user.$inferSelect;
export type TNewUser = typeof schema.user.$inferInsert;

export type TSession = typeof schema.session.$inferSelect;
export type TNewSession = typeof schema.session.$inferInsert;

export type TAccount = typeof schema.account.$inferSelect;
export type TNewAccount = typeof schema.account.$inferInsert;

export type TVerification = typeof schema.verification.$inferSelect;
export type TNewVerification = typeof schema.verification.$inferInsert;

export type TAnalyticsLoginEvents = typeof schema.analyticsLoginEvents.$inferSelect;
export type TNewAnalyticsLoginEvents = typeof schema.analyticsLoginEvents.$inferInsert;

export type TLessonSection = typeof schema.lessonSection.$inferSelect;
export type TNewLessonSection = typeof schema.lessonSection.$inferInsert;

export type TGroup = typeof schema.group.$inferSelect;
export type TNewGroup = typeof schema.group.$inferInsert;

export type TGroupAttendance = typeof schema.groupAttendance.$inferSelect;
export type TNewGroupAttendance = typeof schema.groupAttendance.$inferInsert;

export type TCurrency = typeof schema.currency.$inferSelect;
export type TNewCurrency = typeof schema.currency.$inferInsert;

export type TAppsPollOption = typeof schema.appsPollOption.$inferSelect;
export type TNewAppsPollOption = typeof schema.appsPollOption.$inferInsert;

export type TProfile = typeof schema.profile.$inferSelect;
export type TNewProfile = typeof schema.profile.$inferInsert;

export type TOption = typeof schema.option.$inferSelect;
export type TNewOption = typeof schema.option.$inferInsert;

export type TQuizPlay = typeof schema.quizPlay.$inferSelect;
export type TNewQuizPlay = typeof schema.quizPlay.$inferInsert;

export type TOrganizationContacts = typeof schema.organizationContacts.$inferSelect;
export type TNewOrganizationContacts = typeof schema.organizationContacts.$inferInsert;

export type TLessonComment = typeof schema.lessonComment.$inferSelect;
export type TNewLessonComment = typeof schema.lessonComment.$inferInsert;

export type TQuiz = typeof schema.quiz.$inferSelect;
export type TNewQuiz = typeof schema.quiz.$inferInsert;

export type TSubmission = typeof schema.submission.$inferSelect;
export type TNewSubmission = typeof schema.submission.$inferInsert;

export type TSubmissionstatus = typeof schema.submissionstatus.$inferSelect;
export type TNewSubmissionstatus = typeof schema.submissionstatus.$inferInsert;

export type TCourse = typeof schema.course.$inferSelect;
export type TNewCourse = typeof schema.course.$inferInsert;

export type TAppsPoll = typeof schema.appsPoll.$inferSelect;
export type TNewAppsPoll = typeof schema.appsPoll.$inferInsert;

export type TVideoTranscripts = typeof schema.videoTranscripts.$inferSelect;
export type TNewVideoTranscripts = typeof schema.videoTranscripts.$inferInsert;

export type TOrganizationEmaillist = typeof schema.organizationEmaillist.$inferSelect;
export type TNewOrganizationEmaillist = typeof schema.organizationEmaillist.$inferInsert;

export type TLesson = typeof schema.lesson.$inferSelect;
export type TNewLesson = typeof schema.lesson.$inferInsert;

export type TAppsPollSubmission = typeof schema.appsPollSubmission.$inferSelect;
export type TNewAppsPollSubmission = typeof schema.appsPollSubmission.$inferInsert;

export type TExercise = typeof schema.exercise.$inferSelect;
export type TNewExercise = typeof schema.exercise.$inferInsert;

export type TGroupmember = typeof schema.groupmember.$inferSelect;
export type TNewGroupmember = typeof schema.groupmember.$inferInsert;

export type TLessonCompletion = typeof schema.lessonCompletion.$inferSelect;
export type TNewLessonCompletion = typeof schema.lessonCompletion.$inferInsert;

export type TCommunityAnswer = typeof schema.communityAnswer.$inferSelect;
export type TNewCommunityAnswer = typeof schema.communityAnswer.$inferInsert;
export type UpVoteAnswerParams = Pick<TNewCommunityAnswer, 'id' | 'votes'>;

export type TCommunityQuestion = typeof schema.communityQuestion.$inferSelect;
export type TNewCommunityQuestion = typeof schema.communityQuestion.$inferInsert;
export type UpVoteQuestionParams = Pick<TNewCommunityQuestion, 'id' | 'votes'>;

export type TCourseNewsfeed = typeof schema.courseNewsfeed.$inferSelect;
export type TNewCourseNewsfeed = typeof schema.courseNewsfeed.$inferInsert;

export type TCourseNewsfeedComment = typeof schema.courseNewsfeedComment.$inferSelect;
export type TNewCourseNewsfeedComment = typeof schema.courseNewsfeedComment.$inferInsert;

export type TTestTenant = typeof schema.testTenant.$inferSelect;
export type TNewTestTenant = typeof schema.testTenant.$inferInsert;

export type TOrganizationPlan = typeof schema.organizationPlan.$inferSelect;
export type TNewOrganizationPlan = typeof schema.organizationPlan.$inferInsert;

export type TLessonLanguage = typeof schema.lessonLanguage.$inferSelect;
export type TNewLessonLanguage = typeof schema.lessonLanguage.$inferInsert;

export type TLessonLanguageHistory = typeof schema.lessonLanguageHistory.$inferSelect;
export type TNewLessonLanguageHistory = typeof schema.lessonLanguageHistory.$inferInsert;

export type TOrganizationmember = typeof schema.organizationmember.$inferSelect;
export type TNewOrganizationmember = typeof schema.organizationmember.$inferInsert;

export type TQuestion = typeof schema.question.$inferSelect;
export type TNewQuestion = typeof schema.question.$inferInsert;

export type TQuestionAnswer = typeof schema.questionAnswer.$inferSelect;
export type TNewQuestionAnswer = typeof schema.questionAnswer.$inferInsert;

export type TQuestionType = typeof schema.questionType.$inferSelect;
export type TNewQuestionType = typeof schema.questionType.$inferInsert;

export type TRole = typeof schema.role.$inferSelect;
export type TNewRole = typeof schema.role.$inferInsert;

export type TWaitinglist = typeof schema.waitinglist.$inferSelect;
export type TNewWaitinglist = typeof schema.waitinglist.$inferInsert;

export type TOrganization = typeof schema.organization.$inferSelect;
export type TNewOrganization = typeof schema.organization.$inferInsert;

export type TCourseType = (typeof schema.courseType.enumValues)[number];

export type TCourseVersion = (typeof schema.courseVersion.enumValues)[number];

export type TLocale = (typeof schema.locale.enumValues)[number];

export type TPlan = (typeof schema.plan.enumValues)[number];

export type TDashStats = typeof schema.dashOrgStats.$inferSelect;
