/*
 * enroll.js — (org-site)/course/[slug]/enroll, plus the sign up and log in screens it sends a visitor to
 * (enroll.html?auth=signup|login&next=...). Mirrors the enrol page's rules: a paid course cannot be joined here
 * (it needs payment or an invite), a course that is not accepting students or is unpublished is blocked, a visitor
 * is sent to sign up, a signed-in viewer is enrolled and sent to the course, and an unverified email shows
 * "You're enrolled! Verify your email". Enrolment is saved in S.enrolled. Sign up, log in, Google and the
 * verification email are simulated.
 */
(function () {
  const A = window.academy;
  const { M, T } = A;
  const S = A.load();
  const params = new URLSearchParams(window.location.search);
  const root = document.getElementById('root');
  const org = A.orgOf(S);
  const authMode = params.get('auth');
  const next = params.get('next');

  A.paintRoot(document.documentElement, S);
  document.documentElement.style.cssText += ';' + A.P.brandVars(S.primary);

  const base = { orgName: org.name, logoUrl: org.logoUrl, homeHref: M.R.home };

  function emailOk(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function finishAuth(account) {
    A.signIn(S, account);
    window.location.href = next || M.R.home;
  }

  if (authMode === 'login' || authMode === 'signup') {
    document.title = authMode === 'login' ? 'Log in' : 'Join ClassroomIO';

    const handle = window.CioAcademy.mount('authCard', root, {
      ...base,
      mode: authMode,
      switchHref: A.authHref(authMode === 'login' ? 'signup' : 'login', next),
      onGoogle: () => {
        A.toast(T('snackbar.social_auth_not_enabled'), 'error');
      },
      onSubmit: (fields) => {
        const email = fields.email.trim();
        const errors = {};

        if (!emailOk(email)) errors.email = T('validations.auth.email.invalid_email');
        if (authMode === 'signup' && fields.password.length < 8) errors.password = T('validations.auth.password.min_char');
        if (authMode === 'login' && !fields.password) errors.password = T('validations.auth.password.min_char');

        if (Object.keys(errors).length) {
          handle.update({ errors, submitError: '' });
          return;
        }

        if (authMode === 'login') {
          const owner = (S.email || '').trim().toLowerCase();
          const learner = S.learnerAccount;

          if (email.toLowerCase() === owner) return finishAuth({ kind: 'owner' });
          if (learner && learner.email.toLowerCase() === email.toLowerCase()) return finishAuth({ kind: 'learner', ...learner });

          handle.update({ errors: {}, submitError: 'Invalid email or password (simulated: only the academy owner and learners who signed up here can log in)' });
          return;
        }

        const account = { fullname: email.split('@')[0], email };

        S.learnerAccount = { ...account, verified: false };
        finishAuth({ kind: 'learner', ...account });
      }
    });

    return;
  }

  const course = M.findCourse(S, params.get('course'));

  if (!course || !course.published) {
    document.title = 'Page not found';
    window.CioAcademy.mount('notFound', root, { homeHref: M.R.home, continueHref: M.R.publicCatalog });
    return;
  }

  document.title = `Join ${course.title} on ClassroomIO`;

  const user = A.viewer(S);
  const paid = A.isPaid(course);
  const blockedMessage = !A.selfEnrollmentAllowed(course)
    ? T('course.navItem.landing_page.pricing_section.not_accepting')
    : '';
  const canJoin = !paid && !blockedMessage;
  const verified = user ? user.kind === 'owner' || Boolean(S.learnerAccount?.verified) || Boolean(S.verified || S.completedAt) && user.kind === 'owner' : false;
  const learnPath = () => A.learnHref(S, course);
  const handle = window.CioAcademy.mount('authCard', root, {
    ...base,
    mode: 'enroll',
    course: { title: course.title, description: course.desc ?? '' },
    backHref: M.R.publicCourse(course.id),
    requiresPayment: paid,
    blockedMessage,
    onResend: () => A.toast('Verification email sent (simulated).'),
    onSimulateVerify: () => {
      S.learnerAccount = { ...(S.learnerAccount ?? {}), verified: true };
      A.P.saveState(S);
      window.location.href = learnPath();
    },
    onSubmit: () => {
      if (!canJoin) {
        A.toast(blockedMessage || T('course.navItem.landing_page.enroll_page.requires_payment_or_invite'), 'error');
        return;
      }

      if (!user) {
        window.location.href = A.authHref('signup', A.currentPageHref());
        return;
      }

      completeEnrollment();
    }
  });

  function completeEnrollment() {
    handle.update({ loading: true });
    setTimeout(() => {
      A.enroll(S, course.id);

      if (!verified) {
        handle.update({ loading: false, enrolledPendingVerification: true });
        return;
      }

      window.location.href = learnPath();
    }, 500);
  }

  if (user && canJoin) completeEnrollment();
})();
