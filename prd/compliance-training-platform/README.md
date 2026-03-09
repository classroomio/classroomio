# Compliance Training Platform PRD

## Status
- Draft

## Date
- February 21, 2026

## Purpose
Transform ClassroomIO into the go-to platform for companies that need to deliver, track, and prove compliance training for their employees. This PRD defines features for organizations in regulated industries (healthcare, finance, manufacturing, government) who must ensure their workforce stays compliant with regulations.

---

## 1. Executive Summary

### The Problem
Companies in regulated industries struggle to:
- **Assign** the right training to the right people based on their role/location
- **Track** who completed training on time and who is overdue
- **Remind** employees before deadlines and escalate to managers
- **Prove** compliance to auditors with tamper-proof records
- **Renew** certifications automatically when they expire

### Target Customers
| Industry | Example Use Cases |
|----------|-------------------|
| Healthcare | HIPAA training, patient safety, infection control, medical device handling |
| Financial Services | Anti-money laundering, fraud prevention, data privacy, trading compliance |
| Manufacturing | OSHA safety, quality control (ISO), hazardous materials handling |
| Government | Security clearance, ethics training, procurement rules, FISMA |
| Education | FERPA, Title IX, campus safety, student data handling |
| Retail/Hospitality | Food safety, anti-harassment, PCI-DSS, workplace safety |

### Solution Overview
ClassroomIO becomes a **Compliance Training Management System** that helps organizations:
1. **Deploy** compliance training programs efficiently
2. **Automate** assignment, reminders, and renewals
3. **Monitor** compliance status in real-time
4. **Report** audit-ready evidence instantly
5. **Scale** across thousands of employees and multiple locations

---

## 2. Current State vs. Required Features

### ✅ What ClassroomIO Already Does Well
| Feature | Current Capability | Compliance Gap |
|---------|-------------------|----------------|
| Course Creation | Rich content editor, videos, documents | ✅ Good enough |
| Assessments | Basic exercises with grading | ⚠️ Need more question types & pass/fail rules |
| Certificates | Generate PDF certificates | ⚠️ Need expiration, renewal, revocation |
| User Management | Invite students, track progress | ⚠️ Need bulk assignment by role/department |
| SSO | OIDC/SAML integration | ✅ Enterprise-ready |
| Basic Reporting | Course completion stats | ❌ Need compliance-specific dashboards |

### ❌ Critical Missing Features for Compliance Training

| Missing Feature | Why It Matters | Customer Pain |
|-----------------|----------------|---------------|
| **Mandatory Training Assignment** | Compliance training isn't optional - everyone in a role MUST complete it | Currently can only invite, can't enforce |
| **Recurring/Refresh Training** | Many regulations require annual/quarterly retraining | No automated renewal system |
| **Compliance Dashboard** | See who is compliant, who is overdue, by department/role | No bird's-eye view for compliance officers |
| **Policy Acknowledgment** | Track who read and agreed to policies | No policy attestation workflow |
| **Audit Trail** | Prove "who did what when" to auditors | No immutable activity log |
| **Automated Reminders** | Notify employees before deadlines, escalate to managers | Manual follow-up is unsustainable |
| **Evidence Export** | One-click export of training records for auditors | Manual report generation takes hours |

---

## 3. Feature Requirements

### 3.1 Compliance Training Programs (The Container)

#### Purpose
A "Program" groups related training requirements (e.g., "Annual HIPAA Compliance" or "New Hire Safety Training"). This is the top-level entity compliance officers manage.

#### Requirements

**CP-1: Program Management**
- Create programs with title, description, and regulatory framework (e.g., "HIPAA", "OSHA", "SOX")
- Set program status: draft, active, archived
- Assign program owner (compliance officer responsible)
- Add custom fields for internal tracking (department codes, cost centers, etc.)

