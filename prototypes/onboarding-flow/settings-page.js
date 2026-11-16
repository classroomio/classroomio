/*
 * settings-page.js — the Profile settings page: routes/(app)/org/[slug]/settings/+page.svelte with
 * lib/features/settings/pages/profile.svelte and components/language-picker.svelte.
 *
 * Sections, in production order: Profile Picture (UploadImage + the crop dialog), Personal Information (Full
 * Name, Username, Email with the Confirm/Cancel email-change flow, language) and the floating
 * "Unsaved changes" save bar (Discard / Save changes). Header action: "Your Academy" (VisitOrgSiteButton).
 *
 * State written on save: S.fullname, S.username, S.avatarDataUrl, S.locale, and S.steps.profile = true when the
 * picture or the username changed (the Get Started "profile" step). Simulated: the email-change verification
 * message (no email is sent and S.email only changes in the real product after the link is opened) and the
 * language change (the prototype stays in English).
 */
(function () {
  const P = window.proto;
  const M = window.model;
  const U = window.AccountUI;
  const esc = P.escapeHtml;

  const COPY = {
    heading: 'Profile',
    subtitle: 'Your name, email, and how you appear wherever you work in ClassroomIO.',
    visit: 'Your Academy',
    picture: 'Profile Picture',
    personal: 'Personal Information',
    fullName: 'Full Name',
    username: 'Username',
    email: 'Email',
    confirm: 'Confirm',
    cancel: 'Cancel',
    language: 'Select Preferred Language',
    pickLanguage: 'Pick a Language',
    verificationSent:
      'A verification email has been sent to your new email address. Please check your inbox to verify your new email address.',
    verificationNote:
      'A verification email has been sent to your current email address. The new email will not be in effect until you accept the verification email.',
    unsaved: 'Unsaved changes',
    discard: 'Discard',
    save: 'Save changes',
    updated: 'Update successful',
    success: 'Success',
    invalidEmail: 'Invalid format for email',
    fullNameMin: 'Value is too small. Minimum 5',
    usernameMin: 'Value is too small. Minimum 1'
  };

  const LANGUAGES = [
    ['da', 'Danish'],
    ['de', 'German'],
    ['en', 'English'],
    ['es', 'Spanish'],
    ['fr', 'French'],
    ['hi', 'Hindi'],
    ['it', 'Italian'],
    ['pl', 'Polish'],
    ['pt', 'Portuguese'],
    ['ru', 'Russian'],
    ['tr', 'Turkish'],
    ['vi', 'Vietnamese']
  ].map(([value, label]) => ({ value, label }));

  function defaultUsername(S) {
    const fromEmail = (S.email || '').split('@')[0].replace(/[^a-z0-9._-]/gi, '').toLowerCase();

    return S.username || fromEmail || P.slugify(S.fullname || '') || '';
  }

  function html(S) {
    const showSent = new URLSearchParams(window.location.search).get('trigger') === 'app';

    return `
      <div class="ac-page ac-w3xl ac-gap2">
        <div class="ac-ph">
          <div class="ac-ph-row">
            <div class="ac-ph-c">
              <h1 class="ac-title">${COPY.heading}</h1>
              <p class="ac-sub">${COPY.subtitle}</p>
            </div>
            <div class="ac-act"><a class="btn btn-primary" href="${esc(M.R.home)}" target="_blank" rel="noopener">${COPY.visit}${U.icon('ext', 16)}</a></div>
          </div>
        </div>
        <div class="ac-body">
          <div class="ac-fg">
            <fieldset class="ac-fs">
              <legend class="ac-legend">${COPY.picture}</legend>
              <div class="ac-field"><div id="pf-avatar"></div></div>
            </fieldset>

            <div class="ac-sep" role="separator"></div>

            <fieldset class="ac-fs">
              <legend class="ac-legend">${COPY.personal}</legend>
              ${
                showSent
                  ? `<div class="ac-note ok">${U.icon('circle-check', 32)}<p>${COPY.verificationSent}</p></div>`
                  : ''
              }
              <div class="ac-fg">
                <div class="ac-field">
                  <label class="ac-label" for="pf-fullname">${COPY.fullName}</label>
                  <input class="ac-input" id="pf-fullname" type="text" autocomplete="name" />
                  <p class="ac-err" id="pf-fullname-err" hidden></p>
                </div>
                <div class="ac-field">
                  <label class="ac-label" for="pf-username">${COPY.username}</label>
                  <input class="ac-input" id="pf-username" type="text" autocomplete="username" />
                  <p class="ac-err" id="pf-username-err" hidden></p>
                </div>
                <div class="ac-field">
                  <label class="ac-label" for="pf-email">${COPY.email}</label>
                  <input class="ac-input" id="pf-email" type="email" autocomplete="email" />
                  <p class="ac-err" id="pf-email-err" hidden></p>
                  <div class="ac-wrap" id="pf-email-actions" hidden style="margin-top:0">
                    <button type="button" class="btn btn-primary" id="pf-email-confirm">${COPY.confirm}</button>
                    <button type="button" class="btn btn-ghost" id="pf-email-cancel" style="color:var(--primary)">${COPY.cancel}</button>
                  </div>
                  <div class="ac-note warn" id="pf-email-note" hidden>${U.icon('circle-check', 32)}<p>${COPY.verificationNote}</p></div>
                </div>
                <div class="ac-field">
                  <label class="ac-label" id="pf-lang-label">${COPY.language}</label>
                  <div id="pf-lang"></div>
                </div>
              </div>
            </fieldset>
          </div>
        </div>
        ${U.settingsBarHTML({ status: COPY.unsaved, discard: COPY.discard, save: COPY.save })}
      </div>`;
  }

  function wire(S, { commit, rerender }) {
    const $ = (selector) => document.querySelector(selector);

    const saved = {
      fullname: S.fullname || '',
      username: defaultUsername(S),
      locale: S.locale || 'en',
      avatar: S.avatarDataUrl || ''
    };
    const draft = { ...saved };
    let isSaving = false;

    const fullnameInput = $('#pf-fullname');
    const usernameInput = $('#pf-username');
    const emailInput = $('#pf-email');
    fullnameInput.value = draft.fullname;
    usernameInput.value = draft.username;
    emailInput.value = S.email || '';

    const uploader = U.uploadImage($('#pf-avatar'), {
      src: draft.avatar,
      round: true,
      size: 'sm',
      initials: P.initials(draft.fullname || 'Ada Okafor'),
      onChange: (dataUrl) => {
        draft.avatar = dataUrl;
        updateBar();
      }
    });

    const language = U.select($('#pf-lang'), {
      value: draft.locale,
      options: LANGUAGES,
      placeholder: COPY.pickLanguage,
      ariaLabel: COPY.language,
      onChange: (value) => {
        draft.locale = value;
        updateBar();
      }
    });

    const isDirty = () =>
      draft.fullname !== saved.fullname ||
      draft.username !== saved.username ||
      draft.avatar !== saved.avatar ||
      draft.locale !== saved.locale;

    function updateBar() {
      $('#ac-savebar').hidden = !isDirty();
    }

    function setError(field, message) {
      const element = $(`#pf-${field}-err`);
      const input = $(`#pf-${field}`);
      element.hidden = !message;
      element.textContent = message || '';
      input?.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    fullnameInput.addEventListener('input', () => {
      draft.fullname = fullnameInput.value;
      setError('fullname', '');
      updateBar();
    });
    usernameInput.addEventListener('input', () => {
      draft.username = usernameInput.value;
      setError('username', '');
      updateBar();
    });

    /* The email-change flow: editing the field reveals Confirm / Cancel; Confirm validates and shows the
     * verification note. The signed-in email stays as it was until the link is opened, as in production. */
    const emailActions = $('#pf-email-actions');
    const emailNote = $('#pf-email-note');

    emailInput.addEventListener('input', () => {
      setError('email', '');
      emailNote.hidden = true;
      emailActions.hidden = emailInput.value === (S.email || '');
    });
    $('#pf-email-cancel').addEventListener('click', () => {
      emailInput.value = S.email || '';
      emailActions.hidden = true;
      setError('email', '');
    });
    $('#pf-email-confirm').addEventListener('click', () => {
      const next = emailInput.value.trim();

      if (!P.isEmail(next)) {
        setError('email', COPY.invalidEmail);

        return;
      }

      emailInput.value = S.email || '';
      emailActions.hidden = true;
      emailNote.hidden = false;
      P.toast(`${COPY.success} (simulated: no email was sent)`);
    });

    $('#ac-discard').addEventListener('click', () => {
      Object.assign(draft, saved);
      fullnameInput.value = saved.fullname;
      usernameInput.value = saved.username;
      language.set(saved.locale);
      uploader.set(saved.avatar);
      setError('fullname', '');
      setError('username', '');
      updateBar();
    });

    $('#ac-save').addEventListener('click', () => {
      if (isSaving) return;

      const fullname = draft.fullname.trim();
      const username = draft.username.trim();
      setError('fullname', fullname.length < 5 ? COPY.fullNameMin : '');
      setError('username', username.length < 1 ? COPY.usernameMin : '');

      if (fullname.length < 5 || username.length < 1) return;

      isSaving = true;
      const saveButton = $('#ac-save');
      saveButton.disabled = true;
      saveButton.classList.add('ac-btn-spin');

      setTimeout(() => {
        const pictureChanged = draft.avatar !== saved.avatar;
        const usernameChanged = username !== saved.username;

        S.fullname = fullname;
        S.username = username;
        S.locale = draft.locale;
        if (draft.avatar) S.avatarDataUrl = draft.avatar;
        if (pictureChanged || usernameChanged) S.steps = { ...(S.steps ?? {}), profile: true };
        commit();

        Object.assign(saved, { fullname, username, locale: draft.locale, avatar: draft.avatar });
        draft.fullname = fullname;
        draft.username = username;
        isSaving = false;
        rerender();
        P.toast(COPY.updated);
      }, 350);
    });

    U.guardUnsaved(isDirty);
    updateBar();
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.settings = { title: 'Settings', html, wire };
})();
