// Database types generated from @cio/db/schema using drizzle-zod
// This file is auto-generated. Do not edit manually.

import {
  account,
  analyticsLoginEvents,
  appsPoll,
  appsPollOption,
  appsPollSubmission,
  communityAnswer,
  communityQuestion,
  course,
  courseNewsfeed,
  courseNewsfeedComment,
  courseType,
  courseVersion,
  currency,
  exercise,
  group,
  groupAttendance,
  groupmember,
  lesson,
  lessonComment,
  lessonCompletion,
  lessonLanguage,
  lessonLanguageHistory,
  lessonSection,
  locale,
  option,
  organization,
  organizationContacts,
  organizationEmaillist,
  organizationPlan,
  organizationmember,
  plan,
  profile,
  question,
  questionAnswer,
  questionType,
  quiz,
  quizPlay,
  role,
  session,
  submission,
  submissionstatus,
  testTenant,
  user,
  videoTranscripts,
  waitinglist
} from '@cio/db/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import type { z } from 'zod';

// AnalyticsLoginEvents schemas
export const insertAnalyticsLoginEventsSchema = createInsertSchema(analyticsLoginEvents);
export const selectAnalyticsLoginEventsSchema = createSelectSchema(analyticsLoginEvents);

// AnalyticsLoginEvents types
export type AnalyticsLoginEvents = z.infer<typeof selectAnalyticsLoginEventsSchema>;
export type NewAnalyticsLoginEvents = z.infer<typeof insertAnalyticsLoginEventsSchema>;

// LessonSection schemas
export const insertLessonSectionSchema = createInsertSchema(lessonSection);
export const selectLessonSectionSchema = createSelectSchema(lessonSection);

// LessonSection types
export type LessonSection = z.infer<typeof selectLessonSectionSchema>;
export type NewLessonSection = z.infer<typeof insertLessonSectionSchema>;

// Group schemas
export const insertGroupSchema = createInsertSchema(group);
export const selectGroupSchema = createSelectSchema(group);

// Group types
export type Group = z.infer<typeof selectGroupSchema>;
export type NewGroup = z.infer<typeof insertGroupSchema>;

// GroupAttendance schemas
export const insertGroupAttendanceSchema = createInsertSchema(groupAttendance);
export const selectGroupAttendanceSchema = createSelectSchema(groupAttendance);

// GroupAttendance types
export type GroupAttendance = z.infer<typeof selectGroupAttendanceSchema>;
export type NewGroupAttendance = z.infer<typeof insertGroupAttendanceSchema>;

// Currency schemas
export const insertCurrencySchema = createInsertSchema(currency);
export const selectCurrencySchema = createSelectSchema(currency);

// Currency types
export type Currency = z.infer<typeof selectCurrencySchema>;
export type NewCurrency = z.infer<typeof insertCurrencySchema>;

// AppsPollOption schemas
export const insertAppsPollOptionSchema = createInsertSchema(appsPollOption);
export const selectAppsPollOptionSchema = createSelectSchema(appsPollOption);

// AppsPollOption types
export type AppsPollOption = z.infer<typeof selectAppsPollOptionSchema>;
export type NewAppsPollOption = z.infer<typeof insertAppsPollOptionSchema>;

// Profile schemas
export const insertProfileSchema = createInsertSchema(profile);
export const selectProfileSchema = createSelectSchema(profile);

// Profile types
export type Profile = z.infer<typeof selectProfileSchema>;
export type NewProfile = z.infer<typeof insertProfileSchema>;

// Option schemas
export const insertOptionSchema = createInsertSchema(option);
export const selectOptionSchema = createSelectSchema(option);

// Option types
export type Option = z.infer<typeof selectOptionSchema>;
export type NewOption = z.infer<typeof insertOptionSchema>;

// QuizPlay schemas
export const insertQuizPlaySchema = createInsertSchema(quizPlay);
export const selectQuizPlaySchema = createSelectSchema(quizPlay);