**CP-2: Program Content**
- Link multiple courses/lessons to a program (e.g., HIPAA includes: Basics course, Security course, Quiz)
- Set completion rules: 
  - "Complete all courses"
  - "Complete any 2 of 3 courses" 
  - "Complete Course A AND (Course B OR Course C)"
- Set passing criteria: minimum score, attempt limits, time between retakes

**CP-3: Program Assignment Rules**
- Assign by: role, department, location, employment type, custom attributes
- Examples:
  - "All nurses in California hospitals"
  - "All new hires in first 30 days"
  - "All employees with security clearance Level 2+"
- Support exclusions (e.g., "All managers EXCEPT contractors")

**CP-4: Program Schedule**
- One-time assignment (e.g., new hire training)
- Recurring: every N months/years from completion date OR fixed date
- Grace period: days after due date before marked overdue
- Prerequisites: must complete Program X before starting Program Y

#### Database Schema
```sql
-- Compliance training programs
CREATE TABLE compliance_program (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id),
  title VARCHAR NOT NULL,
  description TEXT,
  framework VARCHAR, -- 'HIPAA', 'OSHA', 'SOX', 'GDPR', 'Custom'
  status VARCHAR DEFAULT 'draft', -- 'draft', 'active', 'archived'
  owner_id UUID REFERENCES profile(id),
  completion_rule JSONB NOT NULL DEFAULT '{"type": "all"}', -- { type: 'all' | 'any' | 'minimum', count: number }
  passing_criteria JSONB NOT NULL DEFAULT '{"minScore": 80, "maxAttempts": 3}',
  schedule_config JSONB NOT NULL DEFAULT '{}', -- { type: 'once' | 'recurring', intervalMonths: 12, graceDays: 7 }
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Program content (courses/exercises linked to program)
CREATE TABLE compliance_program_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES compliance_program(id),
  content_type VARCHAR NOT NULL, -- 'course', 'exercise', 'lesson'
  content_id UUID NOT NULL,
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assignment rules (who gets this program)
CREATE TABLE compliance_program_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES compliance_program(id),
  rule_type VARCHAR NOT NULL, -- 'role', 'group', 'location', 'attribute', 'all'
  rule_value JSONB NOT NULL, -- { roleIds: [], groupIds: [], location: '', attributes: {} }
  is_exclusion BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.2 Learner Assignments & Tracking

#### Purpose
Track each learner's obligation, progress, and completion status for every program they're assigned.

#### Requirements

**LA-1: Assignment Lifecycle**
- **Assigned**: User meets assignment rule criteria → creates assignment
- **In Progress**: User started but not completed
- **Completed**: User met all completion rules
- **Overdue**: Past due date + grace period
- **Waived**: Admin exempted user (with reason and expiration)
- **Expired**: Previous completion past validity period → needs renewal

**LA-2: Assignment Attributes**
- Assigned date, due date, completed date
- Current status and status history with timestamps
- Attempts count, best score, time spent
- Certificate issued (if applicable)
- Reminder history (when reminders were sent)

**LA-3: Bulk Operations**
- Bulk assign to users matching criteria
- Bulk extend due dates (e.g., grant extension to entire department)
- Bulk waive with reason
- Bulk re-enroll (force retake even if completed)

**LA-4: Self-Service Portal (for Learners)**
- "My Compliance" dashboard showing all assigned programs
- Visual indicators: due soon (yellow), overdue (red), completed (green)
- Download certificates for completed programs
- See upcoming renewals

#### Database Schema
```sql
-- Individual learner assignments
CREATE TABLE compliance_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id),
  program_id UUID NOT NULL REFERENCES compliance_program(id),
  user_id UUID NOT NULL REFERENCES user(id),
  
  -- Assignment details
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ NOT NULL,
  grace_period_days INTEGER DEFAULT 0,
  
  -- Status tracking
  status VARCHAR NOT NULL DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed', 'overdue', 'waived', 'expired'
  status_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status_history JSONB DEFAULT '[]', -- [{ status, timestamp, reason }]
  
  -- Progress
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress_percent INTEGER DEFAULT 0,
  
  -- Results
  attempts INTEGER DEFAULT 0,
  best_score INTEGER,
  passing_score INTEGER,
  time_spent_minutes INTEGER,
  
  -- Certificate
  certificate_id UUID,
  
  -- Waiver (if applicable)
  waived_at TIMESTAMPTZ,
  waived_by UUID REFERENCES profile(id),
  waiver_reason TEXT,
  waiver_expires_at TIMESTAMPTZ,
  
  -- For recurring programs
  is_renewal BOOLEAN DEFAULT false,
  previous_assignment_id UUID REFERENCES compliance_assignment(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(program_id, user_id, is_renewal) -- One active assignment per program per user
);

