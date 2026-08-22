# Engineering OS

This is the reusable engineering system for building production software with humans and AI agents.

It is copied/adapted into every new repository. Project-specific rules may extend it, but should not silently contradict it.

---

# 00 — START HERE

## 00.1 Engineering Constitution

The non-negotiable rules governing all projects.

Include:

* Engineering principles
* AI-agent operating rules
* Definition of Done
* Security principles
* Testing philosophy
* Architecture principles
* Documentation requirements
* Git/commit rules
* Dependency policy
* Data integrity principles
* Observability principles
* "Stop and ask" conditions for AI agents

## 00.2 How We Build Software

The end-to-end workflow:

**Idea → Product decision → Specification → Architecture → Ticket → Inspect → Plan → Implement → Test → Review → Commit → Document → Deploy → Observe**

Explain what must happen at every stage.

## 00.3 AI Engineering Handbook

How humans work with Codex, Claude, ChatGPT and future agents.

Include:

* What AI may decide
* What AI must not decide
* Inspect-before-edit rule
* Context management
* Token/context discipline
* Agent roles
* Review-agent workflow
* Preventing AI bloat
* Preventing hallucinated architecture
* Preventing duplicate implementations
* When agents must stop
* How completion reports work

## 00.4 Project Bootstrap Checklist

Reusable checklist for starting any new software project.

---

# 01 — GLOBAL ENGINEERING STANDARDS

These should apply to essentially every repository.

## 01.1 Architecture Standards

Cover:

* Prefer simple architecture
* Modular boundaries
* Separation of concerns
* Dependency direction
* When to introduce services
* When NOT to abstract
* Modular monolith vs microservices
* API boundaries
* Background jobs
* Events
* Caching
* External integrations

Core rule:

> Complexity must be justified by an actual requirement.

## 01.2 Database Standards

Cover:

* Primary keys
* Foreign keys
* NOT NULL
* Unique constraints
* Check constraints
* Indexes
* Transactions
* Race conditions
* Idempotency
* Migration rules
* Soft deletion
* Data retention
* Audit data
* Backups

Core rule:

> Critical business invariants should be protected by the database whenever practical.

## 01.3 API Standards

Define:

* REST conventions
* Resource naming
* HTTP status codes
* Pagination
* Cursor pagination
* Error format
* Validation
* Authentication
* Authorization
* Rate limiting
* Idempotency
* Versioning
* Deprecation
* API documentation

## 01.4 Security Standards

Every feature asks:

* Who can perform this action?
* Who owns this resource?
* Can IDs be enumerated?
* Can authorization be bypassed?
* Can requests be replayed?
* Can requests race?
* Can the operation be spammed?
* Is sensitive information exposed?
* What gets logged?
* What happens after account deletion?
* What happens after access is revoked?
* What rate limits are required?
* What abuse cases exist?

Also cover:

* Secrets
* Environment variables
* Authentication
* Authorization
* CSRF
* CORS
* SSRF
* XSS
* SQL injection
* Upload security
* Dependency vulnerabilities
* Encryption
* Logging sensitive information
* Key rotation
* Incident response

## 01.5 Testing Standards

Define the testing pyramid appropriate to the project.

Include:

* Unit tests
* Model/domain tests
* Request/API tests
* Integration tests
* System/E2E tests
* Security regression tests
* Concurrency tests
* Negative tests

Every bug fix should normally include a regression test.

## 01.6 Code Quality Standards

Include:

* Naming
* File size guidance
* Function/method complexity
* Comments
* Dead code
* Duplication
* Error handling
* Logging
* Feature flags
* Configuration
* Framework conventions

Core rule:

> Prefer boring, obvious code over clever code.

## 01.7 Dependency Standards

Before adding a dependency ask:

1. What problem does it solve?
2. Can the framework already solve it?
3. Is it actively maintained?
4. What security exposure does it introduce?
5. How difficult would removing it be?
6. Does the project actually need it?

AI agents must not casually install packages.

## 01.8 Git Standards

Define:

* Branch strategy
* Commit format
* PR expectations
* No unrelated changes
* No generated junk
* No secrets
* Migration handling
* Revert strategy

Example:

`feat(discovery): add online filtering`

`fix(media): revoke deleted photo access`

`test(blocking): cover discovery visibility`

---

# 02 — AI AGENT OPERATING SYSTEM

## 02.1 Agent Roles

Define responsibilities.

### Engineering Lead

Architecture, requirements, sequencing, review.

### Implementation Agent

