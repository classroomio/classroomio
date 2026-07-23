# Plugin System Research

This folder collects research and design exploration on **how to bring a plugin/extension
system to ClassroomIO**. It is intentionally _research_, not a PRD: there are no acceptance
criteria, phases, checklists, or open-question sections. It is the written record of an
exploration into how other learning platforms and popular open-source projects implement
extensibility, plus a proposed framework pattern tailored to ClassroomIO's stack.

## Contents

1. [`lms-plugin-architectures.md`](./lms-plugin-architectures.md) — How large LMS platforms
   (Moodle, Canvas/Blackboard via LTI, Open edX XBlocks), the canonical hook model
   (WordPress), the content-packaging standards (SCORM / xAPI / cmi5), and the modern SaaS
   sandbox model implement plugins: the parts, how it works, security, how plugins are
   accepted and run, what plugins can do, and what "plugin vs native feature" means.

2. [`open-source-plugin-ecosystems.md`](./open-source-plugin-ecosystems.md) — What kinds of
   plugins popular open-source projects actually have (Moodle, Open edX, WordPress, VS Code,
   Jenkins, Grafana, Obsidian), and the recurring categories that appear across all of them.

3. [`example-plugin-compliance-concierge.md`](./example-plugin-compliance-concierge.md) — A
   concrete, simple example plugin grounded in ClassroomIO's customer niche (compliance
   training): a Slack deadline-escalation bot built entirely on existing surfaces
   (webhooks + REST API).

4. [`plugin-framework-design.md`](./plugin-framework-design.md) — A proposed simple plugin
   framework pattern for ClassroomIO: one manifest, three primitives (provide / hook / page),
   an extension-point catalog, three runtime tiers, a capability/permission model, and the
   developer experience (scaffolder + local harness + registry) needed to drive open-source
   adoption.

5. [`moodle-top-plugins-gap-analysis.md`](./moodle-top-plugins-gap-analysis.md) — An analysis
   of the most-installed Moodle plugins against the proposed framework: what would be
   buildable as-is, what needs additional capabilities, and what is a deliberate limitation
   on multi-tenant cloud.

## The one-line takeaway

ClassroomIO already has the hard parts of a plugin system built but unnamed:
`@cio/question-types` (a registry + typed contracts), `apps/embeds` (a sandboxed iframe UI
runtime with a `mount()` contract), and outbound webhooks + REST API (signed, event-driven
logic). A ClassroomIO plugin framework is mostly a matter of **naming and generalizing these
three existing seams** behind a single manifest and SDK — not building new architecture.

## Sources

Primary sources consulted during this research are cited inline in each document. They
include: 1EdTech LTI 1.3 / LTI Advantage specifications and implementation guide, the IMS
LTI 1.3 core spec, Open edX XBlock repository and runtime docs, Moodle Developer Resources
(plugin types, component communication, contribution/validation), the Canvas LMS
architecture write-ups, the WordPress Plugin Handbook, the AICC cmi5 specification, and
2026 write-ups on WASM/iframe SaaS plugin sandboxing (Figma, VS Code, Shopify patterns).