// QuizPlay types
export type QuizPlay = z.infer<typeof selectQuizPlaySchema>;
export type NewQuizPlay = z.infer<typeof insertQuizPlaySchema>;

// OrganizationContacts schemas
export const insertOrganizationContactsSchema = createInsertSchema(organizationContacts);
export const selectOrganizationContactsSchema = createSelectSchema(organizationContacts);

// OrganizationContacts types
export type OrganizationContacts = z.infer<typeof selectOrganizationContactsSchema>;
export type NewOrganizationContacts = z.infer<typeof insertOrganizationContactsSchema>;

// LessonComment schemas
export const insertLessonCommentSchema = createInsertSchema(lessonComment);
export const selectLessonCommentSchema = createSelectSchema(lessonComment);

// LessonComment types
export type LessonComment = z.infer<typeof selectLessonCommentSchema>;
export type NewLessonComment = z.infer<typeof insertLessonCommentSchema>;

// Quiz schemas
export const insertQuizSchema = createInsertSchema(quiz);
export const selectQuizSchema = createSelectSchema(quiz);

// Quiz types
export type Quiz = z.infer<typeof selectQuizSchema>;
export type NewQuiz = z.infer<typeof insertQuizSchema>;

// Submission schemas
export const insertSubmissionSchema = createInsertSchema(submission);
export const selectSubmissionSchema = createSelectSchema(submission);

// Submission types
export type Submission = z.infer<typeof selectSubmissionSchema>;
export type NewSubmission = z.infer<typeof insertSubmissionSchema>;

// Submissionstatus schemas
export const insertSubmissionstatusSchema = createInsertSchema(submissionstatus);
export const selectSubmissionstatusSchema = createSelectSchema(submissionstatus);

// Submissionstatus types
export type Submissionstatus = z.infer<typeof selectSubmissionstatusSchema>;
export type NewSubmissionstatus = z.infer<typeof insertSubmissionstatusSchema>;

// Course schemas
export const insertCourseSchema = createInsertSchema(course);
export const selectCourseSchema = createSelectSchema(course);

// Course types
export type Course = z.infer<typeof selectCourseSchema>;
export type NewCourse = z.infer<typeof insertCourseSchema>;

// AppsPoll schemas
export const insertAppsPollSchema = createInsertSchema(appsPoll);
export const selectAppsPollSchema = createSelectSchema(appsPoll);

// AppsPoll types
export type AppsPoll = z.infer<typeof selectAppsPollSchema>;
export type NewAppsPoll = z.infer<typeof insertAppsPollSchema>;

// VideoTranscripts schemas
export const insertVideoTranscriptsSchema = createInsertSchema(videoTranscripts);
export const selectVideoTranscriptsSchema = createSelectSchema(videoTranscripts);

// VideoTranscripts types
export type VideoTranscripts = z.infer<typeof selectVideoTranscriptsSchema>;
export type NewVideoTranscripts = z.infer<typeof insertVideoTranscriptsSchema>;

// OrganizationEmaillist schemas
export const insertOrganizationEmaillistSchema = createInsertSchema(organizationEmaillist);
export const selectOrganizationEmaillistSchema = createSelectSchema(organizationEmaillist);

// OrganizationEmaillist types
export type OrganizationEmaillist = z.infer<typeof selectOrganizationEmaillistSchema>;
export type NewOrganizationEmaillist = z.infer<typeof insertOrganizationEmaillistSchema>;

// Lesson schemas
export const insertLessonSchema = createInsertSchema(lesson);
export const selectLessonSchema = createSelectSchema(lesson);

// Lesson types
export type Lesson = z.infer<typeof selectLessonSchema>;
export type NewLesson = z.infer<typeof insertLessonSchema>;

// AppsPollSubmission schemas
export const insertAppsPollSubmissionSchema = createInsertSchema(appsPollSubmission);
export const selectAppsPollSubmissionSchema = createSelectSchema(appsPollSubmission);

