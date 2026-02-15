# ClassroomIO vs Teachable & Thinkific: Pricing & Feature Competitive Analysis

## Executive Summary

This document analyzes Teachable and Thinkific pricing structures and feature sets to inform ClassroomIO's pricing strategy and roadmap. ClassroomIO is positioned as an open-source LMS for bootcamps, educators, and businesses—a direct alternative to Teachable, Thinkific, and similar platforms.

**Key Recommendation:** ClassroomIO has a strong value proposition (especially at $35/mo) but needs to add several core course and engagement features to compete effectively. Consider a 3-tier structure with clearer differentiation. **Payment processing is out of scope**—focus on features that work with existing external payment links. See [FEATURE_SPECIFICATIONS.md](./FEATURE_SPECIFICATIONS.md) for deep technical specs.

---

## 1. Competitor Pricing Comparison

### Teachable Pricing (2024–2025)

| Plan | Monthly | Yearly | Key Limits | Transaction Fee |
|------|---------|--------|------------|-----------------|
| **Free** | $0 | — | 1 product, 1 admin, unlimited students | 5% |
| **Basic** | $39 | $348 (save $120) | 5 products, 5 admins | 5% |
| **Pro** | $119 | $948 (save $480) | Unlimited products, 20 admins | 0% |
| **Pro+** | $199 | $1,588 | All Pro + priority support, coaching tools | 0% |
| **Business** | Custom | Custom | Enterprise features | 0% |

**Teachable's model:** Subscription + transaction fees on lower tiers. Higher tiers remove fees and add capabilities.

---

### Thinkific Pricing (2024–2025)

| Plan | Monthly | Yearly | Key Limits |
|------|---------|--------|------------|
| **Free** | $0 | — | 1 course, unlimited students, payment links only |
| **Basic** | $49 | $468 (save $120) | 3 courses, remove Thinkific branding |
| **Start** | $99 | $948 (save $240) | Unlimited courses, coupons, bundles |
| **Grow** | $199 | $1,908 (save $480) | Memberships, advanced pricing, certificates, live lessons |
| **Expand** | $499 | $4,788 (save $1,200) | Admin API, custom code, priority support |

**Thinkific's model:** Pure subscription. No platform transaction fees. Native payments on paid tiers.

---

### ClassroomIO Current Pricing

| Plan | Monthly | Yearly | Key Limits |
|------|---------|--------|------------|
| **Basic (Free)** | $0 | $0 | 20 students, ClassroomIO branding, AI (no video) |
| **Early Adopter** | $35 | $350 (save 2 months) | 10K students, custom branding, video, certificates |
| **Enterprise** | Contact | Contact | Unlimited students, custom domain, 24/7 support |

**Current strengths:** Lower price point ($35 vs $49–119), generous student limits (10K), open source/self-host option.

---

## 2. Feature Gap Analysis

### High Priority (Needed to Compete)

| Feature | Teachable | Thinkific | ClassroomIO | Gap |
|---------|-----------|-----------|-------------|-----|
| **Memberships / recurring billing** | ✅ Pro+ | ✅ Grow+ | ❌ | Defer until payment processing (future) |
| **Course bundles** | ✅ | ✅ Start+ | ❌ | Common for upsells |
| **Coupons & promotions** | ✅ | ✅ Start+ | ✅ Discount % only | Need code-based coupons |
| **Drip content / scheduled release** | ✅ | ✅ | ❌ | Essential for cohort-style and evergreen courses |
| **Affiliate program** | ✅ | ✅ | ❌ | Major revenue driver for many creators |

### Medium Priority (Differentiation)

| Feature | Teachable | Thinkific | ClassroomIO | Gap |
|---------|-----------|-----------|-------------|-----|
| **Quizzes & assessments** | ✅ | ✅ | ✅ Exercises | Good—ensure parity |
| **Certificates** | ✅ | ✅ Grow+ | ✅ EA | Good |
| **Live lessons / webinars** | ✅ Pro+ | ✅ Grow+ | ❌ | Roadmap candidate |
| **Email marketing** | ✅ Basic+ | ✅ | ❌ | Consider integrations (e.g., Resend, Mailchimp) |
| **Analytics & reporting** | ✅ Pro+ | ✅ | Partial (student analytics) | Expand: revenue, completion, engagement |
| **Course templates / cloning** | ✅ | ✅ | Roadmap | Accelerate |
| **Forms (pre-enrollment)** | ✅ | ✅ | Roadmap | Align with roadmap |

### Strengths ClassroomIO Can Emphasize

| Feature | ClassroomIO Advantage |
|---------|------------------------|
| **AI course builder** | Differentiator—Teachable/Thinkific have limited AI |
| **Open source & self-host** | Unique for serious creators who want control |
| **Price** | $35 vs $49–119 is compelling |
| **Student limit** | 10K on paid tier vs often limited elsewhere |
| **Forum / community** | Built-in Q&A; competitors often charge for communities |
| **Multi-teacher / org structure** | Bootcamp-friendly from day one |

---

## 3. Recommended Pricing Structure

### Option A: Keep Simple, Add Value

Retain 3 tiers but refine naming and feature clarity:

| Tier | Price | Target |
|------|-------|--------|
| **Starter** (was Basic) | $0 | Hobby, testing, small classes |
| **Growth** (was Early Adopter) | $39/mo or $390/yr | Serious creators, bootcamps |
| **Enterprise** | Custom | Large orgs, custom domain, SLA |