Repository inspection, implementation and tests.

### Review Agent

Attempts to break the implementation.

### Security Reviewer

Threat-models sensitive work.

### UI Agent

Frontend implementation without changing backend contracts arbitrarily.

Agents can change over time. Roles matter more than products.

## 02.2 Inspect Before Editing

Reusable protocol:

Before implementing non-trivial work:

1. Inspect relevant repository areas.
2. Identify existing implementation.
3. Identify conventions.
4. Identify related tests.
5. Identify database constraints.
6. Identify ADRs.
7. Identify security implications.
8. Report conflicts.
9. Propose implementation plan.
10. Only then implement.

## 02.3 AI Stop Conditions

Agents MUST stop rather than guess when:

* Requirements conflict.
* An ADR would be violated.
* A migration risks destructive data loss.
* Authentication architecture must change.
* Authorization behaviour is unclear.
* Security requirements conflict with convenience.
* Existing code implements the same concept differently.
* A major dependency must be introduced.
* Public API behaviour must break.
* Significant unrelated refactoring appears necessary.
* Production secrets/infrastructure would be affected unexpectedly.

## 02.4 Context & Token Management

Define four layers:

### Layer 1 — Global

Engineering rules.

### Layer 2 — Project

What this particular product/system is.

### Layer 3 — Domain

Authentication, payments, messaging, media, etc.

### Layer 4 — Ticket

Only the information necessary for the current task.

Do not dump the entire company's history into every agent session.

## 02.5 Agent Completion Report

Every substantial implementation reports:

### IMPLEMENTED

What changed.

### FILES CHANGED

Files created/modified/deleted.

### DATABASE CHANGES

Migrations, indexes, constraints.

### API CHANGES

Endpoints/contracts affected.

### TESTS ADDED

Tests introduced.

### VERIFICATION

Commands executed and results.

### SECURITY IMPACT

Authorization, privacy, abuse implications.

### PERFORMANCE IMPACT

Queries, jobs, caching, N+1 concerns.

### DEPLOYMENT NOTES

Anything operations needs to know.

### KNOWN LIMITATIONS

Known shortcomings.

### NOT IMPLEMENTED

Anything intentionally left out.

### FOLLOW-UP

Recommended future work.

---

# 03 — REUSABLE TEMPLATES

## 03.1 Engineering Ticket Template

Every ticket contains:

### Title

### Priority

P0 / P1 / P2 / P3

### Problem

### Objective

### Context

### Existing Behaviour

### Desired Behaviour

### Invariants

Things that must always remain true.

### Non-Goals

Explicitly excluded work.

### User/Business Rules

### API Contract

### Data Model Impact

### Authorization

### Security & Abuse Cases

### Concurrency / Idempotency

### Observability

### Edge Cases

### Acceptance Criteria

### Tests Required

### Documentation Impact

### Definition of Done

---

## 03.2 Bug Ticket Template

Include:

* Observed behaviour
* Expected behaviour
* Reproduction
* Environment
* Evidence/logs
* Suspected area
* Severity
* Security impact
* Regression-test requirement
* Acceptance criteria

Never instruct an AI simply to "fix it somehow."

## 03.3 ADR Template

### ADR-XXXX: Decision

**Status:** Proposed / Accepted / Superseded / Rejected

### Context

Why was a decision required?

### Decision

What did we choose?

### Alternatives Considered

What else could we have done?

### Why

Why did this option win?

### Consequences

What do we gain and lose?

### Security Implications

### Operational Implications

### Reversal Cost

### Supersedes

If applicable.

AI agents must not silently overturn Accepted ADRs.

## 03.4 Feature Specification Template

Include:

* Problem
* Users
* User journey
* Product rules
* Permissions
* States
* State transitions
* Failure behaviour
* Abuse cases
* Notifications
* Analytics
* Backend requirements
* Frontend requirements
* Definition of Done

## 03.5 API Endpoint Template

Include:

* Method
* Path
* Authentication
* Authorization
* Request
* Response
* Errors
* Rate limit
* Idempotency
* Side effects
* Audit events
* Examples

## 03.6 Incident/Postmortem Template

Include:

* Summary
* Impact
* Timeline
* Detection
* Root cause
* Contributing factors
* Resolution
* What went well
* What failed
* Corrective actions
* Regression prevention

Blameless toward people; uncompromising toward systems.

---

# 04 — PROJECT BOOTSTRAP

Every new project gets its own section.

Template:

# PROJECT — [NAME]

## 00 Project Context