-- Assignment content progress (track individual courses within program)
CREATE TABLE compliance_assignment_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES compliance_assignment(id),
  content_type VARCHAR NOT NULL,
  content_id UUID NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'failed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  score INTEGER,
  attempts INTEGER DEFAULT 0,
  time_spent_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.3 Automated Notifications & Escalations

#### Purpose
Ensure employees complete training on time without manual follow-up from compliance teams.

#### Requirements

**NE-1: Reminder Schedule**
- Configurable reminder schedule per program (e.g., 30, 14, 7, 1 days before due)
- Customizable email templates per reminder stage
- Include: program name, due date, progress, direct link to training

**NE-2: Escalation Paths**
- **Level 1**: Reminder to learner
- **Level 2**: Notify learner + CC manager (when overdue)
- **Level 3**: Escalate to compliance admin + learner's skip-level manager
- **Level 4**: Flag for HR/executive review

**NE-3: Manager Notifications**
- Weekly digest of team's compliance status
- Immediate alert when direct report goes overdue
- Dashboard showing team compliance rate

**NE-4: Compliance Team Alerts**
- Daily summary of new overdue assignments
- Alert when large group approaches deadline (e.g., "50 employees due in 3 days")
- System health alerts (failed email deliveries, sync errors)

**NE-5: Notification Preferences**
- Email, in-app notification, or both
- SMS for critical alerts (optional add-on)
- Digest mode vs. immediate notifications

