/*
 * org-settings-page.js — Organisation settings: routes/(app)/org/[slug]/settings/{org,domains,teams,customize-lms}
 * with lib/features/settings/pages/{org,domains,teams,customize-lms}.svelte and the layout's
 * OrgSettingsInlineTabs. `org-settings.html?tab=general|domains|teams|customize-lms` picks the tab.
 *
 *   General          organisation name, logo (UploadImage + crop), the five named colours or a custom hex
 *                    (applied at once, no save bar, like production), the "Unsaved changes" save bar.
 *                    Saves S.brandName and S.company (name), S.logoDataUrl and S.steps.organization (logo),
 *                    S.primary (theme).
 *   Custom Domain    "Add" the academy subdomain (S.siteName, validated like production), the custom domain
 *                    (S.customDomain; paid plans only) with DNS records, status and refresh, the favicon
 *                    (S.faviconDataUrl) and the disabled custom-code box.
 *   Team             S.team [{id, email, fullname, roleId 1 admin | 2 tutor, verified, invitedAt, self}], invite by
 *                    email or invite link (S.linkInvite), role change with confirmation, remove.
 *   Customize LMS    S.lmsLanguage {locale, enforced} and S.customization {dashboard, course, apps, auth}.
 *
 * Simulated: no DNS or SSL is checked (Refresh advances the domain through pending DNS, pending verification and
 * verified), no invite email is sent, and the banner image picker offers Upload and Link but not Unsplash.
 */
