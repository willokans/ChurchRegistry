# NDPA Governance Runbook (Internal Only)

Internal confidentiality: do not publish this document to end users.

This runbook contains internal governance controls for:

- retention schedule for production data
- Data Subject Request (DSR) handling workflow
- incident response procedure
- backup and restore operations

Public-facing privacy language is maintained separately in `docs/PRIVACY_NOTICE.md`.

Applies to the Church Registry SaaS stack:

- frontend: Next.js UI
- backend: Spring Boot API
- data/storage: Supabase Postgres and private storage buckets
- hosting: Fly.io and Vercel

> Legal note: this is an operational baseline, not legal advice. Have diocesan counsel and your NDPA compliance lead approve before broad rollout.

---

## 1) Retention Schedule

The following retention schedule is the default baseline. If diocesan canon/legal policy requires longer retention, the stricter requirement prevails.

| Data Category | Examples | Default Retention | Rationale | Disposal Method |
|---|---|---|---|---|
| Sacramental register records | Baptism, communion, confirmation, marriage records | Long-term (institutional archive; no routine auto-delete) | Historical and ecclesiastical record obligations | Controlled archival only; no hard delete without lawful order |
| Issued certificates + metadata | Generated certificate PDFs, issue history | 7 years after issuance (or longer if linked to unresolved dispute) | Verification, audit, legal defense | Secure object deletion + metadata minimization |
| User accounts and role assignments | app_users, role/parish assignments | Duration of active service + 24 months | Operational continuity and accountability | Deactivate then purge/minimize personal fields |
| Authentication and access logs | Login attempts, session security telemetry | 12 months | Security monitoring and incident investigation | Time-based log purge |
| Immutable audit log events | Sensitive read/write/certificate events | 7 years minimum | Compliance traceability and investigations | WORM-style retention, then controlled archival/deletion |
| Support and ticket communications | Email/ticket threads | 24 months after closure | Service quality and dispute handling | Secure deletion from ticket/email systems |
| Backups (database snapshots) | Automated backups, restore points | 35 days rolling default (or provider limit) | Disaster recovery | Automatic expiration + cryptographic erase by provider |
| Incident records | Incident timeline, root-cause notes, actions | 6 years after closure | Compliance and audit history | Secure deletion/archival |

### 1.1 Retention Operations

- monthly: verify backup expiration and storage lifecycle controls
- quarterly: review retention exceptions and legal holds
- annually: re-approve schedule with diocesan leadership and compliance owner

### 1.2 Legal Holds

If litigation, regulator inquiry, or formal complaint is active:

- suspend deletion for relevant records immediately
- document hold scope, owner, and release criteria
- resume retention clock only when hold is closed in writing

---

## 2) DSR Workflow (Data Subject Requests)

This workflow covers access, correction, deletion, restriction/objection, portability, and consent withdrawal requests.

### 2.1 Intake Channels

- dedicated email: `[support@sacramentregistry.com]`
- web form: `[DSR form URL]`
- written parish office request (must be recorded in DSR tracker)

Create a DSR ticket with:

- request type
- requester identity details
- date/time received
- parish/diocese context
- SLA due date

### 2.2 SLA Targets

- acknowledgment: within 3 business days
- identity verification complete: within 7 business days
- fulfillment target: within 30 days of verified request
- extension: one additional period only when justified; notify requester with reason before original due date

### 2.3 Step-by-Step Procedure

1. Acknowledge request and issue ticket/reference ID.
2. Verify identity (match account email plus one additional verification factor).
3. Classify request (access/correction/deletion/etc.) and assess legal exemptions.
4. Scope data across Spring API records, Supabase tables, storage objects, and support systems.
5. Apply least-privilege review so only authorized compliance staff handle exported data.
6. Execute action:
   - access: compile export (machine-readable where practical)
   - correction: update inaccurate fields and log change
   - deletion: remove where permitted; if restricted, explain denial basis
   - restriction/objection: apply processing limitation flag where feasible
7. Perform quality check by compliance owner (and legal if high-risk).
8. Respond to requester in clear language with action summary and escalation options.
9. Close ticket with evidence artifacts and timestamps.

### 2.4 Required Evidence per DSR Ticket

- proof of identity verification
- systems searched and date ranges
- decision rationale (including exemptions, if any)
- response copy sent to requester
- closure approval by compliance owner

---

## 3) Incident Response and Backup/Restore Runbook

This runbook covers security incidents and disaster recovery operations.

### 3.1 Incident Severity Levels