#### Database Schema
```sql
-- Notification templates
CREATE TABLE compliance_notification_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id),
  name VARCHAR NOT NULL,
  trigger_type VARCHAR NOT NULL, -- 'reminder', 'overdue', 'escalation', 'completion'
  trigger_days INTEGER, -- days before/after event (negative = before, positive = after)
  subject_template VARCHAR NOT NULL,
  body_template TEXT NOT NULL,
  recipients VARCHAR[] NOT NULL, -- ['learner', 'manager', 'compliance_admin']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification queue and history
CREATE TABLE compliance_notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES compliance_assignment(id),
  template_id UUID REFERENCES compliance_notification_template(id),
  notification_type VARCHAR NOT NULL,
  recipient_type VARCHAR NOT NULL, -- 'learner', 'manager', 'admin'
  recipient_id UUID NOT NULL,
  recipient_email VARCHAR NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status VARCHAR NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
  error_message TEXT,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification schedule (tracks what reminders are due)
CREATE TABLE compliance_notification_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES compliance_assignment(id),
  reminder_type VARCHAR NOT NULL, -- '30_days', '14_days', '7_days', '1_day', 'overdue', 'escalation'
  scheduled_at TIMESTAMPTZ NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.4 Policy Attestation (Read & Acknowledge)

#### Purpose
Not all compliance is "training" - sometimes employees just need to read and acknowledge a policy. Track who has read and agreed to important documents.

#### Requirements

**PA-1: Policy Management**
- Upload policy documents (PDF, Word, HTML)
- Version control with version numbers and effective dates
- Categorize (Security, HR, Safety, Code of Conduct, etc.)
- Set required reading time (e.g., "Must view for at least 5 minutes")

**PA-2: Attestation Workflow**
1. Employee receives notification of new/updated policy
2. Employee opens and reads the document (viewer tracks time)
3. Employee checks "I have read and understand this policy"
4. Employee digitally "signs" with name, date, employee ID
5. System records: user, policy version, timestamp, IP, time spent reading

**PA-3: Attestation Tracking**
- Who has attested to which version
- Who hasn't attested (and how overdue)
- Bulk attestation for initial rollout (with verification)
- Re-attestation required when policy version changes

**PA-4: Attestation Certificate**
- Generate proof of attestation per employee
- Include: policy name, version, attestation date, digital signature hash

#### Database Schema
```sql
-- Policy documents
CREATE TABLE compliance_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id),
  title VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL, -- 'security', 'hr', 'safety', 'conduct', 'privacy'
  status VARCHAR DEFAULT 'draft', -- 'draft', 'active', 'archived'
  requires_reading_time_seconds INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profile(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Policy versions
CREATE TABLE compliance_policy_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES compliance_policy(id),
  version_number INTEGER NOT NULL,
  content_url TEXT NOT NULL, -- S3/MinIO URL
  content_hash TEXT NOT NULL,
  effective_date TIMESTAMPTZ NOT NULL,
  requires_reattestation BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profile(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(policy_id, version_number)
);

-- Who needs to attest to which policy version
CREATE TABLE compliance_policy_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_version_id UUID NOT NULL REFERENCES compliance_policy_version(id),
  assigned_to_type VARCHAR NOT NULL, -- 'role', 'group', 'department', 'all'
  assigned_to_id UUID,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attestation records (immutable)
CREATE TABLE compliance_policy_attestation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_version_id UUID NOT NULL REFERENCES compliance_policy_version(id),
  user_id UUID NOT NULL REFERENCES user(id),
  attested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  time_spent_seconds INTEGER,
  digital_signature VARCHAR NOT NULL, -- hash of user+policy+timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(policy_version_id, user_id)
);
```

---

### 3.5 Certificates with Lifecycle Management

#### Purpose
Issue certificates that expire, track renewals, and maintain a complete history for audit purposes.

#### Requirements

**CE-1: Certificate Templates**
- Design certificate templates per program
- Include: recipient name, program name, completion date, expiration date, certificate ID, QR code for verification
- Custom fields (CE credits, accreditation body, instructor name)

**CE-2: Certificate Issuance**
- Auto-issue upon program completion
- Manual issue by admin (for external training imported into system)
- Bulk issue for historical data import

**CE-3: Certificate Lifecycle**
- **Valid**: Currently valid certificate
- **Expiring Soon**: Within renewal window
- **Expired**: Past expiration date
- **Revoked**: Invalidated (with reason and revoked_by)
- **Renewed**: Replaced by newer certificate (link to new cert)

**CE-4: Certificate Verification**
- Public verification page (for external auditors)
- QR code on certificate links to verification
- Shows: valid/invalid/revoked status, original issue details

**CE-5: Certificate History**
- Complete chain: Original → Renewal 1 → Renewal 2 → Current
- Never delete - maintain full history even after revocation

#### Database Schema
```sql
-- Certificate definitions (linked to programs)
CREATE TABLE compliance_certificate_definition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id),
  program_id UUID NOT NULL REFERENCES compliance_program(id),
  name VARCHAR NOT NULL,
  template_url TEXT NOT NULL, -- S3/MinIO URL to template file
  validity_period_months INTEGER NOT NULL, -- 0 = no expiration
  renewal_window_days INTEGER DEFAULT 30,
  ce_credits DECIMAL(4,2), -- continuing education credits
  accreditation_body VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Issued certificates