// AppsPollSubmission types
export type AppsPollSubmission = z.infer<typeof selectAppsPollSubmissionSchema>;
export type NewAppsPollSubmission = z.infer<typeof insertAppsPollSubmissionSchema>;

// Exercise schemas
export const insertExerciseSchema = createInsertSchema(exercise);
export const selectExerciseSchema = createSelectSchema(exercise);

// Exercise types
export type Exercise = z.infer<typeof selectExerciseSchema>;
export type NewExercise = z.infer<typeof insertExerciseSchema>;

// Groupmember schemas
export const insertGroupmemberSchema = createInsertSchema(groupmember);
export const selectGroupmemberSchema = createSelectSchema(groupmember);

// Groupmember types
export type Groupmember = z.infer<typeof selectGroupmemberSchema>;
export type NewGroupmember = z.infer<typeof insertGroupmemberSchema>;

// LessonCompletion schemas
export const insertLessonCompletionSchema = createInsertSchema(lessonCompletion);
export const selectLessonCompletionSchema = createSelectSchema(lessonCompletion);

// LessonCompletion types
export type LessonCompletion = z.infer<typeof selectLessonCompletionSchema>;
export type NewLessonCompletion = z.infer<typeof insertLessonCompletionSchema>;

// CommunityAnswer schemas
export const insertCommunityAnswerSchema = createInsertSchema(communityAnswer);
export const selectCommunityAnswerSchema = createSelectSchema(communityAnswer);

// CommunityAnswer types
export type CommunityAnswer = z.infer<typeof selectCommunityAnswerSchema>;
export type NewCommunityAnswer = z.infer<typeof insertCommunityAnswerSchema>;

// CommunityQuestion schemas
export const insertCommunityQuestionSchema = createInsertSchema(communityQuestion);
export const selectCommunityQuestionSchema = createSelectSchema(communityQuestion);

// CommunityQuestion types
export type CommunityQuestion = z.infer<typeof selectCommunityQuestionSchema>;
export type NewCommunityQuestion = z.infer<typeof insertCommunityQuestionSchema>;

// CourseNewsfeed schemas
export const insertCourseNewsfeedSchema = createInsertSchema(courseNewsfeed);
export const selectCourseNewsfeedSchema = createSelectSchema(courseNewsfeed);

// CourseNewsfeed types
export type CourseNewsfeed = z.infer<typeof selectCourseNewsfeedSchema>;
export type NewCourseNewsfeed = z.infer<typeof insertCourseNewsfeedSchema>;

// CourseNewsfeedComment schemas
export const insertCourseNewsfeedCommentSchema = createInsertSchema(courseNewsfeedComment);
export const selectCourseNewsfeedCommentSchema = createSelectSchema(courseNewsfeedComment);

// CourseNewsfeedComment types
export type CourseNewsfeedComment = z.infer<typeof selectCourseNewsfeedCommentSchema>;
export type NewCourseNewsfeedComment = z.infer<typeof insertCourseNewsfeedCommentSchema>;

// TestTenant schemas
export const insertTestTenantSchema = createInsertSchema(testTenant);
export const selectTestTenantSchema = createSelectSchema(testTenant);

// TestTenant types
export type TestTenant = z.infer<typeof selectTestTenantSchema>;
export type NewTestTenant = z.infer<typeof insertTestTenantSchema>;

// OrganizationPlan schemas
export const insertOrganizationPlanSchema = createInsertSchema(organizationPlan);
export const selectOrganizationPlanSchema = createSelectSchema(organizationPlan);

// OrganizationPlan types
export type OrganizationPlan = z.infer<typeof selectOrganizationPlanSchema>;
export type NewOrganizationPlan = z.infer<typeof insertOrganizationPlanSchema>;

// LessonLanguage schemas
export const insertLessonLanguageSchema = createInsertSchema(lessonLanguage);
export const selectLessonLanguageSchema = createSelectSchema(lessonLanguage);