### PROJECT.md

What are we building?

Must contain:

* Product
* Users
* Problem
* Business model
* Current stage
* Scope
* Non-goals
* Major constraints

### PRODUCT.md

How should the product behave?

### ARCHITECTURE.md

How is the system constructed?

### STACK.md

Technologies and why they were selected.

### AGENTS.md

Instructions specifically for AI agents working in this repository.

### SECURITY.md

Project-specific threat model and security rules.

### TESTING.md

Project-specific testing strategy and commands.

### OPERATIONS.md

Deployment, environments, infrastructure and monitoring.

### DATA.md

Data model principles, sensitive information and retention.

### API.md

API conventions/contracts.

### CONTRIBUTING.md

Human/AI contribution workflow.

---

# 05 — PROJECT ARCHITECTURE

For each project maintain:

## System Context

Users and external systems.

## Components

Major modules/services.

## Data Flow

How information travels through the system.

## Trust Boundaries

Where security boundaries exist.

## External Services

For every provider record:

* Purpose
* Owner
* Environment
* Data shared
* Failure behaviour
* Rate limits
* Cost considerations
* Replacement strategy

## Architecture Diagram

Keep this current.

---

# 06 — ADR REGISTER

Database-like Notion table:

| ID | Decision | Status | Domain | Date | Supersedes |
| -- | -------- | ------ | ------ | ---- | ---------- |

Examples:

ADR-0001 — Application architecture

ADR-0002 — Authentication

ADR-0003 — Media storage

ADR-0004 — Background jobs

ADR-0005 — API versioning

Do not number ADRs differently per agent.

---

# 07 — ENGINEERING BACKLOG

Use a Notion database.

Properties:

**Ticket**

**Project**

**Domain**

**Priority**

**Status**

**Risk**

**Owner/Agent**

**Specification Ready**

**Security Review**

**Tests**

**PR/Commit**

**Blocked By**

**ADR**

**Release**

Statuses:

Idea → Needs Spec → Ready → Inspecting → Implementing → Review → Verification → Done

Do not consider "agent wrote code" equivalent to Done.

---

# 08 — PROJECT SCORECARD

Every project should maintain a capability matrix.

Example:

| Capability       | Built | Tested | Secured | Observed | Production Ready |
| ---------------- | ----- | ------ | ------- | -------- | ---------------- |
| Authentication   |       |        |         |          |                  |
| Authorization    |       |        |         |          |                  |
| Profiles         |       |        |         |          |                  |
| Media            |       |        |         |          |                  |
| Search           |       |        |         |          |                  |
| Notifications    |       |        |         |          |                  |
| Admin            |       |        |         |          |                  |
| Account deletion |       |        |         |          |                  |
| Monitoring       |       |        |         |          |                  |
| Backups          |       |        |         |          |                  |

This exposes "lots of code" versus "finished software."

---

# 09 — SECURITY & THREAT MODEL

Maintain per project.

## Assets

What needs protecting?

## Actors

Who uses the system?

## Attackers

Who might abuse it?

## Entry Points

APIs, uploads, login, webhooks, admin, etc.

## Trust Boundaries

## Abuse Cases

## Privacy Risks

## Rate Limits

## Audit Requirements

## Incident Procedures

## Security Debt

Security debt becomes tickets rather than forgotten observations.

---

# 10 — PRODUCTION READINESS

## Launch Checklist

* [ ] Authentication reviewed
* [ ] Authorization reviewed
* [ ] Rate limiting implemented
* [ ] Input validation
* [ ] Database constraints
* [ ] Migrations tested
* [ ] Backups tested
* [ ] Restore procedure tested
* [ ] Error monitoring
* [ ] Performance monitoring
* [ ] Structured logs
* [ ] Health checks
* [ ] Secrets reviewed
* [ ] CORS reviewed
* [ ] Upload security reviewed
* [ ] Account deletion tested
* [ ] Privacy behaviour tested
* [ ] Abuse/reporting workflow
* [ ] Dependency audit
* [ ] Load testing
* [ ] Rollback procedure

---

# 11 — OPERATIONS

Maintain:

## Environments

Local / Test / Staging / Production

## Infrastructure

## Deployment Runbook

## Rollback Runbook

## Backup Runbook

## Restore Runbook

## Incident Runbook

## Monitoring

## Capacity

## Costs

## External Dependencies

The goal is that production operation does not exist only in the founder's memory.

---

# 12 — ENGINEERING JOURNAL

Keep a lightweight chronological record.