- **SEV-1 (critical):** active breach, widespread data exposure, ransomware, or prolonged outage affecting core record access
- **SEV-2 (high):** contained unauthorized access, high-risk vulnerability with exploit path
- **SEV-3 (medium):** suspicious activity with no confirmed exposure
- **SEV-4 (low):** policy/process deviation with minimal risk

### 3.2 Incident Response Procedure

1. Detect and triage:
   - trigger sources: monitoring alerts, audit anomalies, user reports
   - assign incident commander and open incident log
2. Contain:
   - revoke compromised tokens/sessions
   - rotate affected secrets/keys
   - isolate impacted service components
3. Preserve evidence:
   - capture immutable logs, timestamps, system snapshots
   - document every action in incident timeline
4. Assess impact:
   - identify affected data subjects, parishes, and systems
   - classify confidentiality/integrity/availability impact
5. Notify:
   - internal stakeholders: engineering lead, compliance owner, diocesan operations
   - external notifications to NDPC/data subjects as required by NDPA, based on confirmed risk and statutory thresholds
6. Eradicate and recover:
   - patch root cause, re-deploy verified builds, re-enable services progressively
7. Post-incident review (within 10 business days):
   - root cause, control gaps, corrective actions with owners/due dates

### 3.3 Backup Policy Baseline

- database backups: automated daily snapshots plus point-in-time recovery where supported
- backup retention: rolling 35 days minimum
- encryption: in transit and at rest
- backup integrity checks: weekly restore validation in non-production
- access control: restore operations restricted to named on-call admins

### 3.4 Backup Restore Procedure (Operational Checklist)

1. Declare restore event and incident/change ticket ID.
2. Confirm restore target (full DB, point-in-time, or selected objects).
3. Freeze non-essential writes when needed to prevent divergence.
4. Restore to an isolated environment first.
5. Run verification:
   - schema migration state
   - sample sacramental records
   - authentication and authorization paths
   - certificate storage linkage
6. Obtain sign-off from incident commander plus compliance owner.
7. Promote restored dataset to production path.
8. Monitor for at least 24 hours and document outcome.

### 3.5 RTO/RPO Targets

- **RTO target:** 4 hours for critical API restoration
- **RPO target:** 24 hours maximum data loss window (aim lower where feasible)

Review these targets quarterly against actual recovery exercises.

---

## 4) Governance Ownership and Review Cadence

- **Document owner:** Compliance Lead (`[name/role]`)
- **Technical owner:** Engineering Lead (`[name/role]`)
- **Approval authority:** Diocesan Operations/Legal (`[name/role]`)
- **Review cycle:** Quarterly, and after any material platform or legal change

Minimum recurring activities:

- quarterly DSR workflow drill
- quarterly incident tabletop exercise
- monthly backup restore smoke test
- annual retention and operations policy refresh

---

## 5) Immediate Implementation Checklist

- [ ] Create DSR intake email alias and tracker (ticket template with SLA fields).
- [ ] Add retention lifecycle rules for logs and storage objects where configurable.
- [ ] Run first backup restore test and store evidence in operations records.
- [ ] Nominate and record named owners for compliance and incident command.
- [ ] Obtain legal/compliance sign-off and date-stamp this document.

# NDPA Governance Pack (Privacy, Retention, DSR, Incident/Backup)

This document finalizes the governance baseline required for pilot readiness:

- NDPA-aligned privacy notice (publishable text)
- retention schedule for production data
- Data Subject Request (DSR) workflow
- incident response and backup/restore runbook

Applies to the Church Registry SaaS stack:

- frontend: Next.js UI
- backend: Spring Boot API
- data/storage: Supabase Postgres and private storage buckets
- hosting: Fly.io and Vercel

> Legal note: this is an operational baseline, not legal advice. Have diocesan counsel and your NDPA compliance lead approve before broad rollout.

---

## 1) Privacy Notice (NDPA-Aligned)

Use this section as your website/app privacy notice (update bracketed placeholders before publishing).

### 1.1 Controller Details

- Data Controller: `[Legal Church Entity Name]`
- Address: `[Registered Address]`
- Contact email: `[support@sacramentregistry.com]`
- Data Protection Contact (if applicable): `[DPO name/email]`

### 1.2 What We Process

We process personal data to operate parish sacramental record management and certificate issuance. Data categories may include:

- identity/contact data (name, phone, email, address)
- sacramental record data (baptism, first holy communion, confirmation, marriage details)
- parish/diocese administrative data (parish assignment, user role)
- technical/security data (login events, IP/device metadata, audit log events)
- support communications and operational records