CREATE TABLE compliance_certificate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number VARCHAR UNIQUE NOT NULL, -- human-readable number
  definition_id UUID NOT NULL REFERENCES compliance_certificate_definition(id),
  user_id UUID NOT NULL REFERENCES user(id),
  assignment_id UUID NOT NULL REFERENCES compliance_assignment(id),
  
  -- Certificate data
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  issued_by UUID NOT NULL REFERENCES profile(id),
  expires_at TIMESTAMPTZ,
  
  -- Certificate file
  certificate_url TEXT NOT NULL,
  certificate_hash TEXT NOT NULL,
  
  -- Lifecycle
  status VARCHAR DEFAULT 'valid', -- 'valid', 'expiring_soon', 'expired', 'revoked', 'renewed'
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES profile(id),
  revoke_reason TEXT,
  
  -- Renewal chain
  is_renewal BOOLEAN DEFAULT false,
  previous_certificate_id UUID REFERENCES compliance_certificate(id),
  renewed_by_certificate_id UUID REFERENCES compliance_certificate(id),
  
  -- Verification
  verification_token VARCHAR UNIQUE NOT NULL, -- for public verification URL
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.6 Compliance Dashboard & Reporting

#### Purpose
Give compliance officers and managers real-time visibility into organizational compliance posture.

#### Requirements

**CD-1: Organization Compliance Overview**
- Overall compliance rate (% of required training completed on time)
- Breakdown by: program, department, location, role
- Risk indicators: overdue count, expiring soon count, non-compliant departments
- Trend lines: compliance rate over time

**CD-2: Program-Level Dashboard**
- Assignment status pie chart (completed, in progress, overdue, not started)
- Completion rate over time
- Average time to complete
- Pass/fail rates for assessments
- Upcoming due dates calendar view

**CD-3: Individual Learner View**
- Complete training history
- Current assignments and status
- Certificates earned (with download links)
- Policy attestations
- Compliance "score" or rating

**CD-4: Alerts & Warnings**
- High-risk situations: "50 people overdue on HIPAA training"
- Approaching deadlines: "200 certifications expire next month"
- Completion milestones: "90% of organization completed annual training"

**CD-5: Manager Dashboard**
- My team's compliance rate
- Direct reports' individual status
- Overdue notifications sent
- Team comparison to organization average

**CD-6: Audit Reports**
- One-click generation of compliance packages
- Include: training records, certificates, policy attestations, audit log excerpt
- Tamper-evident (checksums, signed manifest)
- Date range selection
- Filter by: program, department, individual

#### API Endpoints
```typescript
// Organization compliance overview
GET /compliance/dashboard/overview
  Response: {
    overallComplianceRate: number;
    totalAssignments: number;
    completedOnTime: number;
    completedLate: number;
    overdue: number;
    inProgress: number;
    notStarted: number;
    expiringSoon30Days: number;
    expiringSoon90Days: number;
    byProgram: ProgramComplianceSummary[];
    byDepartment: DepartmentComplianceSummary[];
    trends: { date: string; rate: number }[];
  }

// Program detail dashboard
GET /compliance/dashboard/programs/:programId
  Response: {
    program: ComplianceProgram;
    stats: {
      totalAssigned: number;
      completed: number;
      inProgress: number;
      overdue: number;
      averageCompletionTime: number;
      passRate: number;
    };
    statusBreakdown: { status: string; count: number; percentage: number }[];
    upcomingDueDates: { date: string; count: number }[];
    recentCompletions: AssignmentSummary[];
    atRiskLearners: AssignmentSummary[]; -- overdue or due soon
  }

// Generate audit report
POST /compliance/reports/audit-package
  Body: {
    title: string;
    dateRange: { start: string; end: string };
    filters: {
      programs?: string[];
      departments?: string[];
      users?: string[];
    };
    include: {
      trainingRecords: boolean;
      certificates: boolean;
      policyAttestations: boolean;
      auditLog: boolean;
    };
  }
  Response: {
    reportId: string;
    status: 'generating' | 'ready' | 'failed';
    downloadUrl?: string;
    expiresAt?: string;
    manifest: {
      generatedAt: string;
      generatedBy: string;
      recordCounts: Record<string, number>;
      checksums: Record<string, string>;
    };
  }

// Learner compliance profile
GET /compliance/learners/:userId/profile
  Response: {
    user: UserSummary;
    currentAssignments: AssignmentDetails[];
    completedPrograms: CompletedProgram[];
    certificates: CertificateSummary[];
    policyAttestations: AttestationSummary[];
    complianceScore: number;
    riskLevel: 'low' | 'medium' | 'high';
  }
```

