import {
  analyticsLoginEvents,
  appsPoll,
  appsPollOption,
  appsPollSubmission,
  communityAnswer,
  communityQuestion,
  course,
  courseNewsfeed,
  courseNewsfeedComment,
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
  option,
  organization,
  organizationContacts,
  organizationEmaillist,
  organizationPlan,
  organizationmember,
  organizationSsoConfig,
  profile,
  question,
  questionAnswer,
  questionType,
  quiz,
  quizPlay,
  role,
  ssoSession,
  submission,
  submissionstatus,
  user
} from './schema';

import { relations } from 'drizzle-orm/relations';

export const analyticsLoginEventsRelations = relations(analyticsLoginEvents, ({ one }) => ({
  usersInAuth: one(user, {
    fields: [analyticsLoginEvents.userId],
    references: [user.id]
  })
}));

export const usersInAuthRelations = relations(user, ({ many }) => ({
  analyticsLoginEvents: many(analyticsLoginEvents),
  profiles: many(profile)
}));

export const lessonSectionRelations = relations(lessonSection, ({ one, many }) => ({
  course: one(course, {
    fields: [lessonSection.courseId],
    references: [course.id]
  }),
  lessons: many(lesson)
}));

export const courseRelations = relations(course, ({ one, many }) => ({
  lessonSections: many(lessonSection),
  groupAttendances: many(groupAttendance),
  submissions: many(submission),
  group: one(group, {
    fields: [course.groupId],
    references: [group.id]
  }),
  appsPolls: many(appsPoll),
  lessons: many(lesson),
  communityQuestions: many(communityQuestion),
  courseNewsfeeds: many(courseNewsfeed)
}));

export const groupRelations = relations(group, ({ one, many }) => ({
  organization: one(organization, {
    fields: [group.organizationId],
    references: [organization.id]
  }),
  courses: many(course),
  groupmembers: many(groupmember)
}));

export const organizationRelations = relations(organization, ({ one, many }) => ({
  groups: many(group),
  organizationContacts: many(organizationContacts),
  quizzes: many(quiz),
  organizationEmaillists: many(organizationEmaillist),
  communityQuestions: many(communityQuestion),
  organizationPlans: many(organizationPlan),
  organizationmembers: many(organizationmember),
  ssoConfig: one(organizationSsoConfig, {
    fields: [organization.id],
    references: [organizationSsoConfig.organizationId]
  }),
  ssoSessions: many(ssoSession)
}));

export const groupAttendanceRelations = relations(groupAttendance, ({ one }) => ({
  course: one(course, {
    fields: [groupAttendance.courseId],
    references: [course.id]
  }),
  groupmember: one(groupmember, {
    fields: [groupAttendance.studentId],
    references: [groupmember.id]
  })
}));

export const groupmemberRelations = relations(groupmember, ({ one, many }) => ({
  groupAttendances: many(groupAttendance),
  lessonComments: many(lessonComment),
  submissions: many(submission),
  appsPolls: many(appsPoll),
  appsPollSubmissions: many(appsPollSubmission),
  group: one(group, {
    fields: [groupmember.groupId],
    references: [group.id]
  }),
  profile: one(profile, {
    fields: [groupmember.profileId],
    references: [profile.id]
  }),
  role: one(role, {
    fields: [groupmember.roleId],
    references: [role.id]
  }),
  courseNewsfeeds: many(courseNewsfeed),
  courseNewsfeedComments: many(courseNewsfeedComment),
  questionAnswers: many(questionAnswer)
}));

export const appsPollOptionRelations = relations(appsPollOption, ({ one, many }) => ({
  appsPoll: one(appsPoll, {
    fields: [appsPollOption.pollId],
    references: [appsPoll.id]
  }),
  appsPollSubmissions: many(appsPollSubmission)
}));

export const appsPollRelations = relations(appsPoll, ({ one, many }) => ({
  appsPollOptions: many(appsPollOption),
  groupmember: one(groupmember, {
    fields: [appsPoll.authorId],
    references: [groupmember.id]
  }),
  course: one(course, {
    fields: [appsPoll.courseId],
    references: [course.id]
  }),
  appsPollSubmissions: many(appsPollSubmission)
}));

export const profileRelations = relations(profile, ({ one, many }) => ({
  usersInAuth: one(user, {
    fields: [profile.id],
    references: [user.id]
  }),
  lessons: many(lesson),
  groupmembers: many(groupmember),
  lessonCompletions: many(lessonCompletion),
  communityAnswers: many(communityAnswer),
  communityQuestions: many(communityQuestion),
  organizationmembers: many(organizationmember)
}));

