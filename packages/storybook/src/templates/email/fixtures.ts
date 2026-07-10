import { getDefaultTemplate } from '@cio/email/templates';

// ─── Sample content for each use case ────────────────────────────────────────

const VERIFY_EMAIL_CONTENT = `
  <p><strong>Hey there 👋</strong></p>
  <p>Welcome to Acme Coding School! In order to get your account ready for usage, we need to verify your email.</p>
  <p>We do this to make sure we don't get fake user emails in our signup. To get the best out of our product, we'll need you to verify your email by clicking the <strong>Verify</strong> button below.</p>
  <div><a class="button" href="#">Verify</a></div>
`;

const WELCOME_CONTENT = `
  <p>Dear Alex,</p>
  <p>My name is Best, the founder of ClassroomIO. I saw you signed up, any questions so far?</p>
  <p>Would you like to get a walkthrough of the platform in a 30 minute product demo? It's free and we won't try to sell you anything, just want to learn from your use case and show you all the cool features and flows we thought about.</p>
  <p>Interested? just book a 30-minute demo slot in our calendar!</p>
  <div><a class="button" href="https://classroomio.com/demo">Book demo</a></div>
  <p>PS: I reply personally to every email. We don't have an outsourced support team at the other end of the globe.. ;-)</p>
`;

const FORGOT_PASSWORD_CONTENT = `
  <p>Hello Jane,</p>
  <p>You are receiving this email because you have requested a password reset for your ClassroomIO account.</p>
  <p>Please click the button below to reset your password:</p>
  <div><a class="button" href="#">Reset my password</a></div>
  <p>PS: If you did not initiate this request, reply to this email or write to help@classroomio.com so we can look into a possible attempt to breach your account.</p>
`;

const COURSE_WELCOME_CONTENT = `
  <p>Hi there,</p>
  <p>You now have access to <strong>Introduction to Web Development</strong> in <strong>Acme Coding School</strong>.</p>
  <p><a href="#">Sign in to ClassroomIO</a> to open the course and get started.</p>
  <p>If you run into any issues, reach out to your instructor(s).</p>
  <p>Cheers,</p>
  <p>Acme Coding School</p>
`;

const INVITE_TEACHER_CONTENT = `
  <p>Hey there,</p>
  <p>You have been invited to join <strong>Acme Coding School</strong> on ClassroomIO as <strong>Admin</strong> 🎉🎉🎉.</p>
  <p>This invite expires on <strong>Jul 15, 2026</strong> (UTC).</p>
  <div><a class="button" href="#">Accept Invitation</a></div>
`;

const NEWSFEED_POST_CONTENT = `
  <p><strong>Sarah Johnson</strong> made a post in a course you are taking: <strong>Advanced JavaScript</strong>.</p>
  <div style="font-style:italic;margin-top:10px;padding:12px;border-left:3px solid #0233BD;background:#f8fafc;">
    Don't forget — the final project is due next Friday! Make sure to submit your repository link before the deadline. Let me know if you have any questions.
  </div>
  <div><a class="button" href="#">View post</a></div>
`;

const STUDENT_JOINED_CONTENT = `
  <p>Hi amazing tutor,</p>
  <p>Congratulations 🎉, a new student: <strong>Alex Rivera (alex@example.com)</strong> has joined a course you are teaching: <strong>Advanced JavaScript</strong>.</p>
  <p>We hope they have a great experience learning from the best (YOU).</p>
  <p>If you run into any issues, please don't fail to reach out to us, we'd love to make your teaching experience as easy as possible.</p>
`;

// ─── Exported email HTML strings ──────────────────────────────────────────

export const verifyEmailHtml = getDefaultTemplate(VERIFY_EMAIL_CONTENT, {
  orgName: 'Acme Coding School',
  logoUrl: 'https://placehold.co/120x40/png?text=Acme',
  themeColor: '#1d4ed8'
});
export const forgotPasswordHtml = getDefaultTemplate(FORGOT_PASSWORD_CONTENT);
export const welcomeHtml = getDefaultTemplate(WELCOME_CONTENT);
export const courseWelcomeHtml = getDefaultTemplate(COURSE_WELCOME_CONTENT);
export const inviteTeacherHtml = getDefaultTemplate(INVITE_TEACHER_CONTENT);
export const newsfeedPostHtml = getDefaultTemplate(NEWSFEED_POST_CONTENT);
export const studentJoinedHtml = getDefaultTemplate(STUDENT_JOINED_CONTENT);