// LessonLanguage types
export type LessonLanguage = z.infer<typeof selectLessonLanguageSchema>;
export type NewLessonLanguage = z.infer<typeof insertLessonLanguageSchema>;

// LessonLanguageHistory schemas
export const insertLessonLanguageHistorySchema = createInsertSchema(lessonLanguageHistory);
export const selectLessonLanguageHistorySchema = createSelectSchema(lessonLanguageHistory);

// LessonLanguageHistory types
export type LessonLanguageHistory = z.infer<typeof selectLessonLanguageHistorySchema>;
export type NewLessonLanguageHistory = z.infer<typeof insertLessonLanguageHistorySchema>;

// Organizationmember schemas
export const insertOrganizationmemberSchema = createInsertSchema(organizationmember);
export const selectOrganizationmemberSchema = createSelectSchema(organizationmember);

// Organizationmember types
export type Organizationmember = z.infer<typeof selectOrganizationmemberSchema>;
export type NewOrganizationmember = z.infer<typeof insertOrganizationmemberSchema>;

// Question schemas
export const insertQuestionSchema = createInsertSchema(question);
export const selectQuestionSchema = createSelectSchema(question);

// Question types
export type Question = z.infer<typeof selectQuestionSchema>;
export type NewQuestion = z.infer<typeof insertQuestionSchema>;

// QuestionAnswer schemas
export const insertQuestionAnswerSchema = createInsertSchema(questionAnswer);
export const selectQuestionAnswerSchema = createSelectSchema(questionAnswer);

// QuestionAnswer types
export type QuestionAnswer = z.infer<typeof selectQuestionAnswerSchema>;
export type NewQuestionAnswer = z.infer<typeof insertQuestionAnswerSchema>;

// QuestionType schemas
export const insertQuestionTypeSchema = createInsertSchema(questionType);
export const selectQuestionTypeSchema = createSelectSchema(questionType);

// QuestionType types
export type QuestionType = z.infer<typeof selectQuestionTypeSchema>;
export type NewQuestionType = z.infer<typeof insertQuestionTypeSchema>;

// Role schemas
export const insertRoleSchema = createInsertSchema(role);
export const selectRoleSchema = createSelectSchema(role);

// Role types
export type Role = z.infer<typeof selectRoleSchema>;
export type NewRole = z.infer<typeof insertRoleSchema>;

// Waitinglist schemas
export const insertWaitinglistSchema = createInsertSchema(waitinglist);
export const selectWaitinglistSchema = createSelectSchema(waitinglist);

// Waitinglist types
export type Waitinglist = z.infer<typeof selectWaitinglistSchema>;
export type NewWaitinglist = z.infer<typeof insertWaitinglistSchema>;

// Organization schemas
export const insertOrganizationSchema = createInsertSchema(organization);
export const selectOrganizationSchema = createSelectSchema(organization);

// Organization types
export type Organization = z.infer<typeof selectOrganizationSchema>;
export type NewOrganization = z.infer<typeof insertOrganizationSchema>;

// User schemas
export const insertUserSchema = createInsertSchema(user);
export const selectUserSchema = createSelectSchema(user);

// User types
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;

// Session schemas
export const insertSessionSchema = createInsertSchema(session);
export const selectSessionSchema = createSelectSchema(session);

// Session types
export type Session = z.infer<typeof selectSessionSchema>;
export type NewSession = z.infer<typeof insertSessionSchema>;

// Account schemas
export const insertAccountSchema = createInsertSchema(account);
export const selectAccountSchema = createSelectSchema(account);

// Account types
export type Account = z.infer<typeof selectAccountSchema>;
export type NewAccount = z.infer<typeof insertAccountSchema>;

// Enum types
export type CourseTypeEnum = (typeof courseType.enumValues)[number];
export type CourseVersionEnum = (typeof courseVersion.enumValues)[number];
export type LocaleEnum = (typeof locale.enumValues)[number];
export type PlanEnum = (typeof plan.enumValues)[number];