---

### 3.7 Audit Trail & Evidence

#### Purpose
Provide immutable, tamper-evident records of all compliance-related activities for auditor review.

#### Requirements

**AT-1: Comprehensive Event Logging**
Log every compliance-relevant action:
- Program created, modified, archived
- Assignment created, completed, waived, expired
- Certificate issued, revoked, renewed
- Policy published, attested
- Notification sent, opened, clicked
- Report generated, downloaded
- Admin actions (bulk operations, settings changes)

**AT-2: Log Entry Content**
- Timestamp (UTC, millisecond precision)
- Actor (user ID, role, email)
- Action type and description
- Affected resources (program, assignment, user)
- Before/after values for changes
- IP address and user agent
- Session ID

**AT-3: Audit Log Characteristics**
- Append-only (no modifications allowed)
- Retained for 7+ years (configurable)
- Exportable to CSV/JSON/PDF
- Full-text searchable
- Filterable by: date range, actor, action type, resource

**AT-4: Evidence Integrity**
- Cryptographic hash chain linking entries
- Regular integrity verification reports
- Tamper detection alerts

#### Database Schema
```sql
-- Audit event log (append-only)
CREATE TABLE compliance_audit_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Actor
  actor_id UUID REFERENCES user(id),
  actor_email VARCHAR,
  actor_role VARCHAR,
  
  -- Action
  action_category VARCHAR NOT NULL, -- 'program', 'assignment', 'certificate', 'policy', 'report', 'admin'
  action_type VARCHAR NOT NULL, -- 'created', 'updated', 'completed', 'revoked', etc.
  action_description TEXT,
  
  -- Resources
  resource_type VARCHAR, -- 'program', 'assignment', 'user', 'certificate'
  resource_id UUID,
  resource_name VARCHAR,
  
  -- Details
  changes JSONB, -- { field: { from: x, to: y } }
  metadata JSONB, -- additional context
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  
  -- Integrity
  previous_hash VARCHAR,
  entry_hash VARCHAR NOT NULL, -- hash of this entry including previous_hash
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_org_time ON compliance_audit_event(organization_id, timestamp DESC);
CREATE INDEX idx_audit_action ON compliance_audit_event(action_category, action_type);
CREATE INDEX idx_audit_resource ON compliance_audit_event(resource_type, resource_id);
CREATE INDEX idx_audit_actor ON compliance_audit_event(actor_id);
```

---

## 4. User Experience Flows

### 4.1 Compliance Officer Journey

```
1. Create Compliance Program
   ↓
2. Add Content (courses, assessments)
   ↓
3. Set Assignment Rules (who needs to complete)
   ↓
4. Configure Schedule & Reminders
   ↓
5. Launch Program → System auto-assigns to users
   ↓
6. Monitor Dashboard → See completion rates, overdue alerts
   ↓
7. Send Reminders / Escalate / Waive as needed
   ↓
8. Generate Audit Report → Export for auditor
```

### 4.2 Employee (Learner) Journey

```
1. Receive Email: "New Required Training: HIPAA Compliance"
   ↓
2. Click Link → Login (if needed) → Go to "My Compliance" dashboard
   ↓
3. See: List of assigned programs with due dates
   ↓
4. Click Program → Start Training
   ↓
5. Complete Courses/Assessments
   ↓
6. Receive Certificate + Confirmation Email
   ↓
7. Certificate stored in "My Certificates" for future reference
```

