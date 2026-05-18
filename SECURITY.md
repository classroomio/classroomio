# Security Policy

  ClassroomIO values coordinated disclosure and responsible research. Please review this policy before testing or
  reporting any security issue.

  ## Supported Versions

  | Version | Supported | Notes |
  | ------- | --------- | ----- |
  | `main` branch | Yes | Actively developed |
  | Releases ≤ 6 months old | Yes | Prioritized for patches |
  | Older branches/releases | No | Out of scope |

  ## Reporting a Vulnerability

  1. **Contact us privately**
     Email `security@classroomio.com` or DM a maintainer on Discord with:
     - Summary of the issue
     - Affected files/endpoints (e.g., `apps/api/src/routes/mail.ts`)
     - Steps or payloads that reproduce the behavior
     - Impact assessment (confidentiality/integrity/availability)
     - Suggested remediation if known

  2. **We will acknowledge within 3 business days**
     High/Critical issues are targeted for resolution within 14 days. Lower-severity items will be triaged with you.

  3. **Use this template for faster triage**

  Summary:
  Affected files/endpoints:
  Steps to reproduce:
  Impact:
  Suggested remediation:


  4. **Do not disclose publicly** until we have shipped a fix or agreed on a timeline.

  ## Scope and Rules of Engagement

  - Allowed: code review, static analysis, and local testing using your own environment or the provided `.env.example`.
  - Allowed: interacting with self-hosted deployments or preview environments you control.
  - Not allowed: attacks against production classroomio.com infrastructure, denial of service, or accessing anyone
  else’s data.
  - Do not run automated scanners/fuzzers against production assets without written permission.

  When uncertain, contact us first.

  ## Testing Guidelines

  - **Authentication**: Most API routes require Supabase JWTs (`Authorization: Bearer …`). Use test accounts or local
  Supabase stacks.
  - **Rate limiting**: A Redis-backed limiter (`apps/api/src/middlewares/rate-limiter.ts`) guards sensitive routes. Keep
  manual testing below 10 RPS per endpoint.
  - **External services**: Avoid triggering production email (SMTP/Zoho), S3/R2 storage, or third-party APIs unless
  explicitly approved. Stub or mock these integrations during research.

  ## Severity Framework

  We map reports to OWASP/CVSS-style severities:

  | Severity | Example |
  | -------- | ------- |
  | Critical | Remote code execution, full database compromise |
  | High | Broken authentication/authorization, open email relays, ability to clone private courses |
  | Medium | CSRF on state-changing routes, rate-limit bypass, sensitive info exposure |
  | Low | Missing security headers, verbose error messages, debug configs in production |

  Provide your reasoning if the classification is unclear.

  ## Coordinated Disclosure

  After a fix is validated and deployed, we will credit reporters (unless anonymity is requested) in release notes or
  advisories. If we cannot remediate within the agreed timeframe, you may disclose after notifying us.

  ---

  Thank you for helping keep ClassroomIO secure. Reach out via email or Discord if you plan substantial testing or need
  clarification before filing a report.