Example:

## 2026-08-22

### Completed

...

### Decisions

...

### Problems discovered

...

### Technical debt created

...

### Follow-up

...

This is especially useful with AI because tomorrow's agent has no reliable knowledge of yesterday unless we preserve the important state.

---

# 13 — TECHNICAL DEBT REGISTER

Every discovered issue should have somewhere to go.

Properties:

**Debt**

**Project**

**Domain**

**Severity**

**Why it exists**

**Risk**

**Remediation**

**Ticket**

**Target release**

This prevents:

> "We should fix that later."

from becoming permanent architecture.

---

# 14 — AI FAILURE LOG

This deserves its own database in the AI era.

Record cases where an agent:

* duplicated existing functionality
* invented APIs
* misunderstood architecture
* weakened security
* added unnecessary dependencies
* performed unrelated refactoring
* claimed tests passed when they did not
* produced incomplete work
* caused regressions
* ignored an ADR
* consumed excessive context/tokens

Record:

**What happened → Why → Detection → Correction → New rule**

The important part is the final field.

Every recurring AI mistake should improve the Engineering OS.

---

# 15 — PROMPT LIBRARY

Maintain reusable prompts rather than reinventing instructions.

Create:

## Repository Audit Prompt

## Ticket Inspection Prompt

## Implementation Prompt

## Bug Investigation Prompt

## Adversarial Code Review Prompt

## Security Review Prompt

## Performance Review Prompt

## Database Review Prompt

## Production Readiness Prompt

## Architecture Review Prompt

## Dependency Review Prompt

## Refactoring Prompt

Prompts should reference project documentation rather than embedding enormous amounts of duplicated context.

---

# 16 — DEFINITION OF DONE

A feature is not Done merely because code exists.

Unless explicitly not applicable, Done means:

* [ ] Requirements satisfied
* [ ] Existing architecture inspected
* [ ] No conflicting ADR
* [ ] Authorization implemented
* [ ] Validation implemented
* [ ] Database integrity protected
* [ ] Happy path tested
* [ ] Negative paths tested
* [ ] Abuse cases considered
* [ ] Race conditions considered
* [ ] Regression tests added
* [ ] Relevant test suite passes
* [ ] Static/lint checks pass
* [ ] Observability considered
* [ ] Documentation updated
* [ ] Deployment implications documented
* [ ] No unrelated changes
* [ ] Known limitations reported
* [ ] Completion report produced
* [ ] Commit/PR is coherent

---

# 17 — REPOSITORY DOCUMENTATION PACKAGE

When starting a project, adapt the relevant Engineering OS material into the repository.

Recommended baseline:

```text
/
├── AGENTS.md
├── README.md
├── CONTRIBUTING.md
│
├── docs/
│   ├── PROJECT.md
│   ├── PRODUCT.md
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   ├── TESTING.md
│   ├── OPERATIONS.md
│   ├── DATA.md
│   ├── API.md
│   │
│   ├── adr/
│   │   ├── README.md
│   │   ├── 0001-architecture.md
│   │   └── ...
│   │
│   ├── features/
│   ├── runbooks/
│   └── diagrams/
│
└── .github/
    ├── pull_request_template.md
    └── ISSUE_TEMPLATE/
```

Do **not** blindly copy every document.

Bootstrap a new repository by asking:

1. Which global rules apply?
2. Which rules do not apply?
3. What project-specific rules are required?
4. Which ADRs must be established immediately?
5. What information does an AI agent actually need?
6. What should remain in Notion instead of polluting the repository?

---

# The Golden Rule

**Notion is organizational memory.**

**The repository is engineering truth.**

If an AI agent needs a rule to correctly modify the repository, that rule should eventually exist close to the code rather than only inside Notion.

Notion holds the master operating system, portfolio knowledge, planning, historical context and reusable templates.

The repository holds the project's current architecture, commands, constraints, ADRs and agent instructions.

---

# Continuous Improvement Rule

This Engineering OS is itself a product.

Whenever we discover:

* an AI failure
* a production incident
* a recurring bug pattern
* a better workflow
* an architectural lesson
* a security lesson
* wasted token usage
* review failure
* deployment failure

ask:

> Is this specific to this project, or should every future project learn from it?

If universal:

**Update Engineering OS.**

If project-specific:

**Update project documentation.**

If architectural:

**Create/update ADR.**

If actionable:

**Create ticket.**

That is how the engineering system improves instead of repeatedly paying tuition for the same mistakes.

# 02 — ENGINEERING SKILLS