### 4.3 Manager Journey

```
1. Weekly Email Digest: "Your Team's Compliance Status"
   ↓
2. Click to Manager Dashboard
   ↓
3. See: Team compliance rate, who's overdue, who's due soon
   ↓
4. Drill into individual → See their assignments
   ↓
5. Send reminder to specific team member
   ↓
6. Get notified when team member completes overdue training
```

### 4.4 Auditor Journey

```
1. Compliance officer generates "Audit Package" 
   ↓
2. Secure download link sent to auditor (time-limited)
   ↓
3. OR: Auditor given time-limited read-only portal access
   ↓
4. Auditor views/downloads:
      - Training completion records
      - Certificates with verification
      - Policy attestations
      - Activity audit log
   ↓
5. All auditor activity is itself logged
```

---

## 5. Implementation Roadmap

### Phase 1: Core Assignment & Tracking (Weeks 1-6)
**Goal**: Basic compliance program delivery

| Task | Duration | Deliverable |
|------|----------|-------------|
| Compliance program data model | 3 days | Database schema |
| Program CRUD API | 4 days | Backend endpoints |
| Assignment engine | 5 days | Auto-assignment logic |
| Basic compliance dashboard | 5 days | Compliance overview UI |
| "My Compliance" learner view | 4 days | Learner dashboard |
| Assignment tracking | 4 days | Progress tracking UI |
| **Milestone** | | Companies can assign and track compliance training |

### Phase 2: Notifications & Reminders (Weeks 7-10)
**Goal**: Automated follow-up without manual work

| Task | Duration | Deliverable |
|------|----------|-------------|
| Notification template system | 3 days | Template CRUD API/UI |
| Reminder scheduling engine | 4 days | Background job processor |
| Email delivery & tracking | 3 days | Sendgrid/SES integration |
| Manager notifications | 3 days | Manager digest & alerts |
| Escalation workflows | 4 days | Multi-level escalation |
| **Milestone** | | Fully automated reminder system |

### Phase 3: Certificates & Renewals (Weeks 11-14)
**Goal**: Complete certification lifecycle

| Task | Duration | Deliverable |
|------|----------|-------------|
| Certificate templates | 3 days | Template designer |
| Certificate generation | 3 days | PDF generation |
| Certificate lifecycle mgmt | 4 days | Expire, revoke, renew |
| Recurring assignment engine | 4 days | Auto-renewal logic |
| Expiration dashboard | 3 days | Renewals view |
| **Milestone** | | Automated renewal cycles |

### Phase 4: Policy Attestation (Weeks 15-18)
**Goal**: Policy acknowledgment tracking

| Task | Duration | Deliverable |
|------|----------|-------------|
| Policy document management | 3 days | Policy CRUD |
| Document viewer with tracking | 4 days | Time-on-page tracking |
| Attestation workflow | 3 days | Sign/acknowledge flow |
| Attestation dashboard | 3 days | Who's attested view |
| **Milestone** | | Policy attestation system |

### Phase 5: Reporting & Audit (Weeks 19-24)
**Goal**: Audit-ready evidence and reporting

| Task | Duration | Deliverable |
|------|----------|-------------|
| Audit event logging | 4 days | Event capture system |
| Audit log viewer & export | 4 days | Log UI |
| Advanced dashboards | 5 days | Drill-down reports |
| Audit package generator | 5 days | One-click export |
| Auditor portal (read-only) | 5 days | External auditor access |
| **Milestone** | | Full audit readiness |

### Phase 6: Integrations & Scale (Weeks 25-30)
**Goal**: Enterprise integrations