export const optionRelations = relations(option, ({ one }) => ({
  question: one(question, {
    fields: [option.questionId],
    references: [question.id]
  })
}));

export const questionRelations = relations(question, ({ one, many }) => ({
  options: many(option),
  exercise: one(exercise, {
    fields: [question.exerciseId],
    references: [exercise.id]
  }),
  questionType: one(questionType, {
    fields: [question.questionTypeId],
    references: [questionType.id]
  }),
  questionAnswers: many(questionAnswer)
}));

export const quizPlayRelations = relations(quizPlay, ({ one }) => ({
  quiz: one(quiz, {
    fields: [quizPlay.quizId],
    references: [quiz.id]
  })
}));

export const quizRelations = relations(quiz, ({ one, many }) => ({
  quizPlays: many(quizPlay),
  organization: one(organization, {
    fields: [quiz.organizationId],
    references: [organization.id]
  })
}));

export const organizationContactsRelations = relations(organizationContacts, ({ one }) => ({
  organization: one(organization, {
    fields: [organizationContacts.organizationId],
    references: [organization.id]
  })
}));

export const lessonCommentRelations = relations(lessonComment, ({ one }) => ({
  groupmember: one(groupmember, {
    fields: [lessonComment.groupmemberId],
    references: [groupmember.id]
  }),
  lesson: one(lesson, {
    fields: [lessonComment.lessonId],
    references: [lesson.id]
  })
}));

export const lessonRelations = relations(lesson, ({ one, many }) => ({
  lessonComments: many(lessonComment),
  course: one(course, {
    fields: [lesson.courseId],
    references: [course.id]
  }),
  profile: one(profile, {
    fields: [lesson.teacherId],
    references: [profile.id]
  }),
  lessonSection: one(lessonSection, {
    fields: [lesson.sectionId],
    references: [lessonSection.id]
  }),
  exercises: many(exercise),
  lessonCompletions: many(lessonCompletion),
  lessonLanguages: many(lessonLanguage)
}));

export const submissionRelations = relations(submission, ({ one, many }) => ({
  course: one(course, {
    fields: [submission.courseId],
    references: [course.id]
  }),
  exercise: one(exercise, {
    fields: [submission.exerciseId],
    references: [exercise.id]
  }),
  submissionstatus: one(submissionstatus, {
    fields: [submission.statusId],
    references: [submissionstatus.id]
  }),
  groupmember: one(groupmember, {
    fields: [submission.submittedBy],
    references: [groupmember.id]
  }),
  questionAnswers: many(questionAnswer)
}));

export const exerciseRelations = relations(exercise, ({ one, many }) => ({
  submissions: many(submission),
  lesson: one(lesson, {
    fields: [exercise.lessonId],
    references: [lesson.id]
  }),
  questions: many(question)
}));

export const submissionstatusRelations = relations(submissionstatus, ({ many }) => ({
  submissions: many(submission)
}));

export const organizationEmaillistRelations = relations(organizationEmaillist, ({ one }) => ({
  organization: one(organization, {
    fields: [organizationEmaillist.organizationId],
    references: [organization.id]
  })
}));

export const appsPollSubmissionRelations = relations(appsPollSubmission, ({ one }) => ({
  appsPoll: one(appsPoll, {
    fields: [appsPollSubmission.pollId],
    references: [appsPoll.id]
  }),
  appsPollOption: one(appsPollOption, {
    fields: [appsPollSubmission.pollOptionId],
    references: [appsPollOption.id]
  }),
  groupmember: one(groupmember, {
    fields: [appsPollSubmission.selectedById],
    references: [groupmember.id]
  })
}));

export const roleRelations = relations(role, ({ many }) => ({
  groupmembers: many(groupmember),
  organizationmembers: many(organizationmember)
}));

export const lessonCompletionRelations = relations(lessonCompletion, ({ one }) => ({
  lesson: one(lesson, {
    fields: [lessonCompletion.lessonId],
    references: [lesson.id]
  }),
  profile: one(profile, {
    fields: [lessonCompletion.profileId],
    references: [profile.id]
  })
}));