Skills are reusable operating procedures that teach humans and AI agents **how to perform recurring engineering work consistently**.

A skill is not a project specification and not merely a prompt.

A good skill contains expertise, procedure, checks, failure modes, expected output, and stopping conditions.

---

# Skill Categories

## 01 — Repository Skills

* Repository Audit
* Repository Onboarding
* Codebase Mapping
* Legacy Code Investigation
* Dependency Audit
* Dead Code Analysis
* Technical Debt Assessment

## 02 — Architecture Skills

* Architecture Review
* System Design
* ADR Creation
* ADR Review
* Domain Boundary Analysis
* Data Flow Analysis
* Architecture Drift Detection
* Refactoring Assessment

## 03 — Backend Skills

* API Design
* Database Design
* Migration Review
* Authorization Review
* Background Job Design
* Caching Design
* Rate Limiting
* Idempotency Design
* Concurrency Review
* Webhook Design
* External Integration Design

## 04 — Frontend Skills

* UI Implementation
* Design Fidelity Review
* Accessibility Review
* State Management Review
* API Integration
* Responsive Review
* Frontend Performance
* Component Architecture

## 05 — Testing Skills

* Test Plan Creation
* Regression Testing
* Integration Testing
* E2E Testing
* Contract Testing
* Concurrency Testing
* Failure Injection
* Test Gap Analysis

## 06 — Security Skills

* Threat Modeling
* Authentication Review
* Authorization Audit
* API Security Review
* File Upload Security
* Privacy Review
* Secrets Audit
* Dependency Security
* Abuse Modeling
* Data Exposure Review

## 07 — Production Skills

* Production Readiness Review
* Deployment Review
* Rollback Planning
* Incident Investigation
* Postmortem
* Backup Verification
* Restore Verification
* Capacity Review
* Performance Investigation
* Observability Review

## 08 — AI Engineering Skills

* Agent Task Preparation
* Context Preparation
* Agent Code Review
* AI Bloat Detection
* Hallucination Detection
* Agent Completion Verification
* Cross-Agent Review
* Token/Context Optimization
* Agent Failure Analysis

---

# Standard Skill Format

Every skill should follow roughly the same structure.

## SKILL: [Name]

### Purpose

What problem does this skill solve?

### Use When

Conditions that should trigger this skill.

### Do Not Use When

Situations where another procedure is more appropriate.

### Required Inputs

What information must exist before starting?

### Required Context

Which project documents should be read?

### Procedure

Exact sequence of operations.

### Checks

Things that must explicitly be verified.

### Failure Modes

Common ways this task goes wrong.

### Stop Conditions

Conditions under which the agent must stop rather than guess.

### Tools

Which tools are appropriate.

### Output Contract

Exactly what the skill should produce.

### Evidence Required

What proves the work was actually performed?

### Definition of Done

Conditions required before claiming completion.

### Related Skills

Other skills that may need to run before/after this one.

### Lessons Learned

Improvements discovered through real usage.

---

# Example — Repository Audit Skill

## Purpose

Build an evidence-based understanding of an unfamiliar repository before making architectural or implementation decisions.

## Use When

* Starting work on an existing repository
* Returning after substantial changes
* Planning major architecture work
* Taking over AI-generated code
* Investigating unexpected architecture

## Procedure

1. Inspect repository structure.
2. Identify runtime/framework versions.
3. Identify application entry points.
4. Inspect dependency manifests.
5. Identify persistence technologies.
6. Identify authentication.
7. Identify authorization.
8. Identify external services.
9. Inspect test structure.
10. Inspect CI/CD.
11. Inspect deployment configuration.
12. Read AGENTS.md.
13. Read architecture documentation.
14. Read relevant ADRs.
15. Inspect recent migrations.
16. Identify unfinished or duplicated systems.
17. Run appropriate verification commands.
18. Produce evidence-based report.

## Never

Do not modify application code while performing an audit unless explicitly instructed.

Do not infer implementation from README claims when the source code can verify it.

Do not claim something is absent without searching for it.

## Output

### Repository State

### Architecture

### Domains

### Data Layer

### APIs

### Authentication

### Authorization

### Background Processing

### External Services

### Testing

### Infrastructure

### Security

### Technical Debt

### Contradictions

### Risks

### Recommended Next Actions

Every important conclusion should point to supporting files/code.

---

# Example — Adversarial Review Skill

## Purpose

Attempt to break an implementation rather than confirm that it looks reasonable.

## Inspect For

