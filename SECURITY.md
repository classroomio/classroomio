# Security Policy

ClassroomIO takes the security of the platform and its users seriously. This
policy explains which versions are supported, how to report a vulnerability,
and what testing is safe and acceptable.

## Supported Versions

Security fixes are prioritized for the latest stable release. The previous
stable release may receive a backport when the fix is practical and the
release is still in active use.

| Version | Support |
| --- | --- |
| Latest stable release | Supported |
| Previous stable release | Best effort |
| `main` | Development only; reports are welcome |
| Older releases | Unsupported; upgrade before reporting a version-specific issue |

ClassroomIO publishes immutable version tags for pinned deployments. The
`latest` container tag follows `main` and may contain unreleased changes; it
is not considered a stable version for production use.

## Reporting a Vulnerability

Do not report security vulnerabilities in a public GitHub issue, pull request,
or public Discord channel.

Please use one of these private channels:

- Email: [security@classroomio.com](mailto:security@classroomio.com)
- GitHub: [Private vulnerability reporting](https://github.com/classroomio/classroomio/security/advisories/new)
- Discord: [ClassroomIO community](https://dub.sh/ciodiscord). Ask a maintainer for a private conversation; do not post vulnerability details in a public channel.

Include as much of the following as you can:

- A clear description of the vulnerability and its potential impact
- The affected version, commit, or deployment configuration
- Reproduction steps or a minimal proof of concept
- The affected endpoint, component, or feature
- Any required account role, tenant relationship, or other precondition
- Logs, screenshots, or request/response examples with secrets and personal data removed
- Your preferred credit name and whether you want to remain anonymous

Please give maintainers a reasonable opportunity to investigate and fix the
issue before sharing it publicly. We will not ask you to provide more data
than is necessary to reproduce the report.

## Safe Testing Rules

Only test against a local ClassroomIO instance, a self-hosted instance you
own, or an environment for which you have explicit written authorization.

Do not:

- Test against ClassroomIO production, another organization's instance, or any third-party service without explicit authorization
- Access, modify, download, or retain another person's data
- Run denial-of-service, resource-exhaustion, load, spam, or automated account-creation tests
- Attempt to disrupt production deployments, background workers, Postgres, object storage, or queues
- Bypass payment, licensing, access-control, or tenant-isolation boundaries on a shared environment
- Commit, publish, or reuse credentials, tokens, private URLs, or other secrets found during testing
- Use social engineering, phishing, physical attacks, or attacks against ClassroomIO staff or users

### Authentication and Rate Limits

Use local test accounts and local credentials when testing authentication,
session handling, SSO, or token authentication. Do not probe or attempt to
bypass the hosted authentication provider, including Supabase Auth, on
production or shared environments.

Redis-backed rate limits protect shared services. Do not intentionally exhaust,
evade, or race Redis rate limits outside a local environment. If a report
requires demonstrating a rate-limit weakness, provide a bounded reproduction
using a local Redis instance or describe the smallest request sequence needed
so maintainers can reproduce it safely.

If you unintentionally access data or cause an availability problem, stop
testing immediately, preserve only the minimum evidence needed, and report it
privately.

## Severity Guidance

Severity depends on exploitability, required privileges, affected scope, and
the confidentiality, integrity, or availability impact. These examples are
guidance rather than a substitute for case-by-case assessment.

### Critical

- Unauthenticated remote code execution on the API, dashboard, or worker
- A complete authentication bypass that exposes or controls accounts across organizations
- A vulnerability that permits unrestricted access to production secrets or the full platform data store

### High

- Cross-tenant access to private courses, submissions, personal data, or organization settings
- Account takeover or privilege escalation from a normal learner to an administrator
- Arbitrary file or object access, server-side request forgery, or code execution with meaningful production impact
- Exposure of credentials or tokens that provide broad access to production systems

### Medium

- A scoped authorization bypass affecting a limited resource or role
- Stored cross-site scripting requiring an authenticated user or restricted authoring permission
- A meaningful session, CSRF, or token-validation weakness with limited prerequisites or impact
- A rate-limit bypass that materially enables abuse of one account or endpoint without broad service disruption

### Low

- Sensitive implementation details in errors that do not expose secrets or user data
- Missing defense-in-depth headers or cookie attributes without a demonstrated exploit
- Low-impact information disclosure or a narrowly scoped issue requiring several unlikely conditions

Reports that only identify an outdated dependency should explain a reachable,
exploitable impact in ClassroomIO. Automated scanner output without a
reproduction or impact description may not be actionable on its own.

## Coordinated Disclosure

We will acknowledge receipt of a report as soon as practical, with a target
of five business days, and will keep the reporter informed during triage. We
will work with the reporter on remediation and an appropriate disclosure date.

Our normal target is to release a fix and coordinate public disclosure within
90 days of the initial report. The timeline may be shorter when exploitation
is active or longer when a fix requires more time. We will not publicly
disclose a report before a fix is available without discussing it with the
reporter first, except where legal or safety obligations require otherwise.

We may publish a security advisory after remediation. With the reporter's
permission, we will credit them by their preferred name or handle. Reporters
who prefer to remain anonymous will not be identified.

Thank you for helping keep ClassroomIO and its community secure.