| Task | Duration | Deliverable |
|------|----------|-------------|
| HRIS integration (Workday, BambooHR) | 2 weeks | User sync |
| SCIM provisioning | 1 week | Automated user lifecycle |
| Advanced analytics | 1 week | Trend analysis, predictions |
| API for external systems | 1 week | Public API endpoints |
| **Milestone** | | Enterprise-ready platform |

---

## 6. Technical Architecture

### New API Routes
```
/compliance/programs              # CRUD for compliance programs
/compliance/assignments           # Assignment management
/compliance/assignments/:id/progress  # Track learner progress
/compliance/certificates          # Certificate lifecycle
/compliance/policies              # Policy document management
/compliance/attestations          # Policy acknowledgment
/compliance/dashboard             # Dashboard data
/compliance/reports               # Report generation
/compliance/audit-events          # Audit log access
/compliance/notifications         # Notification management
/compliance/settings              # Organization compliance settings
```

### Background Jobs
```
assignment-processor      # Create assignments based on rules
reminder-scheduler        # Queue upcoming reminders
notification-sender       # Send emails/SMS
expiration-checker        # Mark expired certifications
renewal-processor         # Create renewal assignments
report-generator          # Generate large audit reports
audit-archiver            # Archive old audit logs
```

### Frontend Features
```
apps/dashboard/src/lib/features/compliance/
  pages/
    programs-list.svelte
    program-editor.svelte
    assignments.svelte
    dashboard.svelte
    reports.svelte
    audit-log.svelte
    settings.svelte
  components/
    program-card.svelte
    assignment-status-badge.svelte
    compliance-chart.svelte
    notification-template-editor.svelte
    certificate-viewer.svelte
    policy-uploader.svelte
    attestation-flow.svelte
  api/
    compliance.svelte.ts
  utils/
    types.ts
    constants.ts
```

---

## 7. Success Metrics

### Product Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to create compliance program | < 30 minutes | User testing |
| Time to assign training to 1000 people | < 5 minutes | Performance test |
| Training completion rate | > 90% | Dashboard tracking |
| Automated reminder open rate | > 60% | Email analytics |
| Time to generate audit report | < 2 minutes | Performance test |

### Business Metrics
| Metric | Target |
|--------|--------|
| Compliance-focused customer acquisition | 10 new customers in 6 months |
| Compliance feature NPS | > 50 |
| Customer retention (compliance segment) | > 95% |
| Expansion revenue from compliance add-on | 20% of ARR |

---

## 8. Competitive Differentiation

| Feature | ClassroomIO | Competitors (LMS) | Compliance Tools |
|---------|-------------|-------------------|------------------|
| Course creation quality | ✅ Strong | ✅ Strong | ❌ Weak |
| Compliance-specific features | 🆕 Building | ⚠️ Limited | ✅ Strong |
| Price | 💰 Affordable | 💰💰 Expensive | 💰💰💰 Very expensive |
| Open Source | ✅ Yes | ❌ No | ❌ No |
| Self-hosted option | ✅ Yes | ⚠️ Limited | ❌ Rare |
| Ease of use | ✅ Simple | ⚠️ Complex | ❌ Complex |

**Positioning**: "The compliance training platform that doesn't suck - powerful enough for enterprise compliance, simple enough for anyone to use."

---

## 9. Open Questions

1. Should we offer pre-built compliance program templates (e.g., "HIPAA Basics")?
2. Do we need integration with third-party course libraries (Skillsoft, LinkedIn Learning)?
3. Should we support instructor-led training tracking (ILT) or self-paced only?
4. How important is mobile app support for field workers?
5. Do we need e-signature integration (DocuSign) for high-stakes certifications?
6. Should we build a marketplace for compliance content creators?

---

## 10. Next Steps

1. **Validate** this PRD with 3-5 compliance officers at target companies
2. **Prioritize** Phase 1 features for immediate development
3. **Design** the compliance dashboard UI mockups
4. **Prototype** the program creation wizard
5. **Plan** data migration strategy for existing ClassroomIO courses