* Authorization bypass
* IDOR
* Missing ownership checks
* Race conditions
* Duplicate requests
* Replay
* Invalid state transitions
* Rate-limit bypass
* Privacy leaks
* N+1 queries
* Missing indexes
* Incorrect transactions
* Unbounded queries
* Unsafe uploads
* Sensitive logging
* Missing negative tests
* Specification violations
* ADR violations
* Unnecessary abstractions

## Output

Findings should be ranked:

**P0 — Critical**

**P1 — High**

**P2 — Medium**

**P3 — Improvement**

For every finding provide:

* Evidence
* Why it matters
* Reproduction where possible
* Recommended correction

Do not manufacture findings simply to populate the report.

---

# Example — Agent Completion Verification Skill

Never accept:

> "Implemented successfully."

as sufficient evidence.

Verify:

1. Git diff.
2. Files changed.
3. Tests actually executed.
4. Test output.
5. New tests cover requirements.
6. Database migration.
7. Constraints/indexes.
8. Authorization.
9. Error behaviour.
10. Relevant ADR compliance.
11. Unrelated modifications.
12. Documentation.
13. Known limitations.

Compare implementation against the original ticket line by line.

Output:

### PASS

Requirements verified.

### PARTIAL

Requirements only partially implemented.

### FAIL

Implementation violates requirements.

### UNVERIFIED

Insufficient evidence exists.

---

# Skills vs Project Skills

Maintain two levels.

## Global Skills

Reusable across essentially every project.

Stored in the Engineering OS.

Examples:

`repository-audit`

`security-review`

`database-review`

`agent-verification`

`production-readiness`

## Project Skills

Created when a particular system requires specialized knowledge.

For D8N examples could eventually include:

`d8n-discovery-change`

`d8n-media-change`

`d8n-brand-policy-change`

`d8n-trust-change`

`d8n-messaging-change`

These contain knowledge that would be inappropriate for Weloid or Pathfinder.

---

# Repository Skills Directory

Where the agent/tool supports repository-local skills, maintain them close to the project.

Conceptually:

```text
/
├── AGENTS.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   └── adr/
│
└── skills/
    ├── repository-audit/
    │   └── SKILL.md
    │
    ├── implement-ticket/
    │   └── SKILL.md
    │
    ├── review-ticket/
    │   └── SKILL.md
    │
    ├── database-review/
    │   └── SKILL.md
    │
    ├── security-review/
    │   └── SKILL.md
    │
    └── project/
        ├── media-change/
        │   └── SKILL.md
        └── discovery-change/
            └── SKILL.md
```

Adapt the physical directory/layout to what the specific AI coding tool supports.

Do not blindly assume every agent discovers skills from the same location.

---

# Skills Must Stay Small

A skill should teach a capability, not contain the entire company handbook.

Bad:

`backend-engineering/SKILL.md` — 9,000 lines

Better:

`database-migration-review`

`api-design`

`authorization-review`

`incident-investigation`

Smaller skills improve context selection and reduce token waste.

---

# Progressive Context

Agents should receive knowledge progressively:

```text
GLOBAL RULES
      ↓
PROJECT CONTEXT
      ↓
RELEVANT SKILL
      ↓
RELEVANT ADR
      ↓
CURRENT TICKET
      ↓
RELEVANT CODE
```

Do not provide everything simultaneously.

---

# Skill Composition

Complex tasks can invoke several skills.

Example:

"Implement account deletion"

may require:

```text
repository-inspection
        ↓
data-lifecycle-review
        ↓
security-review
        ↓
implementation
        ↓
test-review
        ↓
completion-verification
```

The ticket determines the goal.

Skills determine how to perform the work safely.

---

# Skill Improvement Loop

When an agent makes a mistake, do not only repair the code.

Ask:

> Was this a one-off mistake or a missing engineering lesson?

If reusable, update the relevant skill.

Example:

Agent creates:

`User.exists?` → `User.create!`

and introduces a race condition.

Fix the implementation.

Then update `database-review`:

> Search for check-then-write operations where concurrent requests could violate uniqueness. Prefer database constraints and atomic operations.

Now every future project benefits from the failure.

This turns mistakes into organizational knowledge.

---

# Golden Rule for Skills

**Prompts request work.**

**Rules constrain work.**

**Context explains the system.**

**Skills teach how to work.**

**ADRs preserve decisions.**

**Tests prove behaviour.**

**Tools execute operations.**

Do not try to make one enormous AGENTS.md perform all seven jobs.