export const communityAnswerRelations = relations(communityAnswer, ({ one }) => ({
  organizationmember: one(organizationmember, {
    fields: [communityAnswer.authorId],
    references: [organizationmember.id]
  }),
  profile: one(profile, {
    fields: [communityAnswer.authorProfileId],
    references: [profile.id]
  }),
  communityQuestion: one(communityQuestion, {
    fields: [communityAnswer.questionId],
    references: [communityQuestion.id]
  })
}));

export const organizationmemberRelations = relations(organizationmember, ({ one, many }) => ({
  communityAnswers: many(communityAnswer),
  communityQuestions: many(communityQuestion),
  organizationPlans: many(organizationPlan),
  organization: one(organization, {
    fields: [organizationmember.organizationId],
    references: [organization.id]
  }),
  profile: one(profile, {
    fields: [organizationmember.profileId],
    references: [profile.id]
  }),
  role: one(role, {
    fields: [organizationmember.roleId],
    references: [role.id]
  })
}));

export const communityQuestionRelations = relations(communityQuestion, ({ one, many }) => ({
  communityAnswers: many(communityAnswer),
  organizationmember: one(organizationmember, {
    fields: [communityQuestion.authorId],
    references: [organizationmember.id]
  }),
  profile: one(profile, {
    fields: [communityQuestion.authorProfileId],
    references: [profile.id]
  }),
  course: one(course, {
    fields: [communityQuestion.courseId],
    references: [course.id]
  }),
  organization: one(organization, {
    fields: [communityQuestion.organizationId],
    references: [organization.id]
  })
}));

export const courseNewsfeedRelations = relations(courseNewsfeed, ({ one, many }) => ({
  groupmember: one(groupmember, {
    fields: [courseNewsfeed.authorId],
    references: [groupmember.id]
  }),
  course: one(course, {
    fields: [courseNewsfeed.courseId],
    references: [course.id]
  }),
  courseNewsfeedComments: many(courseNewsfeedComment)
}));

export const courseNewsfeedCommentRelations = relations(courseNewsfeedComment, ({ one }) => ({
  groupmember: one(groupmember, {
    fields: [courseNewsfeedComment.authorId],
    references: [groupmember.id]
  }),
  courseNewsfeed: one(courseNewsfeed, {
    fields: [courseNewsfeedComment.courseNewsfeedId],
    references: [courseNewsfeed.id]
  })
}));

export const organizationPlanRelations = relations(organizationPlan, ({ one }) => ({
  organization: one(organization, {
    fields: [organizationPlan.orgId],
    references: [organization.id]
  }),
  organizationmember: one(organizationmember, {
    fields: [organizationPlan.triggeredBy],
    references: [organizationmember.id]
  })
}));

export const lessonLanguageRelations = relations(lessonLanguage, ({ one, many }) => ({
  lesson: one(lesson, {
    fields: [lessonLanguage.lessonId],
    references: [lesson.id]
  }),
  lessonLanguageHistories: many(lessonLanguageHistory)
}));

export const lessonLanguageHistoryRelations = relations(lessonLanguageHistory, ({ one }) => ({
  lessonLanguage: one(lessonLanguage, {
    fields: [lessonLanguageHistory.lessonLanguageId],
    references: [lessonLanguage.id]
  })
}));

export const questionTypeRelations = relations(questionType, ({ many }) => ({
  questions: many(question)
}));

export const questionAnswerRelations = relations(questionAnswer, ({ one }) => ({
  groupmember: one(groupmember, {
    fields: [questionAnswer.groupMemberId],
    references: [groupmember.id]
  }),
  question: one(question, {
    fields: [questionAnswer.questionId],
    references: [question.id]
  }),
  submission: one(submission, {
    fields: [questionAnswer.submissionId],
    references: [submission.id]
  })
}));

// SSO Relations
export const organizationSsoConfigRelations = relations(organizationSsoConfig, ({ one, many }) => ({
  organization: one(organization, {
    fields: [organizationSsoConfig.organizationId],
    references: [organization.id]
  }),
  defaultRole: one(role, {
    fields: [organizationSsoConfig.defaultRoleId],
    references: [role.id]
  }),
  ssoSessions: many(ssoSession)
}));

export const ssoSessionRelations = relations(ssoSession, ({ one }) => ({
  organization: one(organization, {
    fields: [ssoSession.organizationId],
    references: [organization.id]
  }),
  ssoConfig: one(organizationSsoConfig, {
    fields: [ssoSession.ssoConfigId],
    references: [organizationSsoConfig.id]
  }),
  user: one(user, {
    fields: [ssoSession.userId],
    references: [user.id]
  })
}));