(function () {
  const P = window.proto;
  const M = window.model;
  const U = window.AccountUI;
  const esc = P.escapeHtml;

  const TENANT_ROOT_DOMAIN = 'myclassroomio.com';
  const BLOCKED_SUBDOMAINS = [
    'academy', 'app', 'apps', 'blog', 'build', 'campaign', 'church', 'cloud', 'community', 'conference', 'course',
    'courses', 'demo', 'dev', 'embed', 'embeds', 'forum', 'group', 'groups', 'help', 'launch', 'launchweek', 'mobile',
    'play', 'prod', 'production', 'schools', 'stage', 'staging', 'support', 'teacher', 'teachers', 'tech', 'training'
  ];

  const COPY = {
    heading: 'Organization',
    subtitle: 'Set the name, logo, and theme students see for this organization.',
    orgName: 'Organization Name',
    theme: 'Theme',
    themeSub: 'Set your brand color',
    unsaved: 'Unsaved changes',
    discard: 'Discard',
    save: 'Save changes',
    updated: 'Update successful',
    nameMin: 'Value is too small. Minimum 5',
    nameHyphen: 'Organization name cannot start or end with a hyphen',
    visit: 'Your Academy'
  };

  const TABS = [
    { value: 'general', label: 'General' },
    { value: 'domains', label: 'Custom Domain' },
    { value: 'teams', label: 'Team' },
    { value: 'customize-lms', label: 'Customize LMS' }
  ];

  const SWATCH_LABELS = {
    blue: 'Default blue theme',
    rose: 'Rose theme',
    green: 'Green theme',
    orange: 'Orange theme',
    purple: 'Purple theme'
  };

  const ROLE = { ADMIN: 1, TUTOR: 2 };
  const ROLE_LABEL = { 1: 'Admin', 2: 'Tutor', 3: 'Student' };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function currentTab() {
    const requested = new URLSearchParams(window.location.search).get('tab');

    return TABS.some((tab) => tab.value === requested) ? requested : 'general';
  }

  function sameColor(a, b) {
    return String(a || '').toLowerCase() === String(b || '').toLowerCase();
  }

  function setError(selector, message) {
    const element = $(selector);
    if (!element) return;

    element.hidden = !message;
    element.textContent = message || '';
  }

  /* ---------- the shared frame: header, inline tabs, then the active tab ---------- */
  function html(S) {
    const active = currentTab();

    return `
      <div class="ac-page ac-w3xl ac-gap2">
        <div class="ac-ph ac-ph-tight">
          <div class="ac-ph-row">
            <div class="ac-ph-c">
              <h1 class="ac-title">${COPY.heading}</h1>
              <p class="ac-sub">${COPY.subtitle}</p>
            </div>
          </div>
        </div>
        <div class="ac-tabs-pad">
          <div class="ac-tabs" role="tablist">
            ${TABS.map((tab) => `<a class="ac-tab" role="tab" aria-selected="${tab.value === active}" href="${esc(`${M.R.orgSettings}?tab=${tab.value}`)}">${tab.label}</a>`).join('')}
          </div>
        </div>
        <div id="os-tab">${TAB_VIEWS[active].html(S)}</div>
      </div>`;
  }

  function wire(S, ctx) {
    TAB_VIEWS[currentTab()].wire(S, ctx);
  }

  /* ======================================================================== General */
  const general = {
    html(S) {
      const swatches = P.COLOR_PRESETS.map(
        (preset) => `
          <button type="button" class="ac-swatch" data-swatch="${preset.hex}" aria-label="${SWATCH_LABELS[preset.id]}" aria-pressed="false"><i style="background:${preset.hex}"></i></button>`
      ).join('');

      return `
        <div class="ac-fg">
          <fieldset class="ac-fs ac-fs-tight">
            <div class="ac-fg">
              <div class="ac-field">
                <label class="ac-label" for="os-name">${COPY.orgName}</label>
                <input class="ac-input ac-w60" id="os-name" type="text" autocomplete="organization" />
                <p class="ac-err" id="os-name-err" hidden></p>
              </div>
              <div class="ac-field"><div id="os-logo"></div></div>
            </div>
          </fieldset>

          <div class="ac-sep" role="separator" style="margin:0;height:12px"></div>

          <fieldset class="ac-fs">
            <legend class="ac-legend">${COPY.theme}</legend>
            <p class="ac-desc">${COPY.themeSub}</p>
            <div class="ac-field">
              <div class="ac-swatches" id="os-swatches">
                ${swatches}
                <label class="ac-swatch custom" id="os-custom" aria-label="Custom theme"><i></i>${U.icon('plus', 24)}<input type="color" id="os-color" aria-label="Custom theme colour" /></label>
              </div>
              <span class="ac-hex" id="os-hex" hidden></span>
            </div>
          </fieldset>
        </div>
        ${U.settingsBarHTML({ status: COPY.unsaved, discard: COPY.discard, save: COPY.save })}`;
    },

    wire(S, { commit, rerender }) {
      const saved = { name: P.brandNameOf(S), logo: S.logoDataUrl || '' };
      const draft = { ...saved };
      let isSaving = false;

      const nameInput = $('#os-name');
      nameInput.value = draft.name;

      const uploader = U.uploadImage($('#os-logo'), {
        src: draft.logo,
        round: false,
        size: 'lg',
        initials: P.initials(draft.name).slice(0, 2),
        onChange: (dataUrl) => {
          draft.logo = dataUrl;
          updateBar();
        }
      });

      const isDirty = () => draft.name !== saved.name || draft.logo !== saved.logo;
      const updateBar = () => {
        $('#ac-savebar').hidden = !isDirty();
      };

      nameInput.addEventListener('input', () => {
        draft.name = nameInput.value;
        setError('#os-name-err', '');
        nameInput.setAttribute('aria-invalid', 'false');
        updateBar();
      });

      /* The theme saves on its own (production debounces an update by two seconds) and shows no bar. */
      const paintTheme = () => {
        const color = S.primary || P.DEFAULT_PRIMARY;
        const preset = P.COLOR_PRESETS.find((item) => sameColor(item.hex, color));

        $$('.ac-swatch[data-swatch]').forEach((button) => {
          const on = sameColor(button.dataset.swatch, color);
          button.setAttribute('aria-pressed', String(on));
          button.style.borderColor = on ? button.dataset.swatch : 'transparent';
        });

        const custom = $('#os-custom');
        custom.classList.toggle('on', !preset);
        custom.style.borderColor = preset ? 'transparent' : color;
        custom.querySelector('i').style.background = preset ? '' : color;
        const hexValue = P.formatColor(color, 'hex');
        $('#os-color').value = /^#[0-9a-f]{6}$/i.test(hexValue) ? hexValue : '#0233bd';
        $('#os-hex').hidden = Boolean(preset);
        $('#os-hex').textContent = preset ? '' : color;
        document.documentElement.style.cssText = P.brandVars(color);
      };

      $$('.ac-swatch[data-swatch]').forEach((button) =>
        button.addEventListener('click', () => {
          if (sameColor(S.primary, button.dataset.swatch)) return;

          S.primary = button.dataset.swatch;
          commit();
          paintTheme();
        })
      );
      $('#os-color').addEventListener('input', (event) => {
        S.primary = event.target.value;
        paintTheme();
      });
      $('#os-color').addEventListener('change', () => commit());
      paintTheme();

      $('#ac-discard').addEventListener('click', () => {
        draft.name = saved.name;
        draft.logo = saved.logo;
        nameInput.value = saved.name;
        uploader.set(saved.logo);
        setError('#os-name-err', '');
        updateBar();
      });

      $('#ac-save').addEventListener('click', () => {
        if (isSaving) return;

        const name = draft.name.trim();
        const message = name.length < 5 ? COPY.nameMin : /^-|-$/.test(name) ? COPY.nameHyphen : '';
        setError('#os-name-err', message);
        nameInput.setAttribute('aria-invalid', message ? 'true' : 'false');

        if (message) {
          P.toast(message, { error: true });

          return;
        }

        isSaving = true;
        const button = $('#ac-save');
        button.disabled = true;
        button.classList.add('ac-btn-spin');

        setTimeout(() => {
          const logoChanged = draft.logo !== saved.logo;

          S.brandName = name;
          S.company = name;
          if (draft.logo) S.logoDataUrl = draft.logo;
          if (logoChanged && draft.logo) S.steps = { ...(S.steps ?? {}), organization: true };
          commit();

          Object.assign(saved, { name, logo: draft.logo });
          draft.name = name;
          isSaving = false;
          rerender();
          P.toast(COPY.updated);
        }, 350);
      });

      U.guardUnsaved(isDirty);
      updateBar();
    }
  };

  /* ======================================================================== Custom Domain */
  const DOMAIN_COPY = {
    add: 'Add',
    body: 'Create a custom URL so your audience can get to your organization easily',
    url: 'URL',
    update: 'Update Domain',
    custom: 'Custom domain',
    upgrade: 'Upgrade your plan to add custom domains',
    yourDomain: 'Your Domain',
    save: 'Save',
    dnsName: 'Name',
    dnsValue: 'Value',
    recordActive: 'Detected',
    recordPending: 'Pending',
    sslHeading: 'SSL certificate is being issued',
    sslBody:
      "Your domain is pointing to us. We're now waiting for the SSL certificate to be issued and deployed. This usually takes a few minutes once all DNS records below are in place.",
    refresh: 'Refresh',
    remove: 'Remove',
    verifiedSnack: 'Custom domain verified',
    favicon: 'Custom favicon',
    faviconDesc:
      'Shown in browser tabs when visitors open your public school site. Falls back to your organization logo when unset.',
    faviconSave: 'Save favicon',
    faviconRemove: 'Remove favicon',
    faviconSaved: 'Favicon updated',
    code: 'Custom code',
    comingSoon: 'Coming soon',
    topLevel:
      "You can't add a top level domain as custom domain. Instead, use a subdomain like 'courses.[yourwebsite].com' or 'www.[yourwebsite].com'.",
    notClassroomio: "Domain cannot contain 'classroomio'",
    paidOnly: 'Custom domains are only available on paid plans',
    siteMin: 'Academy subdomain must contain 5 or more characters',
    siteHyphen: 'Academy subdomain cannot start or end with a hyphen',
    siteTaken: 'Sitename already exists.'
  };

  const STATUS = {
    verified: { label: 'Verified', cls: 'ok', dot: '#4ade80', text: 'This custom domain is active and verified.' },
    pending_dns: {
      label: 'Pending DNS',
      cls: 'wait',
      dot: '#facc15',
      text: 'Add the DNS records below, then refresh verification.'
    },
    pending_verification: {
      label: 'Pending verification',
      cls: 'wait',
      dot: '#facc15',
      text: 'DNS records were found. SSL issuance or validation is still in progress.'
    }
  };

  function sanitizeDomain(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');
  }

  function isValidDomain(value) {
    return /^(?!-)([a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/.test(value);
  }

  function apexOf(hostname) {
    const labels = hostname.split('.');
    const twoPart = ['co.uk', 'com.au', 'co.za', 'com.ng', 'co.in', 'com.br'];
    const tail2 = labels.slice(-2).join('.');

    return twoPart.includes(tail2) ? labels.slice(-3).join('.') : tail2;
  }

  function stripZone(name, apex) {
    if (name === apex) return '@';
    if (name.endsWith(`.${apex}`)) return name.slice(0, -apex.length - 1);

    return name;
  }

  function dnsRecordsFor(hostname) {
    return [
      { type: 'CNAME', name: hostname, value: `cname.${TENANT_ROOT_DOMAIN}`, status: 'pending' },
      {
        type: 'TXT',
        name: `_cf-custom-hostname.${hostname}`,
        value: `cio-${P.slugify(hostname).slice(0, 12)}-7f3a9c1e5b2d`,
        status: 'pending'
      }
    ];
  }

  const domains = {
    html(S) {
      const free = U.isFreePlan(S);
      const domain = S.customDomain;

      const domainSection = domain
        ? domainDetailHTML(domain)
        : `
          <div class="ac-field">
            <label class="ac-label" for="os-domain" style="font-weight:700">${DOMAIN_COPY.yourDomain}</label>
            <div class="ac-domain" data-invalid="false" id="os-domain-box"><input class="ac-input" id="os-domain" type="text" placeholder="yourwebsite.com"${free ? ' disabled' : ''} /></div>
            <p class="ac-err" id="os-domain-err" hidden></p>
          </div>
          <div class="ac-field ac-row"><button type="button" class="btn btn-primary" id="os-domain-save" disabled>${DOMAIN_COPY.save}</button></div>`;

      return `
        <div class="ac-fg">
          <fieldset class="ac-fs">
            <legend class="ac-legend">${DOMAIN_COPY.add}</legend>
            <p class="ac-desc">${DOMAIN_COPY.body}</p>
            <div class="ac-field">
              <label class="ac-label" for="os-site">${DOMAIN_COPY.url}</label>
              <div class="ac-domain" id="os-site-box"><span class="ac-dm-add">https://</span><input class="ac-input" id="os-site" type="text" placeholder="myschool" /><span class="ac-dm-add end">.${TENANT_ROOT_DOMAIN}</span></div>
              <p class="ac-err" id="os-site-err" hidden></p>
            </div>
            <div class="ac-field ac-row">
              <button type="button" class="btn btn-outline" id="os-site-save">${DOMAIN_COPY.update}</button>
              <a class="btn btn-primary" href="${esc(M.R.home)}" target="_blank" rel="noopener" style="margin-left:8px">${COPY.visit}${U.icon('ext', 16)}</a>
            </div>
          </fieldset>

          <div class="ac-sep" role="separator"></div>

          <fieldset class="ac-fs">
            <legend class="ac-legend">${DOMAIN_COPY.custom}</legend>
            ${free ? U.upgradeBannerHTML(DOMAIN_COPY.upgrade) : ''}
            <div class="ac-fg">${domainSection}</div>
          </fieldset>

          <div class="ac-sep" role="separator"></div>

          <fieldset class="ac-fs">
            <legend class="ac-legend">${DOMAIN_COPY.favicon}</legend>
            <p class="ac-desc">${DOMAIN_COPY.faviconDesc}</p>
            <div class="ac-field"><div id="os-favicon"></div></div>
            <div class="ac-field ac-row">
              <button type="button" class="btn btn-primary" id="os-fav-save" disabled>${DOMAIN_COPY.faviconSave}</button>
              ${S.faviconDataUrl ? `<button type="button" class="btn btn-secondary" id="os-fav-remove">${DOMAIN_COPY.faviconRemove}</button>` : ''}
            </div>
          </fieldset>

          <div class="ac-sep" role="separator"></div>

          <fieldset class="ac-fs">
            <legend class="ac-legend">${DOMAIN_COPY.code}</legend>
            <div>${U.badge('default', DOMAIN_COPY.comingSoon)}</div>
            <div class="ac-field"><textarea class="ac-textarea" rows="7" disabled style="width:80%" placeholder="e.g &lt;link rel='stylesheet' href='https://example.com/style.css' /&gt;"></textarea></div>
          </fieldset>
        </div>`;
    },

    wire(S, { commit, rerender }) {
      const siteInput = $('#os-site');
      siteInput.value = S.siteName || M.orgInfo(S).siteName;

      const clearSite = () => {
        setError('#os-site-err', '');
        $('#os-site-box').dataset.invalid = 'false';
      };
      siteInput.addEventListener('input', () => {
        siteInput.value = siteInput.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        clearSite();
      });
      $('#os-site-save').addEventListener('click', () => {
        const siteName = siteInput.value.trim();
        const message =
          siteName.length < 5
            ? DOMAIN_COPY.siteMin
            : /^-|-$/.test(siteName)
              ? DOMAIN_COPY.siteHyphen
              : BLOCKED_SUBDOMAINS.includes(siteName)
                ? DOMAIN_COPY.siteTaken
                : '';

        setError('#os-site-err', message);
        $('#os-site-box').dataset.invalid = message ? 'true' : 'false';

        if (message) return;

        S.siteName = siteName;
        commit();
        rerender();
        P.toast(COPY.updated);
      });

      U.wireUpgrade(document, S, commit, rerender);

      /* custom domain */
      const domainInput = $('#os-domain');

      if (domainInput) {
        const validate = () => {
          const value = sanitizeDomain(domainInput.value);
          $('#os-domain-save').disabled = !isValidDomain(value);
          setError('#os-domain-err', '');
          $('#os-domain-box').dataset.invalid = 'false';
        };

        domainInput.addEventListener('input', validate);
        $('#os-domain-save').addEventListener('click', () => {
          const hostname = sanitizeDomain(domainInput.value);
          const message = U.isFreePlan(S)
            ? DOMAIN_COPY.paidOnly
            : hostname.includes('classroomio')
              ? DOMAIN_COPY.notClassroomio
              : hostname.split('.').length < 3 && !/^www\./.test(hostname)
                ? DOMAIN_COPY.topLevel
                : '';

          if (message) {
            setError('#os-domain-err', message);
            $('#os-domain-box').dataset.invalid = 'true';

            return;
          }

          S.customDomain = { hostname, status: 'pending_dns', records: dnsRecordsFor(hostname), refreshes: 0 };
          commit();
          rerender();
          P.toast('Domain connected (simulated: no DNS is checked)');
        });
      } else {
        const domain = S.customDomain;

        $('#os-domain-open')?.addEventListener('click', () =>
          P.toast(`This opens https://${domain.hostname} in the real product.`)
        );
        $$('[data-domain-remove]').forEach((button) =>
          button.addEventListener('click', async () => {
            const ok = await U.confirm({
              title: 'Remove custom domain',
              body: `${esc(domain.hostname)} will stop serving your academy.`,
              confirm: DOMAIN_COPY.remove,
              danger: true
            });
            if (!ok) return;

            delete S.customDomain;
            commit();
            rerender();
            P.toast('Domain removed (simulated)');
          })
        );
        $('#os-domain-refresh')?.addEventListener('click', () => {
          domain.refreshes += 1;

          if (domain.refreshes === 1) {
            domain.status = 'pending_verification';
            domain.records.forEach((record) => (record.status = 'active'));
          } else {
            domain.status = 'verified';
            P.toast(DOMAIN_COPY.verifiedSnack);
          }

          commit();
          rerender();
        });
        $$('[data-copy]').forEach((button) =>
          button.addEventListener('click', () => {
            navigator.clipboard?.writeText(button.dataset.copy).catch(() => {});
            P.toast('Copied to clipboard');
          })
        );
      }

      /* favicon */
      let pending = '';
      const favSave = $('#os-fav-save');
      U.uploadImage($('#os-favicon'), {
        src: S.faviconDataUrl || S.logoDataUrl || '',
        round: false,
        size: 'sm',
        row: true,
        maxMb: 2,
        initials: P.initials(P.brandNameOf(S)).slice(0, 2),
        onChange: (dataUrl) => {
          pending = dataUrl;
          favSave.disabled = false;
        }
      });
      favSave.addEventListener('click', () => {
        if (!pending) return;

        S.faviconDataUrl = pending;
        commit();
        rerender();
        P.toast(DOMAIN_COPY.faviconSaved);
      });
      $('#os-fav-remove')?.addEventListener('click', () => {
        delete S.faviconDataUrl;
        commit();
        rerender();
        P.toast(DOMAIN_COPY.faviconSaved);
      });
    }
  };

  function domainDetailHTML(domain) {
    const status = STATUS[domain.status] ?? STATUS.pending_dns;
    const apex = apexOf(domain.hostname);
    const showRecords = domain.status !== 'verified';

    return `
      <div class="ac-field">
        <div class="ac-spread">
          <div>
            <p class="ac-medium" style="display:flex;align-items:center;gap:8px;margin:0">
              ${esc(domain.hostname)}
              <button type="button" class="btn btn-outline btn-sm ac-btn-icon" id="os-domain-open" aria-label="Open ${esc(domain.hostname)}">${U.icon('arrow-up-right', 16)}</button>
            </p>
            <span class="ac-dot" style="background:${status.dot}"></span>
          </div>
          <span class="ac-pill ${status.cls}">${status.label}</span>
          <button type="button" class="ac-iconbtn" data-domain-remove aria-label="Remove domain">${U.icon('trash', 16)}</button>
        </div>
      </div>
      <p class="ac-desc">${status.text}</p>
      ${
        domain.status === 'pending_verification'
          ? `<div class="ac-callout amber">${U.icon('shield', 16)}<div><p><b>${DOMAIN_COPY.sslHeading}</b></p><p style="margin-top:4px">${DOMAIN_COPY.sslBody}</p></div></div>`
          : ''
      }
      ${
        showRecords
          ? `<div class="ac-dns">${domain.records
              .map((record, index) => {
                const rows = [
                  [DOMAIN_COPY.dnsName, stripZone(record.name, apex)],
                  [DOMAIN_COPY.dnsValue, record.value]
                ];

                return `
              <div class="ac-dns-rec">
                <div class="top">
                  <span class="ac-dns-type${record.type === 'TXT' ? ' txt' : ''}">${record.type}</span>
                  <span class="ac-muted ac-text-xs">Record ${index + 1} of ${domain.records.length}</span>
                  <span class="ac-pill ${record.status === 'active' ? 'ok' : 'wait'} ml">${record.status === 'active' ? `${U.icon('check', 12)}<span>${DOMAIN_COPY.recordActive}</span>` : `${U.icon('clock', 12)}<span>${DOMAIN_COPY.recordPending}...</span>`}</span>
                </div>
                <div class="ac-dns-cols">${rows
                  .map(
                    ([label, value]) => `
                  <div><div class="k">${label}</div><div class="v"><span title="${esc(value)}">${esc(value)}</span><button type="button" class="btn btn-outline btn-sm ac-btn-icon" data-copy="${esc(value)}" aria-label="Copy ${label}">${U.icon('copy', 16)}</button></div></div>`
                  )
                  .join('')}</div>
              </div>`;
              })
              .join('')}</div>
            <div class="ac-field ac-row">
              <button type="button" class="btn btn-outline" id="os-domain-refresh">${U.icon('rotate', 16)}${DOMAIN_COPY.refresh}</button>
              <button type="button" class="btn btn-destructive" data-domain-remove>${U.icon('trash', 16)}${DOMAIN_COPY.remove}</button>
            </div>`
          : ''
      }`;
  }

  /* ======================================================================== Team */
  const TEAM_COPY = {
    add: 'Add',
    addBody: 'Add your team mates or collaborators to your organization. Start working together',
    placeholder: 'user1@domain.com, user2@domain.com',
    sendInvite: 'Send Invite',
    copyLink: 'Copy invite link',
    selectRole: 'Select a role',
    members: 'Members',
    inviteSent: 'Invite Sent',
    you: 'You',
    remove: 'Remove',
    upgrade: 'Upgrade your plan to add team members',
    changeTitle: 'Change role',
    cancel: 'Cancel',
    approve: 'Approve'
  };

  function ensureTeam(S) {
    if (!Array.isArray(S.team)) S.team = [];

    if (!S.team.some((member) => member.self)) {
      S.team.unshift({
        id: 'self',
        self: true,
        email: S.email || 'you@example.com',
        fullname: S.fullname || 'You',
        roleId: ROLE.ADMIN,
        verified: true
      });
    }

    return S.team;
  }

  function validateEmails(value) {
    if (!value.trim()) return { error: 'Enter an email', emails: [] };

    const emails = value.split(',').map((item) => item.trim());
    const invalid = emails.filter((email) => !P.isEmail(email));

    return {
      error: invalid.length ? `Not valid email: ${invalid.join(', ')}` : '',
      emails
    };
  }

  function randomToken() {
    return `lnk_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
  }

  const teams = {
    html(S) {
      const free = U.isFreePlan(S);
      const team = ensureTeam(S);

      return `
        ${free ? `<div class="ac-tabs-pad" style="padding:0">${U.upgradeBannerHTML(TEAM_COPY.upgrade)}</div>` : ''}
        <div class="ac-fg ac-fg-3xl">
          <fieldset class="ac-fs">
            <legend class="ac-legend">${TEAM_COPY.add}</legend>
            <p class="ac-desc" style="margin-bottom:20px">${TEAM_COPY.addBody}</p>
            <div class="ac-team-form">
              <div class="ac-field" style="min-width:0">
                <input class="ac-input" id="tm-emails" type="text" placeholder="${TEAM_COPY.placeholder}"${free ? ' disabled' : ''} aria-label="Team member emails" />
                <p class="ac-err" id="tm-err" hidden></p>
              </div>
              <div style="width:100%">
                <div id="tm-role"></div>
                <button type="button" class="ac-btn-link" id="tm-link" style="display:inline-flex;align-items:center;gap:4px;margin-top:4px"${free ? ' disabled' : ''}>${U.icon('copy', 14)}${TEAM_COPY.copyLink}</button>
              </div>
              <div><button type="button" class="btn btn-primary" id="tm-send"${free ? ' disabled' : ''}>${TEAM_COPY.sendInvite}</button></div>
            </div>
          </fieldset>

          <div class="ac-sep" role="separator"></div>

          <fieldset class="ac-fs">
            <legend class="ac-legend">${TEAM_COPY.members}</legend>
            <div class="ac-fg" id="tm-members">${team.map((member) => memberHTML(S, member, free)).join('')}</div>
          </fieldset>
        </div>`;
    },

    wire(S, { commit, rerender }) {
      const free = U.isFreePlan(S);
      let inviteRole = String(ROLE.TUTOR);

      U.wireUpgrade(document, S, commit, rerender);

      U.select($('#tm-role'), {
        value: inviteRole,
        options: [
          { value: String(ROLE.ADMIN), label: ROLE_LABEL[ROLE.ADMIN] },
          { value: String(ROLE.TUTOR), label: ROLE_LABEL[ROLE.TUTOR] }
        ],
        placeholder: TEAM_COPY.selectRole,
        disabled: free,
        ariaLabel: 'Role',
        onChange: (value) => (inviteRole = value)
      });

      $('#tm-emails').addEventListener('input', () => setError('#tm-err', ''));

      $('#tm-send').addEventListener('click', () => {
        const { error, emails } = validateEmails($('#tm-emails').value);
        setError('#tm-err', error);

        if (error) return;

        const team = ensureTeam(S);
        const known = new Set(team.map((member) => member.email.toLowerCase()));

        emails.forEach((email) => {
          if (known.has(email.toLowerCase())) return;

          team.push({
            id: M.newId('member'),
            email,
            fullname: email.split('@')[0],
            roleId: Number(inviteRole),
            verified: false,
            invitedAt: Date.now()
          });
        });
        commit();
        rerender();
        P.toast('Invite Sent! (simulated: no email was sent)');
      });

      $('#tm-link').addEventListener('click', () => {
        if (!S.linkInvite) {
          S.linkInvite = { token: randomToken(), roleId: Number(inviteRole) };
          P.toast('Link invite generated');
        }

        S.linkInvite.roleId = Number(inviteRole);
        commit();
        navigator.clipboard
          ?.writeText(`https://app.classroomio.com/invite/link/${encodeURIComponent(S.linkInvite.token)}`)
          .catch(() => {});
        P.toast('Invite link copied');
      });

      const team = ensureTeam(S);

      $$('[data-member-role]').forEach((mount) => {
        const member = team.find((item) => item.id === mount.dataset.memberRole);

        U.select(mount, {
          value: String(member.roleId),
          small: true,
          disabled: free,
          ariaLabel: `Role for ${member.email}`,
          options: [
            { value: String(ROLE.ADMIN), label: ROLE_LABEL[ROLE.ADMIN] },
            { value: String(ROLE.TUTOR), label: ROLE_LABEL[ROLE.TUTOR] }
          ],
          onChange: (value) => {
            const next = Number(value);

            if (next === member.roleId) return;

            U.dialog({
              title: TEAM_COPY.changeTitle,
              size: 'md',
              description: `Change ${esc(member.email)} from ${ROLE_LABEL[member.roleId]} to ${ROLE_LABEL[next]}?`,
              footer: `<button type="button" class="btn btn-outline btn-sm" data-no>${TEAM_COPY.cancel}</button><button type="button" class="btn btn-primary btn-sm" data-yes>${TEAM_COPY.approve}</button>`,
              onClose: () => rerender(),
              wire(ctl) {
                ctl.$('[data-no]').addEventListener('click', () => ctl.close());
                ctl.$('[data-yes]').addEventListener('click', () => {
                  member.roleId = next;
                  commit();
                  ctl.close();
                  P.toast('Role updated');
                });
              }
            });
          }
        });
      });

      $$('[data-member-remove]').forEach((button) =>
        button.addEventListener('click', async () => {
          const member = team.find((item) => item.id === button.dataset.memberRemove);
          const ok = await U.confirm({
            title: 'Remove team member',
            body: `${esc(member.email)} will lose access to this organization.`,
            confirm: TEAM_COPY.remove,
            danger: true
          });

          if (!ok) return;

          S.team = team.filter((item) => item.id !== member.id);
          commit();
          rerender();
          P.toast('Member removed successfully');
        })
      );
    }
  };

  function memberHTML(S, member, free) {
    const canManage = !member.self;

    return `
      <div class="ac-field">
        <div class="ac-member">
          <div>
            <p class="em" style="margin:0 12px 0 0;color:#6b7280;font-size:14px">${esc(member.email)}</p>
            ${canManage ? `<span data-member-role="${esc(member.id)}" style="margin-right:12px"></span>` : U.badge('secondary', ROLE_LABEL[member.roleId], 'ac-text-xs')}
            ${!member.verified ? U.badge('outline', TEAM_COPY.inviteSent, 'ac-badge-yellow ac-text-xs') : member.self ? U.badge('default', TEAM_COPY.you) : ''}
          </div>
          ${canManage ? `<button type="button" class="btn btn-ghost ac-danger-ghost" data-member-remove="${esc(member.id)}"${free ? ' disabled' : ''}>${TEAM_COPY.remove}</button>` : ''}
        </div>
      </div>`;
  }

  /* ======================================================================== Customize LMS */
  const LMS_COPY = {
    language: 'Language',
    languageDesc: 'Choose the language used for the student-facing LMS interface.',
    defaultLanguage: 'Default language',
    enforce: 'Enforce this language for students',
    enabled: 'Enabled',
    disabled: 'Disabled',
    dashboard: 'Dashboard',
    community: 'Community',
    exercises: 'Exercises',
    bannerImage: 'Banner Image',
    bannerImageBtn: 'Update banner image',
    bannerText: 'Banner Text',
    bannerTextPlaceholder: 'Write the text here',
    authTitle: 'Sign-in screen',
    authDesc: "Optional background image behind login, signup, and other account pages on your organization's site.",
    authPaid: 'Upgrade your plan to customize the sign-in background.',
    replace: 'Replace',
    reset: 'Reset',
    previewAlt: 'Sign-in background preview',
    course: 'Course',
    newsfeed: 'Newsfeed',
    grading: 'Grading',
    apps: 'Apps',
    poll: 'Poll',
    liveComments: 'Live comments'
  };

  const LANGUAGES = [
    ['da', 'Danish'], ['de', 'German'], ['en', 'English'], ['es', 'Spanish'], ['fr', 'French'], ['hi', 'Hindi'],
    ['it', 'Italian'], ['pl', 'Polish'], ['pt', 'Portuguese'], ['ru', 'Russian'], ['tr', 'Turkish'], ['vi', 'Vietnamese']
  ].map(([value, label]) => ({ value, label }));

  function defaultCustomization() {
    return {
      auth: { backgroundImage: '' },
      apps: { poll: true, comments: true },
      course: { grading: true, newsfeed: true },
      dashboard: { exercise: true, community: true, bannerText: '', bannerImage: '' }
    };
  }

  /* custom/editor ImageUploadModal as UploadWidget uses it: the Upload and Link tabs ("Insert image"). */
  function insertImageDialog(onPick) {
    const tabsHTML = (active) =>
      `<div class="ac-tabs" role="tablist"><button type="button" class="ac-tab" role="tab" aria-selected="${active === 'upload'}" data-t="upload">Upload</button><button type="button" class="ac-tab" role="tab" aria-selected="${active === 'link'}" data-t="link">Link</button></div>`;

    U.dialog({
      title: 'Insert image',
      size: 'lg',
      body: `<div id="ii-tabs">${tabsHTML('upload')}</div><div id="ii-pane"></div>`,
      wire(ctl) {
        const paint = (active) => {
          ctl.$('#ii-tabs').innerHTML = tabsHTML(active);
          ctl.$('#ii-pane').innerHTML =
            active === 'upload'
              ? `<label class="ac-dropzone" id="ii-drop" style="margin-top:12px"><span style="display:flex">${U.icon('upload', 24)}</span><b>Drag and drop an image here, or click to select</b><small>JPG, PNG or WebP, up to 2MB</small><input type="file" id="ii-file" accept=".jpg,.jpeg,.png,.webp" hidden /></label>`
              : `<div class="ac-stack12" style="margin-top:12px"><input class="ac-input" id="ii-url" type="url" placeholder="https://example.com/image.png" /><button type="button" class="btn btn-primary" id="ii-insert" style="align-self:flex-start">Insert</button></div>`;

          ctl.$$('[data-t]').forEach((tab) => tab.addEventListener('click', () => paint(tab.dataset.t)));

          const file = ctl.$('#ii-file');
          const take = async (picked) => {
            if (!picked) return;

            if (picked.size > 2 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/.test(picked.type)) {
              P.toast('Pick a JPG, PNG or WebP image under 2MB.', { error: true });

              return;
            }

            const reader = new FileReader();
            reader.onload = () => {
              onPick(String(reader.result));
              ctl.close();
            };
            reader.readAsDataURL(picked);
          };

          file?.addEventListener('change', () => take(file.files?.[0]));
          const drop = ctl.$('#ii-drop');
          drop?.addEventListener('dragover', (event) => {
            event.preventDefault();
            drop.classList.add('over');
          });
          drop?.addEventListener('dragleave', () => drop.classList.remove('over'));
          drop?.addEventListener('drop', (event) => {
            event.preventDefault();
            drop.classList.remove('over');
            take(event.dataTransfer?.files?.[0]);
          });
          ctl.$('#ii-insert')?.addEventListener('click', () => {
            const url = ctl.$('#ii-url').value.trim();

            if (!/^https?:\/\//i.test(url)) {
              P.toast('Enter an http(s) image link.', { error: true });

              return;
            }

            onPick(url);
            ctl.close();
          });
        };

        paint('upload');
      }
    });
  }

  function switchRow(label, key, on) {
    return `
      <div class="ac-field ac-row">
        <label class="ac-label">${label}</label>
        ${U.switchHTML({ checked: on, attrs: `data-lms="${key}"`, label })}
        <p class="ac-desc" data-lms-state="${key}">${on ? LMS_COPY.enabled : LMS_COPY.disabled}</p>
      </div>`;
  }

  const lms = {
    html(S) {
      const custom = S.customization ?? defaultCustomization();
      const language = S.lmsLanguage ?? { locale: 'en', enforced: false };
      const free = U.isFreePlan(S);
      const bg = custom.auth.backgroundImage;

      return `
        <div class="ac-fg">
          <fieldset class="ac-fs">
            <legend class="ac-legend">${LMS_COPY.language}</legend>
            <p class="ac-desc">${LMS_COPY.languageDesc}</p>
            <div class="ac-fg">
              <div class="ac-field"><label class="ac-label">${LMS_COPY.defaultLanguage}</label><div id="lms-lang"></div></div>
              <div class="ac-field ac-row">${U.switchHTML({ checked: language.enforced, attrs: 'data-lms="enforced"', label: LMS_COPY.enforce })}<label class="ac-label">${LMS_COPY.enforce}</label></div>
            </div>
          </fieldset>

          <div class="ac-sep" role="separator"></div>

          <fieldset class="ac-fs">
            <legend class="ac-legend">${LMS_COPY.dashboard}</legend>
            <div class="ac-fg">
              ${switchRow(LMS_COPY.community, 'community', custom.dashboard.community)}
              ${switchRow(LMS_COPY.exercises, 'exercise', custom.dashboard.exercise)}
              <div class="ac-field">
                <label class="ac-label">${LMS_COPY.bannerImage}</label>
                <div><button type="button" class="btn btn-outline" id="lms-banner">${LMS_COPY.bannerImageBtn}</button></div>
                <img alt="Banner" id="lms-banner-img" style="margin-top:8px;width:100%;border-radius:6px"${custom.dashboard.bannerImage ? ` src="${esc(custom.dashboard.bannerImage)}"` : ' hidden'} />
              </div>
              <div class="ac-field">
                <label class="ac-label" for="lms-banner-text">${LMS_COPY.bannerText}</label>
                <input class="ac-input" id="lms-banner-text" type="text" placeholder="${LMS_COPY.bannerTextPlaceholder}" />
              </div>
            </div>
          </fieldset>

          <div class="ac-sep" role="separator"></div>

          <fieldset class="ac-fs">
            <legend class="ac-legend">${LMS_COPY.authTitle}</legend>
            <p class="ac-desc">${LMS_COPY.authDesc}</p>
            ${free ? `<p class="ac-desc">${LMS_COPY.authPaid}</p>` : ''}
            <div class="ac-fg">
              <div class="ac-field ac-row" style="gap:8px">
                <button type="button" class="btn btn-primary" id="lms-bg-replace"${free ? ' disabled' : ''}>${LMS_COPY.replace}</button>
                <button type="button" class="btn btn-outline" id="lms-bg-reset"${free ? ' disabled' : ''}>${LMS_COPY.reset}</button>
              </div>
              <div class="ac-field"><img id="lms-bg-img" alt="${LMS_COPY.previewAlt}" src="${esc(bg || 'course-banner.jpg')}" style="width:280px;height:200px;min-width:280px;min-height:200px;border-radius:6px;object-fit:cover" /></div>
            </div>
          </fieldset>

          <div class="ac-sep" role="separator"></div>

          <fieldset class="ac-fs">
            <legend class="ac-legend">${LMS_COPY.course}</legend>
            <div class="ac-fg">
              ${switchRow(LMS_COPY.newsfeed, 'newsfeed', custom.course.newsfeed)}
              ${switchRow(LMS_COPY.grading, 'grading', custom.course.grading)}
            </div>
          </fieldset>

          <div class="ac-sep" role="separator"></div>

          <fieldset class="ac-fs">
            <legend class="ac-legend">${LMS_COPY.apps}</legend>
            <div class="ac-fg">
              ${switchRow(LMS_COPY.poll, 'poll', custom.apps.poll)}
              ${switchRow(LMS_COPY.liveComments, 'comments', custom.apps.comments)}
            </div>
          </fieldset>
        </div>
        ${U.settingsBarHTML({ status: COPY.unsaved, discard: COPY.discard, save: COPY.save })}`;
    },

    wire(S, { commit, rerender }) {
      const free = U.isFreePlan(S);
      const read = () => ({
        custom: structuredClone(S.customization ?? defaultCustomization()),
        language: structuredClone(S.lmsLanguage ?? { locale: 'en', enforced: false })
      });
      const savedSnapshot = () => JSON.stringify(read());
      let saved = savedSnapshot();
      const draft = read();
      let isSaving = false;

      const isDirty = () => JSON.stringify(draft) !== saved;
      const updateBar = () => {
        $('#ac-savebar').hidden = !isDirty();
      };

      const SETTERS = {
        community: (value) => (draft.custom.dashboard.community = value),
        exercise: (value) => (draft.custom.dashboard.exercise = value),
        newsfeed: (value) => (draft.custom.course.newsfeed = value),
        grading: (value) => (draft.custom.course.grading = value),
        poll: (value) => (draft.custom.apps.poll = value),
        comments: (value) => (draft.custom.apps.comments = value),
        enforced: (value) => (draft.language.enforced = value)
      };

      const language = U.select($('#lms-lang'), {
        value: draft.language.locale,
        options: LANGUAGES,
        ariaLabel: LMS_COPY.defaultLanguage,
        onChange: (value) => {
          draft.language.locale = value;
          updateBar();
        }
      });

      $$('[data-lms]').forEach((toggle) =>
        toggle.addEventListener('click', () => {
          const on = toggle.getAttribute('aria-checked') !== 'true';
          toggle.setAttribute('aria-checked', String(on));
          SETTERS[toggle.dataset.lms](on);

          const label = $(`[data-lms-state="${toggle.dataset.lms}"]`);
          if (label) label.textContent = on ? LMS_COPY.enabled : LMS_COPY.disabled;

          updateBar();
        })
      );

      const textInput = $('#lms-banner-text');
      textInput.value = draft.custom.dashboard.bannerText;
      textInput.addEventListener('input', () => {
        draft.custom.dashboard.bannerText = textInput.value;
        updateBar();
      });

      $('#lms-banner').addEventListener('click', () =>
        insertImageDialog((src) => {
          draft.custom.dashboard.bannerImage = src;
          const image = $('#lms-banner-img');
          image.src = src;
          image.hidden = false;
          updateBar();
        })
      );

      if (!free) {
        $('#lms-bg-replace').addEventListener('click', () =>
          insertImageDialog((src) => {
            draft.custom.auth.backgroundImage = src;
            $('#lms-bg-img').src = src;
            updateBar();
          })
        );
        $('#lms-bg-reset').addEventListener('click', () => {
          draft.custom.auth.backgroundImage = '';
          $('#lms-bg-img').src = 'course-banner.jpg';
          updateBar();
        });
      }

      $('#ac-discard').addEventListener('click', () => {
        const restored = JSON.parse(saved);
        draft.custom = restored.custom;
        draft.language = restored.language;
        rerender();
      });

      $('#ac-save').addEventListener('click', () => {
        if (isSaving) return;

        isSaving = true;
        const button = $('#ac-save');
        button.disabled = true;
        button.classList.add('ac-btn-spin');

        setTimeout(() => {
          S.customization = structuredClone(draft.custom);
          S.lmsLanguage = structuredClone(draft.language);
          commit();
          saved = savedSnapshot();
          isSaving = false;
          rerender();
          P.toast(COPY.updated);
        }, 350);
      });

      void language;
      U.guardUnsaved(isDirty);
      updateBar();
    }
  };

  const TAB_VIEWS = { general, domains, teams, 'customize-lms': lms };

  window.PAGES = window.PAGES || {};
  window.PAGES.settings = { title: 'Settings', html, wire };
})();