### 1.3 Why We Process Data

We process personal data for the following purposes:

- maintain sacramental registers and records
- issue and verify sacrament certificates
- enforce role-based and parish-based access controls
- secure the platform, detect abuse, and investigate incidents
- comply with legal, ecclesiastical, and audit obligations

### 1.4 Legal Basis

Where NDPA requires a legal basis, processing is generally based on one or more of:

- performance of a service requested by the data subject or parish
- compliance with legal/regulatory obligations
- legitimate interests in secure recordkeeping and fraud prevention
- consent, where consent is specifically requested

### 1.5 Data Sharing

We share data only as required to deliver the service and maintain security:

- infrastructure providers (hosting, managed database/storage)
- authorized diocesan/parish personnel based on assigned role
- regulators, legal authorities, or auditors where legally required

We do not sell personal data.

### 1.6 International Transfers

Where data is processed outside Nigeria, we apply contractual and technical safeguards consistent with NDPA requirements and NDPC guidance.

### 1.7 Retention

We retain data only as long as required for sacramental, legal, operational, and security purposes. The detailed retention schedule is in Section 2 of this document.

### 1.8 Data Subject Rights

Subject to NDPA and applicable exemptions, data subjects may request:

- access to their data
- correction of inaccurate data
- deletion (where legally permissible)
- restriction or objection to processing (where applicable)
- data portability (where applicable)
- withdrawal of consent for consent-based processing

Requests can be submitted via `[privacy email/form URL]`. We verify identity before actioning requests.

### 1.9 Security

We use layered controls including authenticated access, role and parish authorization checks, immutable audit logging for sensitive actions, encrypted transport (HTTPS), and controlled backup/restore operations.

### 1.10 Complaints

If a data subject believes their data rights were violated, they may contact us first at `[privacy contact]` and may also escalate to the Nigeria Data Protection Commission (NDPC) as provided by law.

### 1.11 Updates to This Notice

We may update this notice periodically. Material changes are communicated in-app or through official diocesan/parish channels.

---

## 2) Retention Schedule

The following retention schedule is the default baseline. If diocesan canon/legal policy requires longer retention, the stricter requirement prevails.

| Data Category | Examples | Default Retention | Rationale | Disposal Method |
|---|---|---|---|---|
| Sacramental register records | Baptism, communion, confirmation, marriage records | Long-term (institutional archive; no routine auto-delete) | Historical and ecclesiastical record obligations | Controlled archival only; no hard delete without lawful order |
| Issued certificates + metadata | Generated certificate PDFs, issue history | 7 years after issuance (or longer if linked to unresolved dispute) | Verification, audit, legal defense | Secure object deletion + metadata minimization |
| User accounts and role assignments | app_users, role/parish assignments | Duration of active service + 24 months | Operational continuity and accountability | Deactivate then purge/minimize personal fields |
| Authentication and access logs | Login attempts, session security telemetry | 12 months | Security monitoring and incident investigation | Time-based log purge |
| Immutable audit log events | Sensitive read/write/certificate events | 7 years minimum | Compliance traceability and investigations | WORM-style retention, then controlled archival/deletion |
| Support and ticket communications | Email/ticket threads | 24 months after closure | Service quality and dispute handling | Secure deletion from ticket/email systems |
| Backups (database snapshots) | Automated backups, restore points | 35 days rolling default (or provider limit) | Disaster recovery | Automatic expiration + cryptographic erase by provider |
| Incident records | Incident timeline, root-cause notes, actions | 6 years after closure | Compliance and audit history | Secure deletion/archival |

### 2.1 Retention Operations

- monthly: verify backup expiration and storage lifecycle controls
- quarterly: review retention exceptions and legal holds
- annually: re-approve schedule with diocesan leadership and compliance owner

### 2.2 Legal Holds

If litigation, regulator inquiry, or formal complaint is active:

- suspend deletion for relevant records immediately
- document hold scope, owner, and release criteria
- resume retention clock only when hold is closed in writing

---

## 3) DSR Workflow (Data Subject Requests)

This workflow covers access, correction, deletion, restriction/objection, portability, and consent withdrawal requests.

### 3.1 Intake Channels

- dedicated email: `[support@sacramentregistry.com]`
- web form: `[DSR form URL]`
- written parish office request (must be recorded in DSR tracker)

Create a DSR ticket with:

- request type
- requester identity details
- date/time received
- parish/diocese context
- SLA due date

### 3.2 SLA Targets

- acknowledgment: within 3 business days
- identity verification complete: within 7 business days
- fulfillment target: within 30 days of verified request
- extension: one additional period only when justified; notify requester with reason before original due date