**Changes:**
- Raise Growth to **$39** to align with Teachable Basic while staying below Thinkific Basic ($49).
- Emphasize "unlimited collaborators" and "10K students" as key differentiators.
- Add 1–2 high-value features to Growth before raising price (e.g., drip content or native payments).

### Option B: 4-Tier Structure (Teachable/Thinkific Style)

| Tier | Monthly | Target |
|------|---------|--------|
| **Free** | $0 | 20 students, 1–2 courses, branding |
| **Starter** | $29–39 | 500–1K students, remove branding |
| **Growth** | $79–99 | 10K students, memberships, advanced AI |
| **Enterprise** | Custom | Unlimited, custom domain, SLA |

**Rationale:**
- Free tier for acquisition.
- Starter bridges free and Growth.
- Growth competes with Thinkific Start/Grow.
- Enterprise for larger accounts.

### Option C: Transaction Fee Model (Teachable-Style)

- **Free:** $0, 5% transaction fee on course sales.
- **Pro:** $39–49/mo, 0% transaction fee.
- **Enterprise:** Custom.

**Pros:** Lower barrier for new creators; revenue scales with customer success.  
**Cons:** Requires native payments; more complex billing.

---

## 4. Recommended Feature Roadmap (Prioritized)

### Phase 1: Foundation (0–3 months)

1. **Drip content / scheduled release** (see [FEATURE_SPECIFICATIONS.md](./FEATURE_SPECIFICATIONS.md))
   - Unlock lessons by date or by completion of prior lessons.
   - Essential for cohort and evergreen courses.
   - Works with existing `lesson.isUnlocked`, `groupmember.createdAt`.

2. **Coupon codes**
   - Code-based discounts (e.g. `LAUNCH50` = 50% off).
   - Expiration dates, usage limits.
   - 100% off → auto-enroll; partial → pass code to external payment link.

### Phase 2: Growth Features (3–6 months)

4. **Course bundles**
   - Sell multiple courses as a package; enroll grants access to all.

5. **Forms** (from roadmap)
   - Pre-enrollment forms, surveys, application forms.

6. **Course templates / cloning**
   - Clone courses; share templates across orgs.

7. **Analytics expansion**
   - Enrollment/completion over time, lesson-level completion rates, CSV export.

### Phase 3: Differentiation (6–12 months)

8. **Affiliate program**
   - Track referrals; attribution for educator payouts.

9. **Live lessons / webinars**
   - Polish `callUrl` + `lessonAt`; optional Zoom/Meet integration.

10. **Messenger delivery** (from roadmap)
    - Slack/Discord/Telegram bots for lesson delivery.

11. **Course batches & pathways**
    - Cohorts within course; pathway = series of courses + certificate.

---

## 5. Messaging & Positioning

### Current Pain Points vs Competitors

| Pain Point | ClassroomIO Angle |
|------------|-------------------|
| High fees (Teachable 5%, Thinkific $49+) | "No transaction fees on paid plan. $35/mo." |
| Locked-in, closed platform | "Open source. Self-host if you want full control." |
| Generic AI tools | "AI course builder built for educators." |
| Community as add-on | "Forum & Q&A included—no extra charge." |
| Bootcamp/corporate use case | "Built for bootcamps and teams from day one." |

### Suggested Pricing Page Copy

- **Headline:** "Pricing that scales with your students, not your budget."
- **Free tier:** "Start teaching today. No credit card. 20 students, unlimited courses."
- **Growth tier:** "For bootcamps and growing programs. 10K students, custom branding, AI, certificates."
- **Enterprise:** "Custom domain, unlimited students, dedicated support."

---

## 6. Summary: Action Items

### Pricing

- [ ] Decide between **Option A** (simple, $39) or **Option B** (4-tier).
- [ ] Keep annual discount (≈2 months free) for consistency.
- [ ] Payment processing deferred; all features work with external links.

### Features (Build Order)

See [FEATURE_SPECIFICATIONS.md](./FEATURE_SPECIFICATIONS.md) for full specs. Prioritized:

1. Drip content / scheduled release.
2. Coupon codes.
3. Course cloning.
4. Forms (from roadmap).
5. Analytics expansion.
6. Course bundles.
7. Affiliate program.
8. Tags, live lessons polish, batches, pathways.

### Documentation

- Update `packages/utils/src/plans/data.json` when plans change.
- Add plan comparison table to website pricing page.
- Create "Why ClassroomIO vs Teachable/Thinkific" comparison page for SEO.

---

## 7. Implementation Notes (ClassroomIO Codebase)

### Plan Data Location

- `packages/utils/src/plans/data.json` – plan display data.
- `packages/utils/src/plans/constants.ts` – feature flags and plan names.
- Plan enforcement: `hasFeature()` in `packages/utils/src/plans/utils.ts`.

### Course Pricing & Enrollment

- `apps/dashboard/src/lib/features/ui/course-landing-page/components/editor/pricing-form.svelte` – cost, discount, payment link, gift.
- `apps/dashboard/src/routes/course/[slug]/enroll/+page.server.ts` – `requiresPaymentOrInvite` logic.
- Add coupon codes: new `metadata.coupons` or `coupon` table; validate at enrollment.

### Drip Content

- Requires lesson-level unlock rules (date-based or completion-based).
- Schema: `lesson.unlockRule` or `lesson.unlockAfterLessonId` + `lesson.unlockAfterDate`.
- Course-app would need to check unlock before rendering lesson.

---

*Document generated for the pricing-feature-competitive-strategy initiative. Last updated: February 2025.*
