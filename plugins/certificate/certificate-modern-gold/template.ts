import { defineCertificateTemplate, type CertificateTemplateDefinition } from '@cio/sdk';

export interface ModernGoldTemplateOptions {
  label?: string;
  description?: string;
}

export function createModernGoldTemplate(options: ModernGoldTemplateOptions = {}): CertificateTemplateDefinition {
  return defineCertificateTemplate({
    id: 'modern_gold',
    ...(options.label ? { label: options.label } : { labelKey: 'plugins.certificate_modern_gold.template_name' }),
    ...(options.description
      ? { description: options.description }
      : { descriptionKey: 'plugins.certificate_modern_gold.template_description' }),
    body: `
      <div class="t-modern-gold">
        <div class="outer-frame">
          <div class="inner-frame">
            <div class="corner corner-tl"></div>
            <div class="corner corner-tr"></div>
            <div class="corner corner-bl"></div>
            <div class="corner corner-br"></div>

            <header class="header">
              <div class="org-name">{{orgName}}</div>
              <div class="cert-meta">
                <span class="cert-id">{{certificateId}}</span>
                <span aria-hidden="true">&middot;</span>
                <span class="cert-date">{{date}}</span>
              </div>
            </header>

            <div class="seal-icon" aria-hidden="true">
              <svg viewBox="0 0 100 100" class="gold-seal">
                <circle cx="50" cy="50" r="45" fill="none" stroke="{{accentColor}}" stroke-width="2" stroke-dasharray="4,2" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="{{accentColor}}" stroke-width="1" />
                <polygon points="50,15 61,38 85,38 66,53 73,76 50,62 27,76 34,53 15,38 39,38" fill="{{accentColor}}" opacity="0.85" />
              </svg>
            </div>

            <div class="title-group">
              <h1 class="main-title">{{certificateTitle}}</h1>
              <div class="subtitle-wrapper">
                <span class="decor-line"></span>
                <span class="subtitle">{{subtitle}}</span>
                <span class="decor-line"></span>
              </div>
            </div>

            <div class="recipient-group">
              <p class="proudly-presented">{{presentedToLabel}}</p>
              <div class="recipient-name">{{recipientName}}</div>
              <p class="course-text">{{completionLabel}}</p>
              <div class="course-title">{{courseName}}</div>
              <p class="description-text">{{courseDescription}}</p>
            </div>

            <footer class="footer">
              <div class="signatory {{signatoryOneState}}">
                <div class="sig-line"></div>
                <div class="sig-name">{{signatoryOneName}}</div>
                <div class="sig-role">{{signatoryOneRole}}</div>
              </div>

              <div class="verified-stamp">
                <span class="verified-text">{{verifiedCredentialLabel}}</span>
              </div>

              <div class="signatory {{signatoryTwoState}}">
                <div class="sig-line"></div>
                <div class="sig-name">{{signatoryTwoName}}</div>
                <div class="sig-role">{{signatoryTwoRole}}</div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    `,
    styles: `
      .t-modern-gold {
        width: 1100px;
        height: 780px;
        box-sizing: border-box;
        background: radial-gradient(circle at center, #131b2e 0%, #0a0f1d 100%);
        color: #f8fafc;
        font-family: 'Cinzel', 'Cinzel Decorative', Georgia, serif;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }

      .t-modern-gold .outer-frame {
        width: 100%;
        height: 100%;
        border: 3px solid {{accentColor}};
        padding: 12px;
        box-sizing: border-box;
        position: relative;
      }

      .t-modern-gold .inner-frame {
        width: 100%;
        height: 100%;
        border: 1px solid {{accentColor}}66;
        box-sizing: border-box;
        padding: 32px 48px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        position: relative;
        background: rgba(15, 23, 42, 0.4);
      }

      .t-modern-gold .corner {
        position: absolute;
        width: 24px;
        height: 24px;
        border: 2px solid {{accentColor}};
      }
      .t-modern-gold .corner-tl { top: -6px; left: -6px; border-right: none; border-bottom: none; }
      .t-modern-gold .corner-tr { top: -6px; right: -6px; border-left: none; border-bottom: none; }
      .t-modern-gold .corner-bl { bottom: -6px; left: -6px; border-right: none; border-top: none; }
      .t-modern-gold .corner-br { bottom: -6px; right: -6px; border-left: none; border-top: none; }

      .t-modern-gold .header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: {{accentColor}};
      }

      .t-modern-gold .org-name { font-weight: 700; }
      .t-modern-gold .cert-meta { display: flex; gap: 8px; color: #94a3b8; }
      .t-modern-gold .seal-icon { width: 56px; height: 56px; margin: 4px 0; }
      .t-modern-gold .gold-seal { width: 100%; height: 100%; }
      .t-modern-gold .title-group { text-align: center; }

      .t-modern-gold .main-title {
        font-size: 34px;
        letter-spacing: 0.2em;
        margin: 0;
        color: #ffffff;
        font-weight: 700;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
      }

      .t-modern-gold .subtitle-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-top: 6px;
      }

      .t-modern-gold .decor-line { width: 60px; height: 1px; background: {{accentColor}}; }
      .t-modern-gold .subtitle {
        font-size: 13px;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: {{accentColor}};
      }

      .t-modern-gold .recipient-group {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        margin: 8px 0;
      }

      .t-modern-gold .proudly-presented,
      .t-modern-gold .course-text {
        font-size: 11px;
        letter-spacing: 0.3em;
        color: #94a3b8;
        margin: 0;
      }

      .t-modern-gold .recipient-name {
        font-family: 'Bodoni Moda', 'Playfair Display', Georgia, serif;
        font-size: 46px;
        color: #f1f5f9;
        font-weight: 600;
        letter-spacing: 0.05em;
        border-bottom: 2px solid {{accentColor}}88;
        padding-bottom: 8px;
        min-width: 450px;
        text-align: center;
      }

      .t-modern-gold .course-text { margin-top: 6px; letter-spacing: 0.25em; }
      .t-modern-gold .course-title {
        font-size: 26px;
        color: {{accentColor}};
        font-weight: 600;
        letter-spacing: 0.08em;
      }

      .t-modern-gold .description-text {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-style: italic;
        font-size: 16px;
        color: #cbd5e1;
        max-width: 680px;
        line-height: 1.4;
        margin: 4px 0 0;
      }

      .t-modern-gold .footer {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        padding-top: 16px;
      }

      .t-modern-gold .signatory { width: 220px; text-align: center; }
      .t-modern-gold .signatory.disabled { visibility: hidden; }
      .t-modern-gold .sig-line { width: 100%; height: 1px; background: {{accentColor}}99; margin-bottom: 8px; }
      .t-modern-gold .sig-name { font-size: 14px; font-weight: 600; color: #f8fafc; letter-spacing: 0.05em; }
      .t-modern-gold .sig-role {
        font-size: 11px;
        color: #94a3b8;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .t-modern-gold .verified-stamp {
        border: 1px solid {{accentColor}}88;
        padding: 6px 16px;
        border-radius: 4px;
        background: rgba(212, 175, 55, 0.05);
      }

      .t-modern-gold .verified-text {
        font-size: 10px;
        letter-spacing: 0.25em;
        color: {{accentColor}};
        font-weight: 600;
      }
    `
  });
}