### 3.3 Step-by-Step Procedure

1. **Acknowledge request** and issue ticket/reference ID.
2. **Verify identity** (match account email + one additional verification factor).
3. **Classify request** (access/correction/deletion/etc.) and assess legal exemptions.
4. **Scope data** across Spring API records, Supabase tables, storage objects, and support systems.
5. **Apply least-privilege review** so only authorized compliance staff handle exported data.
6. **Execute action**:
   - access: compile export (machine-readable where practical)
   - correction: update inaccurate fields and log change
   - deletion: remove where permitted; if restricted, explain denial basis
   - restriction/objection: apply processing limitation flag where feasible
7. **Quality check** by compliance owner (and legal if high-risk).
8. **Respond to requester** in clear language with action summary and escalation options.
9. **Close ticket** with evidence artifacts and timestamps.

### 3.4 Required Evidence per DSR Ticket

- proof of identity verification
- systems searched and date ranges
- decision rationale (including exemptions, if any)
- response copy sent to requester
- closure approval by compliance owner

---

## 4) Incident Response and Backup/Restore Runbook

This runbook covers security incidents and disaster recovery operations.

### 4.1 Incident Severity Levels

- **SEV-1 (critical):** active breach, widespread data exposure, ransomware, or prolonged outage affecting core record access
- **SEV-2 (high):** contained unauthorized access, high-risk vulnerability with exploit path
- **SEV-3 (medium):** suspicious activity with no confirmed exposure
- **SEV-4 (low):** policy/process deviation with minimal risk

### 4.2 Incident Response Procedure

1. **Detect and triage**
   - trigger sources: monitoring alerts, audit anomalies, user reports
   - assign incident commander and open incident log
2. **Contain**
   - revoke compromised tokens/sessions
   - rotate affected secrets/keys
   - isolate impacted service components
3. **Preserve evidence**
   - capture immutable logs, timestamps, system snapshots
   - document every action in incident timeline
4. **Assess impact**
   - identify affected data subjects, parishes, and systems
   - classify confidentiality/integrity/availability impact
5. **Notify**
   - internal stakeholders: engineering lead, compliance owner, diocesan operations
   - external notifications to NDPC/data subjects as required by NDPA, based on confirmed risk and statutory thresholds
6. **Eradicate and recover**
   - patch root cause, re-deploy verified builds, re-enable services progressively
7. **Post-incident review (within 10 business days)**
   - root cause, control gaps, corrective actions with owners/due dates

### 4.3 Backup Policy Baseline

- database backups: automated daily snapshots + point-in-time recovery where supported
- backup retention: rolling 35 days minimum
- encryption: in transit and at rest
- backup integrity checks: weekly restore validation in non-production
- access control: restore operations restricted to named on-call admins

### 4.4 Backup Restore Procedure (Operational Checklist)

1. Declare restore event and incident/change ticket ID.
2. Confirm restore target (full DB, point-in-time, or selected objects).
3. Freeze non-essential writes when needed to prevent divergence.
4. Restore to an isolated environment first.
5. Run verification:
   - schema migration state
   - sample sacramental records
   - authentication and authorization paths
   - certificate storage linkage
6. Obtain sign-off from incident commander + compliance owner.
7. Promote restored dataset to production path.
8. Monitor for at least 24 hours and document outcome.

### 4.5 RTO/RPO Targets

- **RTO target:** 4 hours for critical API restoration
- **RPO target:** 24 hours maximum data loss window (aim lower where feasible)

Review these targets quarterly against actual recovery exercises.

---

## 5) Governance Ownership and Review Cadence

- **Document owner:** Compliance Lead (`[name/role]`)
- **Technical owner:** Engineering Lead (`[name/role]`)
- **Approval authority:** Diocesan Operations/Legal (`[name/role]`)
- **Review cycle:** Quarterly, and after any material platform or legal change

Minimum recurring activities:

- quarterly DSR workflow drill
- quarterly incident tabletop exercise
- monthly backup restore smoke test
- annual privacy notice and retention policy refresh

---

## 6) Immediate Implementation Checklist

- [ ] Publish privacy notice text in app/legal page and public website.
- [ ] Create DSR intake email alias and tracker (ticket template with SLA fields).
- [ ] Add retention lifecycle rules for logs and storage objects where configurable.
- [ ] Run first backup restore test and store evidence in operations records.
- [ ] Nominate and record named owners for compliance and incident command.
- [ ] Obtain legal/compliance sign-off and date-stamp this document.

